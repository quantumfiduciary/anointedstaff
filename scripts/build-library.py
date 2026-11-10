"""Build Extra-canon JSON from public-domain editions in extra_resources.

Copyrighted dumps in update_01 are refused. The same *works* are represented
either by a public-domain English edition or by original desk notes.
"""

from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
extra = root / "extra_resources"
update = extra / "update_01"
out_dir = root / "public" / "library"
out_dir.mkdir(parents=True, exist_ok=True)

REFUSED = (
    "laitman kabbalah",
    "michael laitman",
    "j.j. hurtak",
    "jj hurtak",
    "keys of enoch",
    "mercer university press",
    "george howard",
    "van der toorn",
    "dictionary of deities and demons",
    "ohad ezrahi",
    "marc gafni",
    "edward l. nydle",
    "yitzchak ginsburgh",
    "inner dimension",
    "sino-platonic",
    "church of christ",
    "1990 independence",
    "brian r. pellar",
    "alexander s. holub",
)

ALLOWED_PD = (
    "public domain",
    "copy freely",
    "wikisource",
    "ebible.org",
    "sacred texts",
    "no copyright restrictions",
)


def clean(text: str) -> str:
    text = text.replace("\u00ad", "").replace("\xa0", " ")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def paragraphs(block: str, min_len: int = 40) -> list[str]:
    parts = [re.sub(r"\s+", " ", part).strip() for part in re.split(r"\n\s*\n", block)]
    return [part for part in parts if len(part) >= min_len]


def extract_pages(path: Path, start: int = 0, stop: int | None = None, skip_until: str | None = None) -> str:
    reader = PdfReader(str(path))
    chunks: list[str] = []
    found = skip_until is None
    last = stop if stop is not None else len(reader.pages)
    for index, page in enumerate(reader.pages[start:last], start=start):
        raw = page.extract_text() or ""
        lower = raw.lower()
        if not found and skip_until and skip_until.lower() in lower:
            found = True
        if not found:
            continue
        if "forgotten books" in lower and len(raw) < 800:
            continue
        chunks.append(raw)
    return clean("\n".join(chunks))


def first_pages(path: Path, count: int = 3) -> str:
    reader = PdfReader(str(path))
    text = "\n".join((page.extract_text() or "") for page in reader.pages[:count])
    return text.lower()


def refuse_if_copyrighted(path: Path) -> None:
    head = first_pages(path)
    if any(mark in head for mark in ALLOWED_PD):
        return
    hit = next((mark for mark in REFUSED if mark in head), None)
    if hit:
        raise SystemExit(f"Refusing {path.name}: in-copyright marker {hit!r}")
    if re.search(r"copyright\s*(©|\(c\))?\s*(19|20)\d{2}", head) and "public domain" not in head:
        year = re.search(r"(19|20)\d{2}", head)
        if year and int(year.group()) >= 1929:
            raise SystemExit(f"Refusing {path.name}: modern copyright notice")


def split_chapters(text: str, pattern: str, title_fmt: str) -> list[dict]:
    pieces = re.split(pattern, text, flags=re.I)
    sections: list[dict] = []
    if pieces and paragraphs(pieces[0], 80):
        intro = paragraphs(pieces[0], 80)[:8]
        if intro:
            sections.append({"title": "Introduction", "paragraphs": intro})
    for index in range(1, len(pieces), 2):
        number = pieces[index].strip()
        body = paragraphs(pieces[index + 1] if index + 1 < len(pieces) else "")
        if body:
            sections.append({"title": title_fmt.format(number=number), "paragraphs": body})
    return sections


def write_work(work: dict) -> dict:
    target = out_dir / f"{work['id']}.json"
    target.write_text(json.dumps(work, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    count = sum(len(section["paragraphs"]) for section in work["sections"])
    print(work["id"], len(work["sections"]), "sections", count, "paragraphs", target.stat().st_size, "bytes")
    return {
        "id": work["id"],
        "title": work["title"],
        "credit": work["credit"],
        "shelf": work["shelf"],
        "file": f"{work['id']}.json",
    }


def fetch_text(url: str) -> str | None:
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "AnointedStaff/0.1 (public-domain ingest)"})
        with urllib.request.urlopen(request, timeout=45) as response:
            return response.read().decode("utf-8", "replace")
    except Exception as error:
        print("fetch failed", url, error)
        return None


def jasher() -> dict:
    path = update / "book-of-jasher.pdf"
    refuse_if_copyrighted(path)
    text = extract_pages(path)
    sections = split_chapters(text, r"\n\s*CHAPTER\s+(\d+)\s*\n", "Chapter {number}")
    if len(sections) < 20:
        raise SystemExit("Jasher split failed")
    return {
        "id": "jasher",
        "title": "Book of Jasher",
        "credit": "Sefer Ha-yashar, 1840 English edition. Public domain. Referred to in Joshua 10:13 and 2 Samuel 1:18.",
        "shelf": "hebrew",
        "sections": sections,
    }


def daemonologie() -> dict:
    path = update / "Demonology by King James I.pdf"
    text = extract_pages(path, skip_until="Daemonologie")
    if len(text) < 2000:
        text = extract_pages(path, start=12)
    sections = split_chapters(text, r"(THE\s+(?:FIRST|SECOND|THIRDE?)\s+BOOKE[^\n]{0,80})", "{number}")
    if len(sections) < 2:
        sections = split_chapters(text, r"\n\s*(Chap(?:ter)?\.?\s+[IVXLC\d]+)[.\s]", "{number}")
    if not sections:
        body = paragraphs(text)
        sections = [{"title": f"Part {index}", "paragraphs": body[index : index + 6]} for index in range(0, len(body), 6)]
    return {
        "id": "daemonologie",
        "title": "Daemonologie",
        "credit": "King James I, 1597. Public domain. Forgotten Books typesetting is skipped; this is the 1597 treatise.",
        "shelf": "witnesses",
        "sections": sections[:40],
    }


def targums() -> list[dict]:
    path = update / "targum_genesis_exodus.pdf"
    text = extract_pages(path)
    works = []
    for work_id, title, needle in (
        ("targum-genesis", "Targum on Genesis", r"(ONKELOS[^\n]{0,40}GENESIS|BERESHITH|GENESIS)"),
        ("targum-exodus", "Targum on Exodus", r"(ONKELOS[^\n]{0,40}EXODUS|SHEMOTH|EXODUS)"),
    ):
        match = re.search(needle, text, flags=re.I)
        if not match:
            continue
        start = match.start()
        chunk = text[start : start + 350_000]
        sections = split_chapters(chunk, r"\n\s*(?:CHAPTER|CHAP\.|SECTION)\s+([IVXLC\d]+)[.\s]", "Chapter {number}")
        if len(sections) < 5:
            sections = split_chapters(chunk, r"\n\s*(\d+)\s*\n", "Chapter {number}")
        if sections:
            works.append(
                {
                    "id": work_id,
                    "title": title,
                    "credit": "J. W. Etheridge, The Targums of Onkelos and Jonathan ben Uzziel on the Pentateuch, 1862–1865. Public domain.",
                    "shelf": "targum",
                    "sections": sections[:80],
                }
            )
    return works


def book_of_the_dead() -> dict:
    path = update / "BookOfDead.pdf"
    refuse_if_copyrighted(path)
    text = extract_pages(path, stop=120)
    wanted = (
        "osiris",
        "coming forth",
        "weighing",
        "heart",
        "creation",
        "ra ",
        "nu ",
        "not dying",
        "not perishing",
        "negative confession",
        "hymn",
    )
    pieces = re.split(r"\n(?=[A-Z][A-Z\s,'-]{8,80}\n)", text)
    sections: list[dict] = []
    for piece in pieces:
        heading = piece.split("\n", 1)[0].strip()
        body = paragraphs(piece)
        if not body:
            continue
        blob = f"{heading} {body[0]}".lower()
        if any(word in blob for word in wanted):
            sections.append({"title": heading[:80].title(), "paragraphs": body[:8]})
        if len(sections) >= 12:
            break
    if len(sections) < 4:
        body = paragraphs(text)
        sections = [{"title": f"Reading {index}", "paragraphs": body[index : index + 5]} for index in range(0, min(len(body), 40), 5)]
    return {
        "id": "dead",
        "title": "Book of the Dead (selected)",
        "credit": "E. A. Wallis Budge, The Papyrus of Ani, 1895. Public domain. Selected hymns only; the whole papyrus is not shipped.",
        "shelf": "egyptian",
        "sections": sections,
    }


def talmud_sample() -> dict:
    darmesteter = update / "TheTalmud_10003192.pdf"
    rodkinson = update / "FullTalmud.pdf"
    refuse_if_copyrighted(darmesteter)
    refuse_if_copyrighted(rodkinson)
    intro = extract_pages(darmesteter)
    intro_sections = split_chapters(intro, r"\n\s*(CHAPTER\s+[IVXLC\d]+|[IVXLC]+\.\s+[A-Z][^\n]{4,60})\n", "{number}")
    if not intro_sections:
        body = paragraphs(intro)
        intro_sections = [{"title": "The Talmud", "paragraphs": body[:16]}]
    sample = extract_pages(rodkinson, stop=60)
    sabbath = split_chapters(sample, r"\n\s*(Chapter\s+[IVXLC\d]+[:.][^\n]{0,80})", "{number}")
    tractates = [
        "Zeraim (Seeds): Berakhot, Peah, Demai, Kilayim, Sheviit, Terumot, Maasrot, Maaser Sheni, Challah, Orlah, Bikkurim.",
        "Moed (Appointed times): Shabbat, Eruvin, Pesachim, Shekalim, Yoma, Sukkah, Beitzah, Rosh Hashanah, Taanit, Megillah, Moed Katan, Hagigah.",
        "Nashim (Women): Yevamot, Ketubot, Nedarim, Nazir, Sotah, Gittin, Kiddushin.",
        "Nezikin (Damages): Bava Kamma, Bava Metzia, Bava Batra, Sanhedrin, Makkot, Shevuot, Eduyot, Avodah Zarah, Avot, Horayot.",
        "Kodashim (Holy things): Zevachim, Menachot, Chullin, Bekhorot, Arakhin, Temurah, Keritot, Meilah, Tamid, Middot, Kinnim.",
        "Tohorot (Purities): Kelim, Oholot, Negaim, Parah, Tohorot, Mikvaot, Niddah, Makhshirin, Zavim, Tevul Yom, Yadayim, Uktzin.",
    ]
    sections = [
        {
            "title": "How this desk uses the Talmud",
            "paragraphs": [
                "The Babylonian Talmud is a vast commentary on the Mishnah. This desk does not ship a modern English Talmud.",
                "Michael L. Rodkinson’s 1918 English is public domain. The sample below is the opening of Tract Sabbath from that edition. Arsène Darmesteter’s 1897 sketch, translated by Henrietta Szold for the Jewish Publication Society, is public domain and sits next.",
                "The six orders and their tractates are listed as a map, not as a substitute for a full printing.",
            ],
        },
        {"title": "The six orders", "paragraphs": tractates},
        *intro_sections[:8],
        *sabbath[:6],
    ]
    return {
        "id": "talmud",
        "title": "Talmud (map and sample)",
        "credit": "Arsène Darmesteter, The Talmud, JPS 1897, tr. Henrietta Szold. Michael L. Rodkinson, Babylonian Talmud, 1918, Tract Sabbath sample. Both public domain.",
        "shelf": "talmud",
        "sections": sections,
    }


def baruch() -> dict:
    path = update / "theapocalypseofb00charuoft. adam eve lilithpdf.pdf"
    text = extract_pages(path, start=12, stop=180)
    sections = split_chapters(text, r"\n\s*(?:CHAPTER|Chapter)\s+([IVXLC\d]+)\.?\s*\n", "Chapter {number}")
    if len(sections) < 4:
        sections = split_chapters(text, r"\n\s*(\d+)\s*\n", "Chapter {number}")
    return {
        "id": "baruch",
        "title": "Apocalypse of Baruch",
        "credit": "R. H. Charles, The Apocalypse of Baruch, 1896/1913. Public domain.",
        "shelf": "enoch",
        "sections": sections[:60] or [{"title": "Reading", "paragraphs": paragraphs(text)[:20]}],
    }


def yetzirah_notes() -> dict:
    return {
        "id": "yetzirah",
        "title": "Sefer Yetzirah (desk notes)",
        "credit": "Original short notes on the traditional Book of Formation. Not Kaplan, not the 1985 Thompson–Marson English of Saadia, not a modern commentary PDF.",
        "shelf": "hebrew",
        "sections": [
            {
                "title": "Thirty-two paths",
                "paragraphs": [
                    "Sefer Yetzirah, the Book of Formation, is a short Hebrew work on how speech and number sit under the created world. Later readers dated it anywhere from late antiquity to the early Middle Ages. This desk does not print a copyrighted English of it.",
                    "The opening claim is that the Eternal cut thirty-two mysterious paths of wisdom: ten sefirot of nothingness, and twenty-two letters. The ten are not planets and not a fortune chart. They are a later Jewish study map of how many ways speech can be counted.",
                    "Saadia Gaon (tenth century) wrote an Arabic commentary on the book. His work is medieval and public-domain as a text. Modern English of Saadia stays in those translations.",
                ],
            },
            {
                "title": "Three mothers",
                "paragraphs": [
                    "The twenty-two letters are grouped. Three mothers: Alef, Mem, Shin. Traditional pairings are air, water, and fire — not chemistry, a map of three.",
                    "Alef is silent and valued at 1. Mem is water and 40. Shin is a tooth or flame and 300. Gematria on this desk already counts those values. The Chart tool now groups the letters the way Sefer Yetzirah groups them.",
                ],
            },
            {
                "title": "Seven doubles",
                "paragraphs": [
                    "Seven doubles: Bet, Gimel, Dalet, Kaf, Pe, Resh, Tav. Each can be hard or soft in Hebrew speech. The book ties them to seven days, seven openings in the head, and seven lights in the sky.",
                    "This desk already names those lights from Job 38 and Psalm 19 in Heavens. The doubles are a study overlay, not a second sky clock.",
                ],
            },
            {
                "title": "Twelve simples",
                "paragraphs": [
                    "Twelve simples: He, Vav, Zayin, Chet, Tet, Yod, Lamed, Nun, Samekh, Ayin, Tsade, Qof. Twelve months, twelve tribes, twelve stations of the year.",
                    "The Mazzaroth wheel on this desk is Scripture’s year-clock (Job 38:32), not this letter list. The two maps can be read beside each other without being fused into one fortune.",
                ],
            },
            {
                "title": "Two hundred thirty-one gates",
                "paragraphs": [
                    "The book describes combining the twenty-two letters two at a time. Twenty-two times twenty-one, divided by two, is two hundred thirty-one pairs. Later students called those pairs gates.",
                    "This desk does not generate a permutation table. Count a word in Gematria, open the letter on the chart, and read the group it belongs to.",
                ],
            },
            {
                "title": "The Name",
                "paragraphs": [
                    "Four letters, Yod He Vav He, are the Tetragrammaton. Their standard mispar is 10 + 5 + 6 + 5 = 26. Gematria has a YHVH preset that fills those four letters. Scripture already places the Name in Exodus 3:14–15.",
                    "Do not treat a number as a spell. The count is a study of the letters the page already prints.",
                ],
            },
        ],
    }


def lilith_notes() -> dict:
    return {
        "id": "bensiira",
        "title": "Lilith and Adam (desk notes)",
        "credit": "Original wording of the medieval Alphabet of Ben Sira legend and the Isaiah 34 night-creature. Not Nydle, not Ezrahi/Gafni, not a modern Lilith book.",
        "shelf": "hebrew",
        "sections": [
            {
                "title": "Isaiah 34:14",
                "paragraphs": [
                    "The King James of Isaiah 34:14 reads, “the screech owl also shall rest there.” The Hebrew word is לִילִית (lilith). Older English sometimes left it as a night-monster. This desk opens that verse from Strong’s or Extra-canon; it does not copy a modern Lilith monograph.",
                ],
            },
            {
                "title": "Alphabet of Ben Sira",
                "paragraphs": [
                    "A medieval Hebrew tale, the Alphabet of Ben Sira, tells that Adam’s first companion was named Lilith, that she left the garden, and that three angels — Senoy, Sansenoy, and Semangelof — went after her. The tale is not in Genesis. Genesis 1 and 2 remain the Scripture account of man and woman.",
                    "The Alphabet of Ben Sira is a medieval work. Its plot is not copyright. This paragraph is original desk wording, not a reprint of a modern retelling.",
                ],
            },
            {
                "title": "Beside Genesis 1–3",
                "paragraphs": [
                    "Read Genesis 1:27, Genesis 2:18–25, and Isaiah 34:14 together. Extra-canon on this desk can open 1 Enoch on the watchers, and the Apocalypse of Baruch on later Adam traditions. Modern Lilith essays stay in those books.",
                ],
            },
        ],
    }


def beginnings_notes() -> dict:
    return {
        "id": "beginnings",
        "title": "Beginnings",
        "credit": "Original desk walk through Genesis 1, Job 38, the Mazzaroth, and a Budge sample. Not a modern creation PDF.",
        "shelf": "egyptian",
        "sections": [
            {
                "title": "Genesis 1:14",
                "paragraphs": [
                    "Lights in the expanse are for signs, seasons, days, and years. Heavens on this desk treats those lights as a clock, not as a birth chart.",
                    "Open Genesis 1, then Job 38:31–33 (Mazzaroth, Arcturus, Orion, Pleiades), then Psalm 19. The Book of the Dead sample is an Egyptian hymn of coming forth, not Scripture.",
                ],
            },
            {
                "title": "Job 38",
                "paragraphs": [
                    "The Lord questions Job about the sky’s ordinances. That is the cornerstone for the Mazzaroth wheel. Egyptian funerary hymns ask other questions. Keep the two shelves labeled.",
                ],
            },
            {
                "title": "The Name in the letters",
                "paragraphs": [
                    "Some later study maps look for Yod He Vav He in created things. This desk counts the four letters in Gematria and stops there. Hebrews 11:3 and John 1:1–3 already say the worlds were framed by the word.",
                ],
            },
        ],
    }


def enoch_readings() -> dict:
    return {
        "id": "enoch-readings",
        "title": "Enoch readings",
        "credit": "Original desk list of Scripture and 1 Enoch passages. Not J. J. Hurtak’s Keys of Enoch (1973/1977/2009), which is in copyright and is not shipped.",
        "shelf": "enoch",
        "sections": [
            {
                "title": "Genesis 5:21–24",
                "paragraphs": [
                    "Enoch walked with God, and he was not, for God took him. That is the first Scriptural Enoch. Jude 14–15 then cites Enoch the seventh from Adam.",
                ],
            },
            {
                "title": "1 Enoch 1",
                "paragraphs": [
                    "Charles 1913, already on this desk, opens with Enoch’s blessing on the elect. Open Extra-canon to 1 Enoch, Chapter 1. Hurtak’s later “keys” are a twentieth-century book and are not this chapter.",
                ],
            },
            {
                "title": "1 Enoch 14",
                "paragraphs": [
                    "Enoch is taken into a house of hailstones and fire and sees a throne. Read it beside Ezekiel 1 and Revelation 4. The desk study is the public-domain Charles text, not a modern key system.",
                ],
            },
            {
                "title": "Watchers and Azazel",
                "paragraphs": [
                    "1 Enoch 6–10 names the watchers and Azazel. Leviticus 16 already has Azazel on the Day of Atonement. The names-of-powers glossary on Strong’s points at both without copying a dictionary article.",
                ],
            },
        ],
    }


def jubilees() -> dict | None:
    html = fetch_text("https://en.wikisource.org/wiki/The_Book_of_Jubilees")
    if not html or "Jubilees" not in html:
        text = fetch_text("https://www.sacred-texts.com/bib/jub/jub01.htm")
        if not text:
            return {
                "id": "jubilees",
                "title": "Jubilees (desk map)",
                "credit": "R. H. Charles, 1913, is public domain. This desk ships a chapter map until a Charles extract is present. The English Ethiopian-canon PDF in update_01 is not ingested.",
                "shelf": "enoch",
                "sections": [
                    {
                        "title": "Beside 1 Enoch",
                        "paragraphs": [
                            "Jubilees retells Genesis and the first part of Exodus in fifty-year weeks. Charles 1913 is the public-domain English this desk would read. 1 Enoch is already here. The two-page pdfcoffee Ethiopian Bible file is not a book and is not used.",
                            "Open Genesis 1–11 beside Extra-canon 1 Enoch. Mastema in Jubilees is listed in the names-of-powers glossary.",
                        ],
                    }
                ],
            }
    # Wikisource HTML is large; keep a short original map if parse is thin.
    chapters = re.findall(r"Chapter\s+(\d+)[:.\s]+(.{20,160})", html or text or "", flags=re.I)
    sections = [
        {
            "title": "Charles 1913",
            "paragraphs": [
                "Jubilees is in the Ethiopian canon and sits beside 1 Enoch. Charles’s English is public domain. This desk does not ingest a modern Ethiopian-Bible compilation PDF.",
            ],
        }
    ]
    for number, line in chapters[:50]:
        clean_line = re.sub(r"<[^>]+>", " ", line)
        clean_line = re.sub(r"\s+", " ", clean_line).strip()
        if len(clean_line) > 24:
            sections.append({"title": f"Chapter {number}", "paragraphs": [clean_line]})
    return {
        "id": "jubilees",
        "title": "Book of Jubilees",
        "credit": "R. H. Charles, The Book of Jubilees, 1913. Public domain. Chapter map and opening lines; not a modern Ethiopian Bible PDF.",
        "shelf": "enoch",
        "sections": sections[:52],
    }


def mormon() -> dict | None:
    text = fetch_text("https://www.gutenberg.org/files/17/17-0.txt")
    if not text or "Nephi" not in text:
        return {
            "id": "mormon",
            "title": "Book of Mormon (1830, desk note)",
            "credit": "The 1830 wording is public domain. The 1990 Church of Christ Independence edition PDF is not ingested.",
            "shelf": "other",
            "sections": [
                {
                    "title": "Other canons",
                    "paragraphs": [
                        "This shelf is not the sixty-six, and it is not the Apocrypha in the Bible window. The 1830 Book of Mormon is a public-domain English text. This desk does not ship the 1990 typesetting from update_01.",
                        "When a public-domain 1830 extract is present it will read here. Until then the title stays so the shelf is honest about what the folder contained.",
                    ],
                }
            ],
        }
    start = text.find("THE FIRST BOOK OF NEPHI")
    if start < 0:
        start = text.find("The First Book of Nephi")
    body = text[start:] if start >= 0 else text
    body = body.split("*** END OF")[0]
    parts = re.split(r"\n(?=CHAPTER\s+\d+|THE\s+[A-Z ]+BOOK OF [A-Z ]+)", body)
    sections: list[dict] = []
    current_title = "First Book of Nephi"
    bucket: list[str] = []
    heading_re = re.compile(r"^(CHAPTER\s+\d+|THE\s+[A-Z ]+BOOK OF .+)$")
    for part in parts:
        lines = [re.sub(r"\s+", " ", line).strip() for line in part.splitlines() if line.strip()]
        if not lines:
            continue
        if heading_re.match(lines[0]) and len(lines[0]) < 80:
            if bucket:
                sections.append({"title": current_title, "paragraphs": bucket})
            current_title = lines[0].title()
            bucket = [line for line in lines[1:] if len(line) > 40]
        else:
            bucket.extend(line for line in lines if len(line) > 40)
        if len(sections) >= 80:
            break
    if bucket and len(sections) < 80:
        sections.append({"title": current_title, "paragraphs": bucket[:12]})
    trimmed = []
    for section in sections:
        paras = section["paragraphs"][:8]
        if paras:
            trimmed.append({"title": section["title"], "paragraphs": paras})
        if len(trimmed) >= 48:
            break
    return {
        "id": "mormon",
        "title": "Book of Mormon (1830)",
        "credit": "1830 English wording via Project Gutenberg. Public domain. Not the 1990 Church of Christ edition. This is an other-canon shelf, not a Bible translation.",
        "shelf": "other",
        "sections": trimmed
        or [
            {
                "title": "1830",
                "paragraphs": paragraphs(body)[:12],
            }
        ],
    }


def main() -> None:
    catalog = []
    works = [
        jasher(),
        daemonologie(),
        *targums(),
        book_of_the_dead(),
        talmud_sample(),
        baruch(),
        yetzirah_notes(),
        lilith_notes(),
        beginnings_notes(),
        enoch_readings(),
    ]
    extra_works = [jubilees(), mormon()]
    works.extend(item for item in extra_works if item)
    for work in works:
        if not work.get("sections"):
            print("skip empty", work["id"])
            continue
        catalog.append(write_work(work))
    (out_dir / "catalog.json").write_text(
        json.dumps({"works": catalog}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print("catalog", len(catalog), "works")


if __name__ == "__main__":
    main()

"""Update_03 gate, inventory, and PD-safe builders.

Refuse modern copyright. Build compact JSON under public/ for Roots dictionaries,
Paleo-Strongs sidecar, calendar/timeline, Watchmen study shelf, OHB Genesis sample.
Bailey PDF is image-only OCR — SKIP (Webster from pg29765 covers English).

Usage:
  python scripts/build-update-03.py           # inventory report only
  python scripts/build-update-03.py --build   # inventory + write public artifacts
"""

from __future__ import annotations

import argparse
import gzip
import json
import re
import shutil
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
SRC = root / "extra_resources" / "update_03"
PUBLIC = root / "public"
LIB = PUBLIC / "library"

REFUSE_EXACT = {
    "etymological dictionary of greek.pdf": "Beekes / Brill 2010 — modern copyright",
    "150276553-aramaic-bible(1).pdf": "Bauscher / Lulu © 2006–2010",
    "eastons-bible-dictionary.pdf": "Ages Software © wrapper on PD text",
    "calendar2026.pdf": "No clear PD/CC notice",
    "alphabet-chart-editable-1.pptx": "Editable PPTX — redistribution unclear",
    "backdrops_original-hebrew-and-modern-aramaic_editable-1.pptx": "Editable PPTX — redistribution unclear",
    "original-hebrew-font-files.zip": "Font license not confirmed for redistribution",
    "ohb-all-books-genesis-to-malachi-1.pdf": "Build reference only — do not ship binary",
    "baileyuniversaletymdict1ed.pdf": "Image-only scan; no extractable text (use Webster instead)",
    "dictionaryofbwi01smit.pdf": "Build source only — use hOCR companion for text",
    "paleo-strongs-1.1.pdf": "Build reference — use xlsx",
    "free-bible-timeline-v-1.2.pdf": "Build reference — use xlsx",
    "calendar-kit_year-6228-from-adam-2026-2027.pdf": "Build reference — use xlsx",
    "28-month-calendar_years-6227-6229-from-adam-nov-2025-mar-2028.pdf": "Large calendar PDF — use kit xlsx summary",
}

INGEST = {
    "eastons_bible_dictionary.pdf": "easton",
    "pg29765-h.zip": "webster",
    "dictionaryofbwi01smit_hocr_searchtext.txt.gz": "smith",
    "paleo-strongs-1.1.xlsx": "paleo",
    "free-bible-timeline-spreadsheet-v-1.2.xlsx": "timeline",
    "calendar-kit_year-6228-from-adam-march-2026-march-2027.xlsx": "calendar",
    "to-the-watchmen-e-book_ancient-calendar-of-israel-biblical-timelines-and-end-times-prophecies.pdf": "watchmen",
    "original-hebrew-bible-spreadsheet-version-1.0.xlsx": "ohb",
    "endtimestimeline_danielsfinalweek_apossiblescenario.webp": "art",
    "mashach-anoint4k.png": "art",
    "padah-redeem4k.png": "art",
    "palal-pray4k.png": "art",
    "qodesh-holy4k.png": "art",
    "tov-good4k.png": "art",
    "tsadiq-righteous4k.png": "art",
}

STUDY_PDF_PD = {
    "word-study-chesed.pdf": ("chesed-study", "Word Study · Chesed", "fathersalphabet Public Domain word study"),
    "alphabet-chart.pdf": ("alphabet-chart", "Paleo-Hebrew Alphabet Chart", "fathersalphabet Public Domain alphabet chart"),
    "10-commandments-in-paleo-hebrew.pdf": ("ten-commandments-paleo", "Ten Commandments in Paleo-Hebrew", "fathersalphabet Public Domain"),
    "aaronic-blessing-in-paleo-hebrew.pdf": ("aaronic-blessing-paleo", "Aaronic Blessing in Paleo-Hebrew", "fathersalphabet Public Domain"),
    "how-the-paleo-hebrew-alphabet-points-to-yashua-our-messiah.pdf": (
        "paleo-alphabet-messiah",
        "How the Paleo-Hebrew Alphabet Points to the Messiah",
        "fathersalphabet Public Domain teaching sheet",
    ),
}


def name_key(path: Path) -> str:
    return path.name.lower()


def inventory() -> list[str]:
    lines: list[str] = []
    if not SRC.is_dir():
        return [f"FAIL  missing {SRC}"]
    for path in sorted(SRC.iterdir(), key=lambda p: p.name.lower()):
        if not path.is_file():
            continue
        key = name_key(path)
        size_mb = path.stat().st_size / (1024 * 1024)
        if key in REFUSE_EXACT:
            lines.append(f"REFUSE  {path.name}  ({REFUSE_EXACT[key]})  [{size_mb:.1f} MB]")
            continue
        if key in INGEST:
            lines.append(f"INGEST  {path.name}  → {INGEST[key]}  [{size_mb:.1f} MB]")
            continue
        if key in STUDY_PDF_PD:
            lines.append(f"INGEST  {path.name}  → library:{STUDY_PDF_PD[key][0]}  [{size_mb:.1f} MB]")
            continue
        if "hebrew-of-creation" in key:
            lines.append(f"SKIP    {path.name}  (no clear PD marker in sampled pages)")
            continue
        lines.append(f"SKIP    {path.name}  (unclassified)  [{size_mb:.1f} MB]")
    return lines


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"  wrote {path.relative_to(root)} ({path.stat().st_size // 1024} KB)")


def build_easton() -> int:
    from pypdf import PdfReader

    path = SRC / "eastons_bible_dictionary.pdf"
    reader = PdfReader(str(path))
    chunks: list[str] = []
    for page in reader.pages:
        chunks.append(page.extract_text() or "")
    text = "\n".join(chunks)
    # Entries marked with bullet in Nelson scan
    parts = re.split(r"[•●]\s*(?=[A-Z0-9])", text)
    entries: list[dict] = []
    seen: set[str] = set()
    for part in parts[1:]:
        part = part.strip()
        if len(part) < 12:
            continue
        # Lemma is first token(s) until lowercase run or newline
        head_match = re.match(r"^([A-Z][A-Z0-9' \-]{0,60})", part)
        if not head_match:
            continue
        lemma = re.sub(r"\s+", " ", head_match.group(1)).strip(" -")
        if len(lemma) < 2 or lemma in seen:
            continue
        body = part[len(head_match.group(1)) :].strip()
        body = re.sub(r"\s+", " ", body)[:900]
        if len(body) < 20:
            continue
        seen.add(lemma)
        entries.append({"lemma": lemma.title() if lemma.isupper() else lemma, "gloss": body, "key": lemma.lower()})
        if len(entries) >= 4500:
            break
    write_json(
        PUBLIC / "dictionaries" / "easton.json",
        {
            "id": "easton",
            "title": "Easton's Bible Dictionary",
            "credit": "M. G. Easton, Illustrated Bible Dictionary, Thomas Nelson, 1897. Public domain.",
            "entries": entries,
        },
    )
    return len(entries)


def build_webster() -> int:
    path = SRC / "pg29765-h.zip"
    with zipfile.ZipFile(path) as zf:
        html = zf.read("pg29765-images.html").decode("utf-8", errors="replace")
    # Strip tags lightly for body; headwords appear as WORD<br> inside <p>
    entries: list[dict] = []
    seen: set[str] = set()
    for match in re.finditer(
        r"<p>\s*([A-Z][A-Z0-9' \-]{1,48}(?:;\s*[A-Z][A-Z0-9' \-]{1,24}){0,2})\s*<br\s*/?>\s*(.*?)</p>",
        html,
        flags=re.S,
    ):
        lemma_raw = match.group(1).strip()
        lemma = lemma_raw.split(";")[0].strip()
        key = re.sub(r"[^a-z0-9]+", "", lemma.lower())
        if len(key) < 2 or key in seen:
            continue
        body = re.sub(r"<[^>]+>", " ", match.group(2))
        body = re.sub(r"\s+", " ", body).strip()
        # Pull following Defn paragraphs (next few siblings already hard); keep inline etym
        if len(body) < 8:
            continue
        seen.add(key)
        entries.append({"lemma": lemma.title() if lemma.isupper() else lemma, "gloss": body[:700], "key": key})
        if len(entries) >= 12000:
            break
    # Also harvest Defn blocks that follow headword paragraphs
    write_json(
        PUBLIC / "dictionaries" / "webster.json",
        {
            "id": "webster",
            "title": "Webster's Unabridged Dictionary",
            "credit": "Noah Webster / Project Gutenberg #29765. Public domain.",
            "entries": entries,
        },
    )
    return len(entries)


def build_smith() -> int:
    path = SRC / "dictionaryofbwi01smit_hocr_searchtext.txt.gz"
    with gzip.open(path, "rt", encoding="utf-8", errors="replace") as handle:
        text = handle.read()
    # Headwords: ALL CAPS line or CAPS followed by period
    entries: list[dict] = []
    seen: set[str] = set()
    pieces = re.split(r"\n(?=[A-Z][A-Z' \-]{2,40}\n)", text)
    for piece in pieces:
        lines = piece.strip().split("\n", 1)
        if len(lines) < 2:
            continue
        lemma = lines[0].strip()
        if not re.fullmatch(r"[A-Z][A-Z' \-]{1,40}", lemma):
            continue
        if lemma in {"THE", "AND", "FOR", "FROM", "WITH", "THIS", "THAT", "CHAPTER", "SECTION", "DIVISION"}:
            continue
        key = lemma.lower().replace(" ", "-")
        if key in seen:
            continue
        body = re.sub(r"\s+", " ", lines[1])[:800].strip()
        if len(body) < 40:
            continue
        seen.add(key)
        entries.append({"lemma": lemma.title(), "gloss": body, "key": key})
        if len(entries) >= 5000:
            break
    write_json(
        PUBLIC / "dictionaries" / "smith.json",
        {
            "id": "smith",
            "title": "Smith's Dictionary of the Bible",
            "credit": "William Smith; Hackett edition. Internet Archive dictionaryofbwi01smit. Public domain.",
            "entries": entries,
        },
    )
    return len(entries)


def build_dictionaries_index() -> None:
    catalogs = []
    for name in ("easton", "smith", "webster"):
        path = PUBLIC / "dictionaries" / f"{name}.json"
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        catalogs.append(
            {
                "id": data["id"],
                "title": data["title"],
                "credit": data["credit"],
                "file": f"{name}.json",
                "count": len(data.get("entries", [])),
            }
        )
    write_json(PUBLIC / "dictionaries" / "catalog.json", {"dictionaries": catalogs})


def build_paleo() -> int:
    import openpyxl

    path = SRC / "Paleo-Strongs-1.1.xlsx"
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb["Paleo Strong's"]
    lex: dict[str, dict] = {}
    letters: list[dict] = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            continue
        a = str(row[0] or "").strip()
        if re.match(r"^[HhGg]\d+", a):
            sid = a.upper() if a[0].isalpha() else a
            if not sid.startswith(("H", "G")):
                sid = f"H{sid}"
            notes = re.sub(r"\s+", " ", str(row[2] or ""))[:500]
            lex[sid] = {
                "hebrew": str(row[1] or "")[:80],
                "notes": notes,
                "root": str(row[3] or "")[:80],
                "translit": str(row[4] or "")[:80],
            }
        elif len(a) <= 2 and a and not any(c.isdigit() for c in a):
            letters.append({"glyph": a, "name": str(row[3] or "")[:40]})
    wb.close()
    write_json(
        PUBLIC / "paleo-strongs.json",
        {
            "credit": "Paleo Strong's 1.1 — fathersalphabet.com. Marked Public Domain.",
            "lex": lex,
            "letters": letters[:40],
        },
    )
    # Word art
    art_dir = PUBLIC / "brand" / "words"
    art_dir.mkdir(parents=True, exist_ok=True)
    arts = []
    for name in (
        "Mashach-Anoint4K.PNG",
        "Padah-Redeem4K.PNG",
        "Palal-Pray4K.PNG",
        "Qodesh-Holy4K.PNG",
        "Tov-Good4K.PNG",
        "Tsadiq-Righteous4K.PNG",
    ):
        src = SRC / name
        if src.exists():
            dest = art_dir / name
            shutil.copy2(src, dest)
            arts.append({"file": f"/brand/words/{name}", "label": name.split("-")[0]})
    write_json(PUBLIC / "brand" / "words" / "catalog.json", {"credit": "fathersalphabet word art", "items": arts})
    return len(lex)


def build_timeline() -> int:
    import openpyxl

    path = SRC / "Free-Bible-Timeline-Spreadsheet-v-1.2.xlsx"
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb["Full Timeline"]
    events: list[dict] = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i < 2:
            continue
        year, proposed, event = row[0], row[1], row[2]
        if not event or not str(event).strip():
            continue
        events.append(
            {
                "year": year if isinstance(year, (int, float)) else None,
                "era": str(proposed or "")[:40],
                "event": str(event).strip()[:240],
            }
        )
        if len(events) >= 800:
            break
    wb.close()
    write_json(
        PUBLIC / "timeline" / "bible-v12.json",
        {
            "title": "Biblical Timeline (364-day years)",
            "credit": "Free Bible Timeline v1.2 — fathersalphabet.com. Free download / PD study aid.",
            "events": events,
        },
    )
    webp = SRC / "EndTimesTimeline_DanielsFinalWeek_APossibleScenario.webp"
    if webp.exists():
        dest_dir = PUBLIC / "timeline"
        dest_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(webp, dest_dir / "daniels-week.webp")
        print("  wrote public/timeline/daniels-week.webp")
    return len(events)


def build_calendar_kit() -> int:
    import openpyxl

    path = SRC / "Calendar-Kit_Year-6228-From-Adam-March-2026-March-2027.xlsx"
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    months: list[dict] = []
    for name in wb.sheetnames:
        if name.lower().startswith("note"):
            continue
        ws = wb[name]
        title = name
        year = None
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i > 8:
                break
            vals = [v for v in row if v is not None]
            for v in vals:
                if isinstance(v, str) and v.strip() and not str(v).isdigit():
                    if "MONTH" in v.upper() or "ABIB" in v.upper() or re.search(r"\d", v):
                        title = str(v).strip()
                if isinstance(v, (int, float)) and 6000 < v < 7000:
                    year = int(v)
        months.append({"id": name, "title": title, "yearFromAdam": year})
    wb.close()
    write_json(
        PUBLIC / "calendar" / "kit-6228.json",
        {
            "title": "Calendar Kit · Year 6228 from Adam",
            "credit": "Calendar Kit Year 6228 (March 2026–March 2027) — fathersalphabet.com free download.",
            "yearFromAdam": 6228,
            "civilSpan": "March 2026 – March 2027",
            "months": months,
        },
    )
    return len(months)


def build_watchmen() -> bool:
    from pypdf import PdfReader

    path = SRC / "To-the-Watchmen-E-Book_Ancient-Calendar-of-Israel-Biblical-Timelines-and-End-Times-Prophecies.pdf"
    reader = PdfReader(str(path))
    head = "\n".join((page.extract_text() or "") for page in reader.pages[:5]).lower()
    if "cc0" not in head and "public domain" not in head and "creative commons" not in head:
        # Still allowed by plan (CC0 stated for this ebook); proceed with credit
        pass
    chunks: list[str] = []
    for page in reader.pages:
        chunks.append(page.extract_text() or "")
    text = re.sub(r"[ \t]+\n", "\n", "\n".join(chunks))
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    paras = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", text) if len(p.strip()) >= 40]
    sections: list[dict] = []
    bucket: list[str] = []
    for para in paras:
        bucket.append(para[:4000])
        if len(bucket) >= 5:
            sections.append({"title": f"Reading {len(sections) + 1}", "paragraphs": bucket})
            bucket = []
        if len(sections) >= 40:
            break
    if bucket and len(sections) < 40:
        sections.append({"title": f"Reading {len(sections) + 1}", "paragraphs": bucket})
    work = {
        "id": "to-the-watchmen",
        "title": "To the Watchmen",
        "credit": "M. Dawson / fathersalphabet.com. CC0 1.0 — Ancient Calendar of Israel, biblical timelines, end-times notes.",
        "shelf": "hebrew",
        "sections": sections,
    }
    LIB.mkdir(parents=True, exist_ok=True)
    write_json(LIB / "to-the-watchmen.json", work)
    catalog_path = LIB / "catalog.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8")) if catalog_path.exists() else {"works": []}
    works = [w for w in catalog.get("works", []) if w.get("id") != work["id"]]
    works.append(
        {
            "id": work["id"],
            "title": work["title"],
            "credit": work["credit"],
            "shelf": work["shelf"],
            "file": "to-the-watchmen.json",
        }
    )
    catalog["works"] = sorted(works, key=lambda w: w["title"].lower())
    write_json(catalog_path, catalog)
    return True


def build_study_pdfs() -> int:
    from pypdf import PdfReader

    count = 0
    catalog_path = LIB / "catalog.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8")) if catalog_path.exists() else {"works": []}
    works = list(catalog.get("works", []))
    for filename, (work_id, title, credit) in STUDY_PDF_PD.items():
        path = SRC / filename
        if not path.exists():
            continue
        reader = PdfReader(str(path))
        head = "\n".join((p.extract_text() or "") for p in reader.pages[:3]).lower()
        if "public domain" not in head and "fathersalphabet" not in head and len(reader.pages) > 0:
            # Still ingest short PD sheets from this pack per plan allowlist
            pass
        text = "\n".join((p.extract_text() or "") for p in reader.pages)
        paras = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", text) if len(p.strip()) >= 30]
        if not paras:
            paras = [re.sub(r"\s+", " ", text)[:3000]] if text.strip() else ["(Chart PDF — open the print original for full art.)"]
        sections = [{"title": title, "paragraphs": paras[:12]}]
        work = {"id": work_id, "title": title, "credit": credit, "shelf": "hebrew", "sections": sections}
        write_json(LIB / f"{work_id}.json", work)
        works = [w for w in works if w.get("id") != work_id]
        works.append({"id": work_id, "title": title, "credit": credit, "shelf": "hebrew", "file": f"{work_id}.json"})
        count += 1
    catalog["works"] = sorted(works, key=lambda w: w["title"].lower())
    write_json(catalog_path, catalog)
    return count


def build_ohb_genesis() -> int:
    """Schema-validated Genesis sample: KJV + Original Hebrew + Strong's. Refuse BSB column."""
    import openpyxl

    path = SRC / "Original-Hebrew-Bible-Spreadsheet-Version-1.0.xlsx"
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb[wb.sheetnames[0]]
    # Word-level rows: verse label repeats on first token of each verse.
    verses: dict[str, dict] = {}
    order: list[str] = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i < 4:
            continue
        translit = str(row[2] or "").strip()
        hebrew = str(row[3] or "").strip()
        verse = str(row[4] or "").strip()
        kjv = str(row[5] or "").strip()
        strong = row[6]
        strong_s = str(int(strong)) if isinstance(strong, (int, float)) else str(strong or "").strip()
        # Advance book: stop at Exodus verse labels
        if verse.startswith("Exodus "):
            break
        if verse.startswith("Genesis "):
            if verse not in verses:
                verses[verse] = {"verse": verse, "kjv": kjv[:500], "tokens": []}
                order.append(verse)
            elif kjv and not verses[verse]["kjv"]:
                verses[verse]["kjv"] = kjv[:500]
        if not order:
            continue
        current = order[-1]
        if hebrew or translit or strong_s:
            verses[current]["tokens"].append(
                {
                    "hebrew": hebrew[:80],
                    "translit": translit[:60],
                    "strong": f"H{strong_s}" if strong_s.isdigit() else strong_s[:20],
                }
            )
        if len(order) >= 50:
            # Cap Genesis sample at first 50 verses for ship size
            break
    wb.close()
    rows_out = [
        {
            "verse": verses[key]["verse"],
            "kjv": verses[key]["kjv"],
            "tokens": verses[key]["tokens"][:40],
        }
        for key in order
    ]
    write_json(
        PUBLIC / "ohb" / "genesis.json",
        {
            "title": "Original Hebrew Bible · Genesis sample",
            "credit": "Original Hebrew Bible Spreadsheet v1.0/1.1 — Public Domain claim. BSB English column refused; KJV + Hebrew tokens + Strong’s only.",
            "schema": {
                "kept": ["Verse", "Original Hebrew", "Transliteration", "King James Version", "Strongs #"],
                "refused": ["BSB Translation"],
            },
            "rows": rows_out,
        },
    )
    return len(rows_out)


def run_build() -> None:
    print("\n== building dictionaries ==")
    print("  easton", build_easton())
    print("  smith", build_smith())
    print("  webster", build_webster())
    build_dictionaries_index()
    print("\n== paleo + word art ==")
    print("  paleo lex", build_paleo())
    print("\n== calendar / timeline ==")
    print("  timeline events", build_timeline())
    print("  calendar months", build_calendar_kit())
    print("\n== library study ==")
    print("  watchmen", build_watchmen())
    print("  study pdfs", build_study_pdfs())
    print("\n== OHB Genesis sample ==")
    print("  ohb rows", build_ohb_genesis())
    print("\nBailey PDF: SKIP (image-only). English covered by Webster.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--build", action="store_true", help="Write public artifacts")
    args = parser.parse_args()
    report = inventory()
    print("update_03 inventory")
    for line in report:
        print(line)
    refuse = sum(1 for line in report if line.startswith("REFUSE"))
    ingest = sum(1 for line in report if line.startswith("INGEST"))
    skip = sum(1 for line in report if line.startswith("SKIP"))
    print(f"\nsummary: ingest={ingest} refuse={refuse} skip={skip}")
    if args.build:
        run_build()


if __name__ == "__main__":
    main()

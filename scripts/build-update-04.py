"""Ingest public-domain Extra-canon works from extra_resources/update_04.

KEEP: Rolleston Mazzaroth (1862), Bond gematria (1917).
REFUSE: Cozmophyzix / Born Identity / modern astrology courses / web images.
TXT math lessons are never shipped as library JSON (rewrite into Heavens Cast copy).
"""

from __future__ import annotations

import importlib.util
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]


def _load_lib():
    path = Path(__file__).resolve().parent / "build-library.py"
    spec = importlib.util.spec_from_file_location("build_library", path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


lib = _load_lib()
UPDATE = root / "extra_resources" / "update_04"
out_dir = root / "public" / "library"
catalog_path = out_dir / "catalog.json"

REFUSE_EXACT = {
    # Cozmophyzix / Academy proprietary — clock/Job/twelve *facts* rewritten in
    # circleMeasure, scriptureTwelves, heavens.jobPerseverance; Practice Meditate
    # already covers breath/rejoice/Word/fast. TXT dumps never copy into public/.
    "base 60 math and circumference of a circle.txt",
    "the cpd.txt",
    "cozmophysix.txt",
    "cozmohomework_april dawn spreeman.txt",
    "the ascendant or rising sign lesson.txt",
    "virgoandjob.txt",
    "spiritual practices for ascension.txt",
    "signssymbolsforinternet.txt",
    "12 months.txt",
    # Born Identity ministry
    "born identity hebrew chart.pdf",
    "born identity hebrew chart.csv",
    "born-identity-decrees.pdf",
    # Modern / unclear copyright astrology
    "astrology_presentation-web_published.pdf",
    "history_astrology.pdf",
    "23341033-astrology.pdf",
    "cheat.pdf",
    # Glorian / unverified redistribution
    "hebrew letters.pdf",
    "learn the ten sephiroth - tree of life.pdf",
    # Web / social / fan art — letter *facts* rewritten in src/study/letterStudy.ts
    # and src/study/lostBooks.ts; these images stay refuse (never copy into public/).
    "ancient_hebrew_letter_meanings_by_sum1good-d3e021l.png",
    "the 72 angels names.png",
    "houses-1.gif",
    "28_alphabetchart.gif",
    "hebrewpaths.jpg",
    "hebrew.jpg",
    "hebrew4.jpg",
    "hebrew5.jpg",
    "4821523_orig.jpg",
    "screen-shot-2014-07-12-at-13.19.51.png",
    "10269513_841455972535264_5278005745682788311_n.jpg",
    "10530790_10201836179300696_5023827991607619795_n.jpg",
    "1554520_10152140617680907_1976110962_n.jpg",
}

REFUSED_HEAD = (
    "all rights reserved",
    "© 20",
    "copyright © 20",
    "cozmophyzix",
    "born identity",
    "glorian publishing",
    "holly d'angelo",
    "holly d’angelo",
    "robert hand",
    "born-idenity",
    "361next",
)

INGEST: list[dict] = [
    {
        "match": "rolleston-mazzaroth",
        "id": "mazzaroth-rolleston",
        "title": "Mazzaroth (Frances Rolleston)",
        "credit": (
            "Frances Rolleston, Mazzaroth; or, The Constellations (1862). Public domain. "
            "Historical reading beside Job 38:32 — not Anointed Staff chart engine data, "
            "not a fortune table. Desk Witness path stays original Scripture prose."
        ),
        "shelf": "witnesses",
        "max_sections": 28,
        "min_chars": 2000,
        "stance": (
            "Historical public-domain Mazzaroth commentary. Use beside Scripture; "
            "Cast and Witness on this desk remain clocks and original study — not pasted fortunes."
        ),
    },
    {
        "match": "redhouse-gematria",
        "id": "bond-gematria",
        "title": "Gematria: A Preliminary Investigation of the Cabala (Bond & Lea)",
        "credit": (
            "F. Bligh Bond and Thomas Simcox Lea, Gematria (1917, London). Public domain. "
            "Historical gematria study — not a spell book. Desk Gematria Learn stays Anointed Staff."
        ),
        "shelf": "hermetic",
        "max_sections": 40,
        "min_chars": 2000,
        "alt_matches": ("preliminary-investigation-of-the-cabala", "f-bond", "bligh-bond"),
        "stance": (
            "Historical public-domain gematria study (1917). Count letters on this desk in Gematria Learn; "
            "open Bond as Extra-canon history — not a spell book."
        ),
    },
]


def name_key(path: Path) -> str:
    return path.name.lower().strip()


def refuse_reason(path: Path) -> str | None:
    key = name_key(path)
    if key in REFUSE_EXACT:
        return "refuse list"
    # Facebook-style CDN dumps
    if re.fullmatch(r"\d+_[0-9a-z_]+\.(jpg|jpeg|png)", key):
        return "social image dump"
    return None


def match_spec(path: Path) -> dict | None:
    key = re.sub(r"[_\s]+", "-", path.name.lower())
    for spec in INGEST:
        if spec["match"] in key:
            return spec
        for alt in spec.get("alt_matches", ()):
            if alt in key:
                return spec
    return None


def check_copyright(path: Path, *, allow_pre1929: bool = True) -> str | None:
    try:
        head = lib.first_pages(path, 5)
    except Exception as error:
        return f"unreadable: {error}"
    for mark in REFUSED_HEAD:
        if mark in head:
            return f"in-copyright marker {mark!r}"
    for mark in lib.REFUSED:
        if mark in head:
            return f"in-copyright marker {mark!r}"
    if any(mark in head for mark in lib.ALLOWED_PD):
        return None
    year_hit = re.search(r"copyright\s*(©|\(c\))?\s*((?:19|20)\d{2})", head)
    if year_hit and "public domain" not in head:
        year = int(year_hit.group(2))
        if year >= 1929:
            return f"modern copyright notice (~{year})"
        if allow_pre1929 and year < 1929:
            return None
    return None


def chunk_long_paragraphs(sections: list[dict], max_chars: int = 1800) -> list[dict]:
    out: list[dict] = []
    for section in sections:
        for para in section.get("paragraphs", []):
            if len(para) <= max_chars:
                out.append({"title": section["title"], "paragraphs": [para]})
                continue
            pieces = re.split(r"(?=\b\d{1,3}\s+[A-Z])", para)
            bucket: list[str] = []
            size = 0
            part = 1
            for piece in pieces:
                piece = piece.strip()
                if not piece:
                    continue
                if size + len(piece) > max_chars and bucket:
                    out.append({"title": f"{section['title']} · {part}", "paragraphs": [" ".join(bucket)]})
                    part += 1
                    bucket = [piece]
                    size = len(piece)
                else:
                    bucket.append(piece)
                    size += len(piece)
            if bucket:
                title = f"{section['title']} · {part}" if part > 1 else section["title"]
                out.append({"title": title, "paragraphs": [" ".join(bucket)]})
    return out or sections


_NAV_NOISE = re.compile(
    r"(?i)philologos\.org|philologos religious online books|bible prophecy research|"
    r"the bpr reference guide|previous\s*\|\s*contents\s*\|\s*next|"
    r"jewish calendar\s*\|\s*about us|\|\s*\|\s*\|"
)
_TOC_LINE = re.compile(
    r"(?i)^\s*(contents of the|•\s*|london:\s*rivingtons|previous\s*\||"
    r"or,\s*the\s*constellations\s+by\s+frances)"
)
_SIGN_ORDER = (
    "ARIES",
    "TAURUS",
    "GEMINI",
    "CANCER",
    "LEO",
    "VIRGO",
    "LIBRA",
    "SCORPIO",
    "SAGITTARIUS",
    "CAPRICORNUS",
    "AQUARIUS",
    "PISCES",
)


def clean_paras(paras: list[str]) -> list[str]:
    out: list[str] = []
    for para in paras:
        line = _NAV_NOISE.sub(" ", para)
        line = re.sub(r"\s+", " ", line).strip()
        if len(line) < 40:
            continue
        lower = line.lower()
        if lower.startswith("special thanks to moza"):
            continue
        if "philologos" in lower and len(line) < 120:
            continue
        if _TOC_LINE.search(line) and "mazzaroth" not in lower[:40]:
            # Keep real chapter prose; drop bare TOC / chrome lines.
            if lower.count("•") >= 3 or "contents of the" in lower:
                continue
        out.append(line[:8000])
    return out


def curate_rolleston(sections: list[dict], max_sections: int) -> list[dict]:
    """Prefer preface/meanings, twelve signs, Job/authorities/decans — drop TOC dumps."""
    keep: list[dict] = []
    seen_signs: set[str] = set()
    essays: list[dict] = []
    for section in sections:
        title = (section.get("title") or "").strip()
        paras = clean_paras(section.get("paragraphs", []))
        if not paras:
            continue
        joined = " ".join(paras)
        if "contents of the" in joined.lower()[:200] and len(joined) < 3500:
            continue
        upper = title.upper()
        sign_hit = next((name for name in _SIGN_ORDER if name in upper or name.title() in title), None)
        if sign_hit:
            if sign_hit in seen_signs:
                # Merge extra fragments into the first sign section when short.
                for item in keep:
                    if item["title"].upper().startswith(sign_hit) or sign_hit in item["title"].upper():
                        if len(" ".join(item["paragraphs"])) < 3500:
                            item["paragraphs"] = clean_paras(item["paragraphs"] + paras)[:6]
                        break
                continue
            seen_signs.add(sign_hit)
            keep.append({"title": f"{sign_hit.title()}", "paragraphs": paras[:6]})
            continue
        if re.search(r"(?i)preface|meanings of the emblems|latin names|primitive prophec|authorit|"
                      r"\bjob\b|decan|mazzaroth\.?\s*chapter", title):
            essays.append({"title": title[:120], "paragraphs": paras[:5]})
            continue
        if re.search(r"(?i)preface|real meanings|twelve signs of the zodiac|book of job|"
                     r"note on the decans|authorities for the antiquity", joined[:400]):
            essays.append({"title": title[:120] or "Essay", "paragraphs": paras[:5]})
    # Order: essays first (capped), then signs in zodiac order, then leftover essays.
    essay_cap = 8
    ordered = essays[:essay_cap]
    for name in _SIGN_ORDER:
        for item in keep:
            if item["title"].upper().startswith(name):
                ordered.append(item)
                break
    # If a sign was missing, leave gap; do not invent text.
    return ordered[:max_sections]


def sections_from_text(text: str, max_sections: int) -> list[dict]:
    patterns = [
        (
            r"\n\s*(ARIES|TAURUS|GEMINI|CANCER|LEO|VIRGO|LIBRA|SCORPIO|SAGITTARIUS|CAPRICORNUS|AQUARIUS|PISCES)\b[^\n]{0,80}\n",
            "{number}",
        ),
        (r"\n\s*(?:CHAPTER|Chapter|Chap\.?)\s+([IVXLC\d]+)[.\s:\-]*\n", "Chapter {number}"),
        (r"\n\s*(?:PART|Part)\s+([IVXLC\d]+|[IV]+)\s*\n", "Part {number}"),
        (r"\n\s*(?:BOOK|Book)\s+([IVXLC\d]+)\s*\n", "Book {number}"),
        (r"\n\s*(MAZZAROTH[^\n]{0,40})\n", "{number}"),
    ]
    sections: list[dict] = []
    for pattern, title_fmt in patterns:
        sections = lib.split_chapters(text, pattern, title_fmt)
        if len(sections) >= 5:
            break
    if len(sections) < 5:
        body = clean_paras(lib.paragraphs(text, min_len=40))
        if len(body) == 1 and len(body[0]) > 4000:
            sections = chunk_long_paragraphs([{"title": "Reading", "paragraphs": body}], max_chars=1600)
        else:
            sections = [
                {"title": f"Reading {index // 4 + 1}", "paragraphs": body[index : index + 4]}
                for index in range(0, len(body), 4)
            ]
    trimmed: list[dict] = []
    for section in sections:
        paras = clean_paras(section.get("paragraphs", []))[:8]
        if paras:
            trimmed.append({"title": section["title"][:120], "paragraphs": paras})
        if len(trimmed) >= max_sections:
            break
    if len(trimmed) <= 4:
        total = sum(len(p) for s in trimmed for p in s.get("paragraphs", []))
        if total > 12000:
            trimmed = chunk_long_paragraphs(trimmed, max_chars=1600)[:max_sections]
            for item in trimmed:
                item["paragraphs"] = clean_paras(item["paragraphs"])
    return [s for s in trimmed if s.get("paragraphs")]


def ingest_pdf(path: Path, spec: dict) -> dict:
    reason = check_copyright(path)
    if reason and ("modern copyright" in reason or "in-copyright marker" in reason):
        raise RuntimeError(reason)
    text = lib.extract_pages(path)
    min_chars = spec.get("min_chars", 1500)
    if len(text) < min_chars:
        raise RuntimeError(f"extract too short ({len(text)} chars)")
    sections = sections_from_text(text, spec.get("max_sections", 40))
    if not sections:
        raise RuntimeError("no sections")
    if spec["id"] == "mazzaroth-rolleston":
        curated = curate_rolleston(sections, spec.get("max_sections", 40))
        if len(curated) >= 8:
            sections = curated
    work = {
        "id": spec["id"],
        "title": spec["title"],
        "credit": spec["credit"],
        "shelf": spec["shelf"],
        "sections": sections,
    }
    if spec.get("stance"):
        # Lead with desk stance so Extra-canon shows it first.
        work["sections"] = [
            {"title": "Desk stance", "paragraphs": [spec["stance"]]},
            *sections,
        ][: spec.get("max_sections", 40) + 1]
    return work


def load_catalog() -> list[dict]:
    if not catalog_path.exists():
        return []
    data = json.loads(catalog_path.read_text(encoding="utf-8"))
    return list(data.get("works", []))


def merge_catalog(entries: list[dict]) -> None:
    by_id = {item["id"]: item for item in load_catalog()}
    for entry in entries:
        by_id[entry["id"]] = entry
    works = sorted(by_id.values(), key=lambda item: item["title"].lower())
    catalog_path.write_text(json.dumps({"works": works}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("catalog", len(works), "works")


def main() -> None:
    if not UPDATE.exists():
        raise SystemExit(f"missing {UPDATE}")
    out_dir.mkdir(parents=True, exist_ok=True)

    report: list[str] = []
    written: list[dict] = []
    seen_ids: set[str] = set()

    for path in sorted(UPDATE.iterdir(), key=lambda p: p.name.lower()):
        if not path.is_file():
            continue
        refuse = refuse_reason(path)
        if refuse:
            report.append(f"REFUSE  {path.name}  ({refuse})")
            continue
        spec = match_spec(path)
        if not spec:
            report.append(f"SKIP    {path.name}  (no ingest rule — left on disk)")
            continue
        if path.suffix.lower() != ".pdf":
            report.append(f"SKIP    {path.name}  (not pdf)")
            continue
        if spec["id"] in seen_ids:
            report.append(f"SKIP    {path.name}  (already ingested as {spec['id']})")
            continue
        try:
            work = ingest_pdf(path, spec)
        except Exception as error:
            report.append(f"FAIL    {path.name}  ({error})")
            continue
        entry = lib.write_work(work)
        written.append(entry)
        seen_ids.add(work["id"])
        report.append(f"OK      {path.name}  → {work['id']}  ({len(work['sections'])} sections)")

    if written:
        merge_catalog(written)

    print("\n--- update_04 report ---")
    for line in report:
        print(line)
    ok = sum(1 for line in report if line.startswith("OK"))
    refuse = sum(1 for line in report if line.startswith("REFUSE"))
    fail = sum(1 for line in report if line.startswith("FAIL"))
    skip = sum(1 for line in report if line.startswith("SKIP"))
    print(f"\nsummary: ok={ok} refuse={refuse} fail={fail} skip={skip}")


if __name__ == "__main__":
    main()

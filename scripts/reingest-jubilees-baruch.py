"""
Re-ingest clean public-domain English for Jubilees + 2 Baruch.

Sources (KEEP):
  - extra_resources/The Book of Jubilees.pdf  → R. H. Charles, SPCK 1917 (sacred-texts print)
  - extra_resources/2-baruch-charles-1913.txt → R. H. Charles, APOT II 1913 (SermonIndex OCR of PD)

Refuse (do not ship):
  - extra_resources/book-2-of-Baruch.pdf  → YAHWEH's Sword sacred-name
  - extra_resources/baruch2.pdf           → modern critical apparatus; translator not PD-cleared
"""
from __future__ import annotations

import json
import re
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover
    from PyPDF2 import PdfReader  # type: ignore

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "library"
CATALOG = OUT / "catalog.json"
JUBILEES_PDF = ROOT / "extra_resources" / "The Book of Jubilees.pdf"
BARUCH_TXT = ROOT / "extra_resources" / "2-baruch-charles-1913.txt"

ROMAN = {
    "I": 1,
    "II": 2,
    "III": 3,
    "IV": 4,
    "V": 5,
    "VI": 6,
    "VII": 7,
    "VIII": 8,
    "IX": 9,
    "X": 10,
    "XI": 11,
    "XII": 12,
    "XIII": 13,
    "XIV": 14,
    "XV": 15,
    "XVI": 16,
    "XVII": 17,
    "XVIII": 18,
    "XIX": 19,
    "XX": 20,
    "XXI": 21,
    "XXII": 22,
    "XXIII": 23,
    "XXIV": 24,
    "XXV": 25,
    "XXVI": 26,
    "XXVII": 27,
    "XXVIII": 28,
    "XXIX": 29,
    "XXX": 30,
    "XXXI": 31,
    "XXXII": 32,
    "XXXIII": 33,
    "XXXIV": 34,
    "XXXV": 35,
    "XXXVI": 36,
    "XXXVII": 37,
    "XXXVIII": 38,
    "XXXIX": 39,
    "XL": 40,
    "XLI": 41,
    "XLII": 42,
    "XLIII": 43,
    "XLIV": 44,
    "XLV": 45,
    "XLVI": 46,
    "XLVII": 47,
    "XLVIII": 48,
    "XLIX": 49,
    "L": 50,
}


def clean_block(text: str) -> str:
    text = text.replace("\u00ad", "")
    # OCR: roman VI often becomes "V1."
    text = re.sub(r"(?:^|\n)\s*V1\.\s+", "\nVI. ", text)
    text = re.sub(r"(?:^|\n)\s*X1\.\s+", "\nXI. ", text)
    text = re.sub(r"Sacred Texts\s+Bible\s+Apocrypha(?:\s+Index)?(?:\s+Previous)?(?:\s+Next)?", " ", text, flags=re.I)
    text = re.sub(r"\bp\.\s*[ivxlcdm\d]+\b", " ", text, flags=re.I)
    text = re.sub(r"\[paragraph continues\]", " ", text, flags=re.I)
    text = re.sub(
        r"\n\s*Footnotes\b[\s\S]*?(?=\n\s*(?:[IVXLC]{1,7}\.|V1\.|God's Revelation|God commands|Prologue|CHAPTER|\Z))",
        "\n",
        text,
        flags=re.I,
    )
    text = re.sub(r"\n\s*Next:\s*[^\n]+", "\n", text, flags=re.I)
    text = re.sub(r"\d{3,4}\s*\n\s*A\.M\.", " ", text)
    text = re.sub(r"\bA\.M\.\b", " ", text)
    text = re.sub(r"\(\s*A\.M\.\s*=\s*Anno\s*Mundi\s*\)", " ", text, flags=re.I)
    text = re.sub(r"\[\d+:\d+[^\]]*\]", " ", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def paragraphs(block: str, min_len: int = 48) -> list[str]:
    parts = [re.sub(r"\s+", " ", part).strip() for part in re.split(r"\n\s*\n", block)]
    out: list[str] = []
    for part in parts:
        if len(part) < min_len:
            continue
        if part.lower().startswith("next:"):
            continue
        if part.lower().startswith("footnotes"):
            continue
        # Drop bare superscript footnote crumbs
        if re.fullmatch(r"[\d:\s\*†‡§¶a-zA-Z\.\-]+", part) and len(part) < 80:
            continue
        out.append(part)
    return out


def extract_jubilees_body() -> str:
    reader = PdfReader(str(JUBILEES_PDF))
    chunks: list[str] = []
    started = False
    for page in reader.pages:
        raw = page.extract_text() or ""
        if not started:
            if "THE BOOK OF JUBILEES" in raw and "Prologue" in raw and "history of the division" in raw.lower():
                started = True
            else:
                continue
        # Stop once sacred-texts chrome returns to index-only short pages after body
        chunks.append(raw)
    if not started:
        raise SystemExit("Jubilees PDF: could not find Prologue body start")
    return clean_block("\n".join(chunks))


def jubilees_work() -> dict:
    body = extract_jubilees_body()
    # Split on Roman chapter markers: "XVI. And …" or "X. 1 And …"
    # Allow a digit (verse) after the period; require start-of-line so "XVI." is not seen as "VI.".
    pattern = re.compile(r"(?:^|\n)\s*([IVXLC]{1,7})\.\s+(?=\d|[A-Z“\"«])")
    pieces = pattern.split(body)
    sections: list[dict] = []
    head = pieces[0]
    # Prologue ends before Chapter I arabic verses in this SPCK print.
    prologue_paras = []
    for part in paragraphs(head, 50):
        low = part.lower()
        if "history of the division" in low or low.startswith("this is the history"):
            prologue_paras.append(part)
    if prologue_paras:
        sections.append({"title": "Prologue", "paragraphs": prologue_paras[:4]})

    # Chapter I is printed as "1. And it came to pass…" under a title, not as "I."
    chapter_one = head
    marker = re.search(
        r"1\.\s+And it came to pass in the first year of the\s+exodus of the children of Israel",
        head,
        flags=re.I,
    )
    if marker:
        chapter_one = head[marker.start() :]
        one_paras = paragraphs(chapter_one, 50)
        # Drop trailing chrome that belongs after ch.1 footnotes
        one_paras = [p for p in one_paras if not p.lower().startswith("god commands the angel")]
        if one_paras:
            sections.append({"title": "Chapter 1", "paragraphs": one_paras[:24]})

    for index in range(1, len(pieces), 2):
        roman = pieces[index].strip().upper()
        number = ROMAN.get(roman)
        if not number:
            continue
        chunk = pieces[index + 1] if index + 1 < len(pieces) else ""
        paras = paragraphs(chunk, 50)
        if not paras:
            continue
        sections.append({"title": f"Chapter {number}", "paragraphs": paras[:24]})

    if len(sections) < 20:
        raise SystemExit(f"Jubilees parse too thin: {len(sections)} sections")
    return {
        "id": "jubilees",
        "title": "Book of Jubilees",
        "credit": "R. H. Charles, The Book of Jubilees, SPCK London 1917 (sacred-texts print). Public domain. Desk OCR fixes (e.g. V1→VI); not a sacred-name edition.",
        "shelf": "enoch",
        "sections": sections,
    }


def baruch_work() -> dict:
    if not BARUCH_TXT.exists():
        raise SystemExit(f"missing {BARUCH_TXT}")
    text = BARUCH_TXT.read_text(encoding="utf-8", errors="replace")
    if "YAHWEH" in text or "yahwehsword" in text.lower():
        raise SystemExit("Baruch source contains sacred-name markers — refuse")
    # Drop front matter before first CHAPTER
    start = text.find("CHAPTER 1.")
    if start < 0:
        raise SystemExit("Baruch: CHAPTER 1 not found")
    body = text[start:]
    pieces = re.split(r"\n(?=CHAPTER\s+\d+\.)", body)
    sections: list[dict] = []
    for piece in pieces:
        piece = piece.strip()
        if not piece:
            continue
        first, _, rest = piece.partition("\n")
        m = re.match(r"CHAPTER\s+(\d+)\.\s*(.*)", first.strip(), flags=re.I)
        if not m:
            continue
        number = m.group(1)
        heading = m.group(2).strip().title() if m.group(2).strip() else f"Chapter {number}"
        title = f"Chapter {number}" if not heading or heading.upper().startswith("CHAPTER") else f"Chapter {number} · {heading[:80]}"
        paras = paragraphs(rest, 40)
        if not paras:
            # Single-block chapters: treat whole rest as one paragraph
            blob = re.sub(r"\s+", " ", rest).strip()
            if len(blob) >= 40:
                paras = [blob]
        if paras:
            sections.append({"title": title, "paragraphs": paras[:20]})
    if len(sections) < 40:
        raise SystemExit(f"Baruch parse too thin: {len(sections)} sections")
    return {
        "id": "baruch",
        "title": "Apocalypse of Baruch (2 Baruch)",
        "credit": "R. H. Charles, Syriac Apocalypse of Baruch, in APOT vol. II (Oxford, 1913). Public domain. OCR reading text; not a sacred-name edition / not a modern critical apparatus text.",
        "shelf": "enoch",
        "sections": sections,
    }


def upsert_catalog(*works: dict) -> None:
    data = json.loads(CATALOG.read_text(encoding="utf-8")) if CATALOG.exists() else {"works": []}
    by_id = {item["id"]: item for item in data.get("works", [])}
    for work in works:
        by_id[work["id"]] = {
            "id": work["id"],
            "title": work["title"],
            "credit": work["credit"],
            "shelf": work["shelf"],
            "file": f"{work['id']}.json",
        }
    # Drop rights-gated modern NH commentary still pending clean PD
    for blocked in ("acts-peter-twelve", "apocryphon-john", "origin-world", "sophia-jesus"):
        by_id.pop(blocked, None)
    works_out = sorted(by_id.values(), key=lambda item: item["title"].lower())
    note = (
        "Rights gate: ship only verified public-domain English. "
        "Jubilees + 2 Baruch restored from R. H. Charles (1917 / 1913). "
        "Nag Hammadi Sophia extracts and modern academic commentaries (e.g. Acts of Peter and the Twelve) stay out until a clean PD source is ingested. "
        "Refuse YAHWEH’s Sword sacred-name PDFs and uncleared modern critical Baruch texts."
    )
    payload = {"works": works_out, "note": note}
    CATALOG.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("catalog", len(works_out), "works")


def write_work(work: dict) -> None:
    path = OUT / f"{work['id']}.json"
    path.write_text(json.dumps(work, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    paras = sum(len(s.get("paragraphs", [])) for s in work["sections"])
    print(f"OK  {work['id']:12} sections={len(work['sections']):3} paras={paras:4} bytes={path.stat().st_size}")


def gate_acts_peter() -> None:
    path = OUT / "acts-peter-twelve.json"
    if not path.exists():
        return
    archive = ROOT.parent / "Anointedstaff-archives" / "rights-gate-2026-11-09"
    archive.mkdir(parents=True, exist_ok=True)
    target = archive / path.name
    path.replace(target)
    print(f"GATED acts-peter-twelve → {target}")


def main() -> None:
    if not JUBILEES_PDF.exists():
        raise SystemExit(f"missing {JUBILEES_PDF}")
    OUT.mkdir(parents=True, exist_ok=True)
    jubilees = jubilees_work()
    baruch = baruch_work()
    write_work(jubilees)
    write_work(baruch)
    gate_acts_peter()
    upsert_catalog(jubilees, baruch)
    # Sanity markers
    for wid in ("jubilees", "baruch"):
        blob = (OUT / f"{wid}.json").read_text(encoding="utf-8")
        body = blob.lower()
        if "yahwehsword" in body or "gnosis.org" in body or "brill has asserted" in body:
            raise SystemExit(f"{wid} still contains refuse markers")
        # Sacred-name body text (not credit disclaimers)
        if re.search(r"\bYAHWEH\b", blob) and "not a sacred-name" not in body:
            raise SystemExit(f"{wid} still contains sacred-name body markers")
    print("done")


if __name__ == "__main__":
    main()

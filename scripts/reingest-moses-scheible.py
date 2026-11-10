"""Re-ingest Sixth & Seventh Books of Moses (Scheible tradition English OCR).

Sacred-texts Sixth/Seventh Book pages are Scheible/Scheibel tradition; CDN blocked,
so this uses Internet Archive Google-scan OCR of the 1880 English edition.
Historical study only — not ritual instruction.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "extra_resources" / "sixth-seventh-moses-scheible-1880.txt"
OUT = ROOT / "public" / "library" / "sixth-seventh-moses.json"
CATALOG = ROOT / "public" / "library" / "catalog.json"

CREDIT = (
    "Johann Scheible tradition English (New York, c.1880 scan). Public domain. "
    "Internet Archive OCR of the Scheible Sixth and Seventh Books of Moses "
    "(same family as the sacred-texts Scheibel edition). Hermetic historical "
    "study only — not ritual instruction. OCR retains scan artifacts."
)


def clean_ocr(text: str) -> str:
    # Prefer publisher fidelity note / sixth book start
    for marker in (
        "In regard to the present edition",
        "THE Sixth Book of Moses",
        "Sixth Book of Moses",
        "SIXTH BOOK OF MOSES",
    ):
        i = text.find(marker)
        if i >= 0:
            text = text[i:]
            break
    text = text.replace("|", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def paragraphs(block: str) -> list[str]:
    # OCR often lacks blank lines; split on long runs / sentence bundles
    raw = re.sub(r"\s+", " ", block).strip()
    if not raw:
        return []
    # Split into ~900-char soft paragraphs on sentence boundaries
    sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z“\"'])", raw)
    out: list[str] = []
    buf: list[str] = []
    for sent in sentences:
        sent = sent.strip()
        if len(sent) < 20:
            continue
        low = sent.lower()
        if "google is proud" in low or "books.google" in low or "usage guidelines" in low:
            continue
        buf.append(sent)
        if sum(len(x) for x in buf) >= 900:
            out.append(" ".join(buf))
            buf = []
    if buf:
        out.append(" ".join(buf))
    return [p for p in out if len(p) >= 80]


def find_book_splits(text: str) -> list[tuple[str, int]]:
    """Return (title, start_index) for sixth / seventh major parts."""
    upper = text.upper()
    hits: list[tuple[str, int]] = []
    patterns = [
        ("Sixth Book of Moses", r"SIXTH\s+BOOK\s+OF\s+MOSES|SIXTH\s+BOOK\s+OF\s+HOSES"),
        ("Seventh Book of Moses", r"SEVENTH\s+BOOK\s+OF\s+MOSES|SEVENTH\s+BOOK\s+OF\s+HOSES"),
        ("Magic of the Israelites", r"MAGIC\s+OF\s+THE\s+ISRAELITES"),
        ("Preface", r"\bPREFACE\b"),
    ]
    for title, pat in patterns:
        for m in re.finditer(pat, upper):
            hits.append((title, m.start()))
    # de-dupe nearby
    hits.sort(key=lambda x: x[1])
    cleaned: list[tuple[str, int]] = []
    for title, pos in hits:
        if cleaned and pos - cleaned[-1][1] < 200:
            continue
        cleaned.append((title, pos))
    return cleaned


def build_sections(text: str) -> list[dict]:
    splits = find_book_splits(text)
    sections: list[dict] = []
    if len(splits) < 2:
        # Fallback: chunk whole cleaned body
        paras = paragraphs(text)
        for i in range(0, len(paras), 10):
            sections.append({"title": f"Reading {i // 10 + 1}", "paragraphs": paras[i : i + 10]})
        return sections

    for idx, (title, start) in enumerate(splits):
        end = splits[idx + 1][1] if idx + 1 < len(splits) else len(text)
        paras = paragraphs(text[start:end])
        if not paras:
            continue
        # Sub-chunk long books
        if len(paras) <= 12:
            sections.append({"title": title, "paragraphs": paras})
        else:
            for i in range(0, len(paras), 10):
                n = i // 10 + 1
                sections.append(
                    {
                        "title": f"{title} · Part {n}",
                        "paragraphs": paras[i : i + 10],
                    }
                )
    return sections


def update_catalog() -> None:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    for w in data["works"]:
        if w.get("id") == "sixth-seventh-moses":
            w["title"] = "Sixth and Seventh Books of Moses"
            w["credit"] = CREDIT
            break
    CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    text = clean_ocr(SRC.read_text(encoding="utf-8", errors="ignore"))
    sections = build_sections(text)
    if len(sections) < 6:
        raise SystemExit(f"too few sections: {len(sections)}")
    work = {
        "id": "sixth-seventh-moses",
        "title": "Sixth and Seventh Books of Moses",
        "credit": CREDIT,
        "shelf": "hermetic",
        "sections": sections,
    }
    OUT.write_text(json.dumps(work, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    update_catalog()
    paras = sum(len(s["paragraphs"]) for s in sections)
    print(f"OK sixth-seventh-moses sections={len(sections)} paras={paras} bytes={OUT.stat().st_size}")
    for s in sections[:10]:
        print(" -", s["title"], len(s["paragraphs"]))


if __name__ == "__main__":
    main()

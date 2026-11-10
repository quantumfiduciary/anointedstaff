"""Compact Cherokee NT (USFX, public domain) from open-bibles into a 66-book witness nest."""

from __future__ import annotations

import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = root / "extra_resources" / "open-bibles" / "chr-cherokee.usfx.xml"
out = root / "public" / "witnesses" / "cherokee.json"

# Protestant NT order (indices 39–65 in the desk nest).
NT_IDS = [
    "MAT",
    "MRK",
    "LUK",
    "JHN",
    "ACT",
    "ROM",
    "1CO",
    "2CO",
    "GAL",
    "EPH",
    "PHP",
    "COL",
    "1TH",
    "2TH",
    "1TI",
    "2TI",
    "TIT",
    "PHM",
    "HEB",
    "JAS",
    "1PE",
    "2PE",
    "1JN",
    "2JN",
    "3JN",
    "JUD",
    "REV",
]


def parse_usfx(text: str) -> dict[str, list[list[str]]]:
    books: dict[str, list[list[str]]] = {}
    book_id: str | None = None
    chapter = 0
    verse = 0
    buffer: list[str] = []
    chapters: list[list[str]] = []
    verses: list[str] = []

    def flush_verse() -> None:
        nonlocal buffer, verse, verses
        if verse <= 0:
            buffer = []
            return
        while len(verses) < verse:
            verses.append("")
        verses[verse - 1] = "".join(buffer).strip()
        buffer = []

    def flush_chapter() -> None:
        nonlocal verses, chapters, chapter
        flush_verse()
        if chapter > 0:
            while len(chapters) < chapter:
                chapters.append([])
            chapters[chapter - 1] = verses
        verses = []

    def flush_book() -> None:
        nonlocal book_id, chapters, chapter
        flush_chapter()
        if book_id:
            books[book_id] = chapters
        chapters = []
        chapter = 0

    # Tokenize opening tags and text runs lightly.
    for match in re.finditer(r"<(/?)([a-zA-Z0-9]+)([^>]*)>|([^<]+)", text):
        closing, tag, attrs, plain = match.groups()
        if plain is not None:
            if book_id and chapter and verse:
                buffer.append(plain)
            continue
        name = tag.lower()
        if name == "book" and not closing:
            flush_book()
            found = re.search(r'\bid="([A-Z0-9]+)"', attrs or "")
            book_id = found.group(1) if found else None
            chapter = 0
            verse = 0
            continue
        if name == "book" and closing:
            flush_book()
            book_id = None
            continue
        if name == "c" and not closing:
            flush_chapter()
            found = re.search(r'\bid="(\d+)"', attrs or "")
            chapter = int(found.group(1)) if found else chapter + 1
            verse = 0
            continue
        if name == "v" and not closing:
            flush_verse()
            found = re.search(r'\bid="(\d+)"', attrs or "")
            verse = int(found.group(1)) if found else verse + 1
            continue
        if name == "ve" and not closing:
            flush_verse()
            verse = 0
            continue
    flush_book()
    return books


def main() -> None:
    if not source.exists():
        raise SystemExit(f"missing {source} — fetch chr-cherokee.usfx.xml from seven1m/open-bibles")
    parsed = parse_usfx(source.read_text(encoding="utf-8"))
    nest: list[list[list[str]]] = [[] for _ in range(66)]
    for offset, book_id in enumerate(NT_IDS):
        nest[39 + offset] = parsed.get(book_id, [])
    missing = [book_id for book_id in NT_IDS if book_id not in parsed]
    if missing:
        raise SystemExit(f"Cherokee USFX missing books: {missing}")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(nest, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    sample = nest[39][0][0][:80]
    print(f"cherokee NT → {out} ({out.stat().st_size} bytes) · Matt 1:1 {sample}")


if __name__ == "__main__":
    main()

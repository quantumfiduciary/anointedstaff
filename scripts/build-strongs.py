"""Compact the public-domain KJV Strong's text and glossary for the app."""

import html
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
verses_path = root / "extra_resources" / "bibles_json_6.0" / "EN-English" / "kjv_strongs.json"
defs_path = root / "extra_resources" / "bibles_json_6.0" / "Extras" / "strongs_definitions.json"
out_path = root / "public" / "strongs.json"

tags = re.compile(r"<[^>]+>")
morph = re.compile(r"\{\([HG]\d+\)\}")


def clean(value: str | None) -> str:
    text = html.unescape(value or "")
    text = tags.sub("", text)
    return re.sub(r"\s+", " ", text).strip()


definitions = json.loads(defs_path.read_text(encoding="utf-8"))
lexicon = {
    item["number"]: [
        clean(item.get("root_word")),
        clean(item.get("transliteration")),
        clean(item.get("pronunciation")),
        clean(item.get("entry")),
    ]
    for item in definitions
}

bible = json.loads(verses_path.read_text(encoding="utf-8"))
books: list[list[list[str]]] = []
chapters: list[list[str]] = []
chapter: list[str] = []
last_book = None
last_chapter = None
for verse in bible["verses"]:
    if verse["book_name"] != last_book:
        if chapter:
            chapters.append(chapter)
        if chapters:
            books.append(chapters)
        chapters = []
        chapter = []
        last_book = verse["book_name"]
        last_chapter = verse["chapter"]
    elif verse["chapter"] != last_chapter:
        chapters.append(chapter)
        chapter = []
        last_chapter = verse["chapter"]
    chapter.append(morph.sub("", verse["text"]))
if chapter:
    chapters.append(chapter)
if chapters:
    books.append(chapters)

out_path.write_text(
    json.dumps({"lex": lexicon, "verses": books}, ensure_ascii=False, separators=(",", ":")),
    encoding="utf-8",
)
print(f"{len(books)} books, {len(lexicon)} entries, {out_path.stat().st_size} bytes")

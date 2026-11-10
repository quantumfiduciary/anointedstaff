"""Compact public-domain witnesses for side-by-side Compare.

English packs come from EN-English. Language packs come from the same
bibles_json_6.0 export (copyright: 0 / Public Domain statement). Cherokee and
other open-bibles USFX titles can be added later under extra_resources/open-bibles.

Hebrew WLC and Greek TR are not duplicated here — Compare uses originals.json.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
extra = root / "extra_resources" / "bibles_json_6.0"
out = root / "public" / "witnesses"
out.mkdir(parents=True, exist_ok=True)

strong = re.compile(r"\{[^}]+\}")

# id -> (relative source path, label for log)
PACKS: dict[str, tuple[str, str]] = {
    "web": ("EN-English/web.json", "World English Bible"),
    "geneva": ("EN-English/geneva.json", "Geneva"),
    "bishops": ("EN-English/bishops.json", "Bishops"),
    "coverdale": ("EN-English/coverdale.json", "Coverdale"),
    "rv1909": ("ES-Spanish/rv_1909.json", "Reina Valera 1909"),
    "cuvs": ("ZH-Chinese/chinese_union_simp.json", "Chinese Union Simplified"),
    "cuvt": ("ZH-Chinese/chinese_union_trad.json", "Chinese Union Traditional"),
    "segond": ("FR-French/segond_1910.json", "Louis Segond 1910"),
    "luther1912": ("DE-German/luther_1912.json", "Luther 1912"),
}


def refuse_rights(name: str, meta: dict) -> None:
    copyright_flag = meta.get("copyright")
    if copyright_flag not in (0, "0", None, False):
        raise SystemExit(f"{name}: copyright flag {copyright_flag!r} — refuse")
    statement = (meta.get("copyright_statement") or "").lower()
    if "all rights reserved" in statement or "used with permission" in statement:
        raise SystemExit(f"{name}: rights reservation — refuse")
    if "public domain" not in statement and copyright_flag not in (0, "0"):
        raise SystemExit(f"{name}: missing public-domain statement — refuse")


def books_of(payload: dict, pad_to: int | None = None) -> list[list[list[str]]]:
    books: list[list[list[str]]] = []
    chapters: list[list[str]] = []
    chapter: list[str] = []
    last_book = None
    last_chapter = None
    for verse in payload["verses"]:
        book_key = verse.get("book_name") or verse.get("book")
        if book_key != last_book:
            if chapter:
                chapters.append(chapter)
            if chapters:
                books.append(chapters)
            chapters = []
            chapter = []
            last_book = book_key
            last_chapter = verse["chapter"]
        elif verse["chapter"] != last_chapter:
            chapters.append(chapter)
            chapter = []
            last_chapter = verse["chapter"]
        chapter.append(strong.sub("", str(verse["text"])).strip())
    if chapter:
        chapters.append(chapter)
    if chapters:
        books.append(chapters)
    if pad_to is not None and len(books) < pad_to:
        books.extend([[] for _ in range(pad_to - len(books))])
    return books


def write_pack(pack_id: str, rel: str, label: str) -> None:
    path = extra / rel
    if not path.exists():
        raise SystemExit(f"missing source {path}")
    payload = json.loads(path.read_text(encoding="utf-8"))
    refuse_rights(pack_id, payload.get("metadata") or {})
    books = books_of(payload, pad_to=66)
    if len(books) < 39:
        raise SystemExit(f"{pack_id}: expected a full Protestant-shaped nest, got {len(books)} books")
    dest = out / f"{pack_id}.json"
    dest.write_text(json.dumps(books, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    sample = books[0][0][0][:60] if books and books[0] and books[0][0] else ""
    print(f"{pack_id:12} {len(books):3} books  {dest.stat().st_size:9} bytes  {label}  · {sample}")


def main() -> None:
    catalog = []
    for pack_id, (rel, label) in PACKS.items():
        write_pack(pack_id, rel, label)
        catalog.append(
            {
                "id": pack_id,
                "label": label,
                "path": f"witnesses/{pack_id}.json",
                "rights": "Public Domain",
            }
        )
    catalog.extend(
        [
            {
                "id": "wlc",
                "label": "Hebrew WLC (OT)",
                "path": "originals.json#wlc",
                "rights": "Public Domain",
            },
            {
                "id": "tr",
                "label": "Greek TR (NT)",
                "path": "originals.json#tr",
                "rights": "Public Domain",
            },
        ]
    )
    (out / "catalog.json").write_text(
        json.dumps(
            {
                "note": "Compare packs. English + common PD languages from bibles_json_6.0. WLC/TR via originals.json. open-bibles Cherokee not yet vendored.",
                "packs": catalog,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print("wrote", out / "catalog.json")


if __name__ == "__main__":
    main()

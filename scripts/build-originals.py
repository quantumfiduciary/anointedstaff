"""Build a public-domain Hebrew and Greek verse file for the open chapter.

WLC (Westminster Leningrad Codex) and the Textus Receptus in
extra_resources are marked public domain. The output is a nested
chapter array aligned to the app catalog: wlc[0] is Genesis, tr[0] is Matthew.
"""

import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
extra = root / "extra_resources" / "bibles_json_6.0"
out = root / "public" / "originals.json"


def nest(path: Path, book_offset: int, book_count: int) -> list:
    data = json.loads(path.read_text(encoding="utf-8"))
    books: list[list[list[str]]] = [[] for _ in range(book_count)]
    for row in data["verses"]:
        book = int(row["book"]) - 1 - book_offset
        chapter = int(row["chapter"]) - 1
        verse = int(row["verse"]) - 1
        if book < 0 or book >= book_count or chapter < 0 or verse < 0:
            continue
        chapters = books[book]
        while len(chapters) <= chapter:
            chapters.append([])
        verses = chapters[chapter]
        while len(verses) <= verse:
            verses.append("")
        verses[verse] = str(row["text"]).strip()
    return books


wlc = nest(extra / "HE-Hebrew" / "wlc.json", 0, 39)
tr = nest(extra / "GRC-Greek" / "tr.json", 39, 27)
payload = {
    "wlcCredit": "Westminster Leningrad Codex, public domain.",
    "trCredit": "Textus Receptus, public domain.",
    "wlc": wlc,
    "tr": tr,
}
out.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"wrote {out} ({out.stat().st_size} bytes)")

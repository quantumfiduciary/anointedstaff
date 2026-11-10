"""Add public-domain translations, the KJV Apocrypha, and Open Bible cross-references.

Sources:
- scrollmapper/bible_databases (MIT), formats/json for YLT, Darby, BBE, DRC, KJVA
- Open Bible cross-references, CC BY, via sources/extras/cross_references.txt
"""

from __future__ import annotations

import html
import json
import re
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "scrollmapper"
PUBLIC = ROOT / "public"
BASE = "https://raw.githubusercontent.com/scrollmapper/bible_databases/master"

BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
    "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah",
    "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
    "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
    "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke",
    "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy",
    "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
    "Jude", "Revelation", "1 Esdras", "2 Esdras", "Tobit", "Judith", "Additions to Esther",
    "Wisdom of Solomon", "Sirach", "Baruch", "Prayer of Azariah", "Susanna", "Bel and the Dragon",
    "Prayer of Manasseh", "1 Maccabees", "2 Maccabees",
]
INDEX = {name: index for index, name in enumerate(BOOKS)}

ABBREV = {
    "gen": "Genesis", "exod": "Exodus", "lev": "Leviticus", "num": "Numbers", "deut": "Deuteronomy",
    "josh": "Joshua", "judg": "Judges", "ruth": "Ruth", "1sam": "1 Samuel", "2sam": "2 Samuel",
    "1kgs": "1 Kings", "2kgs": "2 Kings", "1chr": "1 Chronicles", "2chr": "2 Chronicles",
    "ezra": "Ezra", "neh": "Nehemiah", "esth": "Esther", "job": "Job", "ps": "Psalms",
    "prov": "Proverbs", "eccl": "Ecclesiastes", "song": "Song of Solomon", "isa": "Isaiah",
    "jer": "Jeremiah", "lam": "Lamentations", "ezek": "Ezekiel", "dan": "Daniel", "hos": "Hosea",
    "joel": "Joel", "amos": "Amos", "obad": "Obadiah", "jonah": "Jonah", "mic": "Micah",
    "nah": "Nahum", "hab": "Habakkuk", "zeph": "Zephaniah", "hag": "Haggai", "zech": "Zechariah",
    "mal": "Malachi", "matt": "Matthew", "mark": "Mark", "luke": "Luke", "john": "John",
    "acts": "Acts", "rom": "Romans", "1cor": "1 Corinthians", "2cor": "2 Corinthians",
    "gal": "Galatians", "eph": "Ephesians", "phil": "Philippians", "col": "Colossians",
    "1thess": "1 Thessalonians", "2thess": "2 Thessalonians", "1tim": "1 Timothy",
    "2tim": "2 Timothy", "titus": "Titus", "phlm": "Philemon", "heb": "Hebrews", "jas": "James",
    "1pet": "1 Peter", "2pet": "2 Peter", "1john": "1 John", "2john": "2 John", "3john": "3 John",
    "jude": "Jude", "rev": "Revelation", "tob": "Tobit", "jdt": "Judith", "wis": "Wisdom of Solomon",
    "sir": "Sirach", "bar": "Baruch", "1macc": "1 Maccabees", "2macc": "2 Maccabees",
    "1esd": "1 Esdras", "2esd": "2 Esdras",
}

ALIASES = {
    "i samuel": "1 Samuel", "ii samuel": "2 Samuel", "iii john": "3 John", "ii john": "2 John",
    "i john": "1 John", "i kings": "1 Kings", "ii kings": "2 Kings", "i chronicles": "1 Chronicles",
    "ii chronicles": "2 Chronicles", "i corinthians": "1 Corinthians", "ii corinthians": "2 Corinthians",
    "i thessalonians": "1 Thessalonians", "ii thessalonians": "2 Thessalonians",
    "i timothy": "1 Timothy", "ii timothy": "2 Timothy", "i peter": "1 Peter", "ii peter": "2 Peter",
    "revelation of john": "Revelation", "song of songs": "Song of Solomon", "canticles": "Song of Solomon",
    "i esdras": "1 Esdras", "ii esdras": "2 Esdras", "1 esdras": "1 Esdras", "2 esdras": "2 Esdras",
    "wisdom": "Wisdom of Solomon", "wisdom of solomon": "Wisdom of Solomon",
    "the wisdom of solomon": "Wisdom of Solomon", "ecclesiasticus": "Sirach", "sirach": "Sirach",
    "prayer of azariah": "Prayer of Azariah", "prayer of azarias": "Prayer of Azariah",
    "song of the three": "Prayer of Azariah", "the song of the three holy children": "Prayer of Azariah",
    "prayer of manasses": "Prayer of Manasseh", "prayer of manasseh": "Prayer of Manasseh",
    "additions to esther": "Additions to Esther", "the rest of esther": "Additions to Esther",
    "bel and the dragon": "Bel and the Dragon", "susanna": "Susanna", "tobit": "Tobit", "judith": "Judith",
    "baruch": "Baruch", "i maccabees": "1 Maccabees", "ii maccabees": "2 Maccabees",
    "1 maccabees": "1 Maccabees", "2 maccabees": "2 Maccabees",
    "1 machabees": "1 Maccabees", "2 machabees": "2 Maccabees",
    "the first book of machabees": "1 Maccabees", "the second book of machabees": "2 Maccabees",
}


def download(path: str) -> Path:
    RAW.mkdir(parents=True, exist_ok=True)
    target = RAW / path.replace("/", "__")
    if target.exists() and target.stat().st_size > 1000:
        return target
    url = f"{BASE}/{path}"
    print("download", url)
    request = urllib.request.Request(url, headers={"User-Agent": "anointed-staff"})
    with urllib.request.urlopen(request, timeout=180) as response:
        target.write_bytes(response.read())
    return target


def canon_name(name: str) -> str | None:
    cleaned = re.sub(r"\s+", " ", name).strip()
    cleaned = re.sub(r"^(the )?(book of )", "", cleaned, flags=re.I)
    key = cleaned.lower()
    if key in ALIASES:
        return ALIASES[key]
    if cleaned in INDEX:
        return cleaned
    titled = cleaned.title() if cleaned[:1].isdigit() is False else cleaned
    return cleaned if cleaned in INDEX else None


def clean_verse(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\{[^}]*\}", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def chapters_from(book: dict) -> list[list[str]]:
    chapters = book.get("chapters") or []
    output: list[list[str]] = []
    for chapter in chapters:
        verses = chapter.get("verses") if isinstance(chapter, dict) else chapter
        if not isinstance(verses, list):
            continue
        if verses and isinstance(verses[0], dict):
            verses = sorted(verses, key=lambda item: int(item.get("verse") or item.get("number") or 0))
            output.append([clean_verse(str(item.get("text") or item.get("content") or "")) for item in verses])
        else:
            output.append([clean_verse(str(item)) for item in verses])
    return output


def load_version(path: str) -> dict[str, list[list[str]]]:
    payload = json.loads(download(path).read_text(encoding="utf-8"))
    found: dict[str, list[list[str]]] = {}
    missed: list[str] = []
    for book in payload["books"]:
        name = canon_name(str(book["name"]))
        if not name:
            missed.append(str(book["name"]))
            continue
        found[name] = chapters_from(book)
    if missed:
        print("unmapped", path, missed)
    return found


def align(version: dict[str, list[list[str]]]) -> list[list[list[str]]]:
    return [version.get(name, []) for name in BOOKS]


def build_cross_references() -> None:
    text = download("sources/extras/cross_references.txt").read_text(encoding="utf-8")
    ranked: dict[str, list[tuple[int, str]]] = defaultdict(list)
    unknown: set[str] = set()
    for line in text.splitlines()[1:]:
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        votes = int(parts[2])
        if votes <= 0:
            continue
        start = parse_ref(parts[0], unknown)
        end = parse_ref(parts[1].split("-")[0], unknown)
        if not start or not end:
            continue
        key = f"{start[0]}:{start[1]}:{start[2]}"
        label = f"{BOOKS[end[0]]} {end[1]}:{end[2]}"
        ranked[key].append((votes, label))
    compact: dict[str, list[str]] = {}
    for key, rows in ranked.items():
        seen: list[str] = []
        for _votes, label in sorted(rows, key=lambda item: -item[0]):
            if label in seen:
                continue
            seen.append(label)
            if len(seen) == 6:
                break
        if seen:
            compact[key] = seen
    target = PUBLIC / "crossrefs.json"
    target.write_text(json.dumps(compact, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("crossrefs", len(compact), "bytes", target.stat().st_size, "unknown", sorted(unknown)[:30])


def parse_ref(token: str, unknown: set[str]) -> tuple[int, int, int] | None:
    match = re.match(r"([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)", token.strip())
    if not match:
        return None
    name = ABBREV.get(match.group(1).lower())
    if not name:
        unknown.add(match.group(1))
        return None
    return INDEX[name], int(match.group(2)), int(match.group(3))


def main() -> None:
    scripture_path = PUBLIC / "scripture.json"
    scripture = json.loads(scripture_path.read_text(encoding="utf-8"))
    versions = {
        "kjv": {BOOKS[index]: chapters for index, chapters in enumerate(scripture["text"]["kjv"])},
        "asv": {BOOKS[index]: chapters for index, chapters in enumerate(scripture["text"]["asv"])},
        "ylt": load_version("formats/json/YLT.json"),
        "darby": load_version("formats/json/Darby.json"),
        "bbe": load_version("formats/json/BBE.json"),
        "drc": load_version("formats/json/DRC.json"),
    }
    kjva = load_version("formats/json/KJVA.json")
    for name, chapters in kjva.items():
        if INDEX[name] >= 66 and chapters:
            versions["kjv"][name] = chapters
    meta = [
        {"id": "kjv", "label": "KJV", "name": "King James Version", "year": "1769", "rights": "Public domain"},
        {"id": "asv", "label": "ASV", "name": "American Standard Version", "year": "1901", "rights": "Public domain"},
        {"id": "ylt", "label": "YLT", "name": "Young's Literal Translation", "year": "1898", "rights": "Public domain"},
        {"id": "darby", "label": "Darby", "name": "Darby Bible", "year": "1889", "rights": "Public domain"},
        {"id": "bbe", "label": "BBE", "name": "Bible in Basic English", "year": "1964", "rights": "Public domain"},
        {"id": "drc", "label": "DRC", "name": "Douay-Rheims Challoner", "year": "1752", "rights": "Public domain"},
    ]
    scripture["translations"] = meta
    scripture["source"] = (
        "Public-domain verse text from scrollmapper/bible_databases (MIT). "
        "The Apocrypha in the King James reading is the public-domain KJVA text from that library. "
        "Young's Literal Translation, the Darby Bible, the Bible in Basic English, and the Douay-Rheims Challoner revision are public domain."
    )
    scripture["text"] = {key: align(versions[key]) for key in ("kjv", "asv", "ylt", "darby", "bbe", "drc")}
    scripture_path.write_text(json.dumps(scripture, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("scripture bytes", scripture_path.stat().st_size)
    for key, books in scripture["text"].items():
        filled = sum(1 for book in books if book)
        print(key, "books", filled, "tobit", len(books[INDEX["Tobit"]]), "john1", books[INDEX["John"]][0][0][:48])
    build_cross_references()


if __name__ == "__main__":
    main()

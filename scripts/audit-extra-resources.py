"""Classify extra_resources update_* dumps as KEEP / REFUSE / SKIP / UNKNOWN.

Uses the same filename rules as build-library.py, build-update-02.py, and
build-update-03.py. Does not extract PDF text (filename rules only for speed).

Usage:
  python scripts/audit-extra-resources.py
  python scripts/audit-extra-resources.py --move-refuse   # move REFUSE+SKIP to archive
"""

from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[1]
extra = root / "extra_resources"
archive_root = Path(r"D:\APPS\Anointedstaff-archives")

# --- update_02 (from build-update-02.py) ---
REFUSE_02 = (
    "sefer-yetzirah-the-book-of-creation-aryeh-kaplan",
    "the-zohar-annotations-to-the-ashlag-commentary-michael-laitman",
    "the-mystical-qabalah-dion-fortune",
    "the-enoch-metatron-tradition-agata-paluch",
    "the-doctrine-of-angels-harold-willmington",
    "encyclopedia-of-demons-in-world-religions",
    "the-encyclopedia-of-demons-and-demonology-rosemary",
    "holy-spit-and-magic-spells",
    "a-practical-guide-to-afro-caribbean-magic",
    "the-eight-principles-of-tai-chi",
    "the-tai-chi-code",
    "health-qigong",
    "qigong-ba-duan-jin",
    "multifaceted-health-benefits-of-medical-qigong",
    "integral-qigong-and-tai-chi",
    "zhan-zhuang",
    "chi-kung-book",
    "a-beginner-s-guide-to-interpreting-your-astrological",
    "notes-on-the-signs-of-the-zodiac",
    "anthony-c.-yu-the-monkey",
    "wu-cheng-en-journey-to-the-west",
    "wu-chengen-journey-to-the-west",
    "journey_to_the_south",
    "journey-to-the-south",
    "the-shiva-purana",
    "the-four-yugas",
    "clearquran",
    "english-quran",
    "quran-arabic-english-clearquran",
    "circle 7 koran",
    "circle-7-koran",
    "bhagavad-gita-swami-bg-narasingha",
    "the-poetic-edda-edward-pettit",
    "the-ancient-egyptian-pyramid-texts-james-p-allen",
    "angels-in-the-bible-the-apocrypha",
    "the-watchers-of-satanail",
    "nagualism-a-study",
    "medicine-ceremony-of-the-menomini",
    "the-night-chant",
    "a-study-of-siouan-cults",
    "the-midewiwin-of-the-ojibwa",
    "the-myhts-of-mexico",
    "qr code",
)

# Substring matches for ingest (order matches build-update-02 first-match wins).
INGEST_02_MATCHES = [
    "book-of-jubilees",
    "baruch-2-baruch",
    "first-book-of-adam-and-eve",
    "odes-of-solomon",
    "sibylline",
    "3-maccabees",
    "4-maccabees",
    "3 maccabees",
    "4 maccabees",
    "shepherd of hermas",
    "epistle of barnabas",
    "barnabas",
    "paul and thecla",
    "acts of peter and the twelve",
    "acts of thomas",
    "apocalypse of peter",
    "apocalypse of paul",
    "epistula apostolorum",
    "gospel of nicodemus",
    "gospel of the ebionites",
    "gospel of bartholomew",
    "apocryphon of john",
    "sophia of jesus",
    "origin of the world",
    "tao te ching",
    "tao-te-ching",
    "prose edda",
    "prose-edda",
    "kybalion",
    "kabbalah unveiled",
    "kabbalah-unveiled",
    "greater key of solomon",
    "greater-key",
    "lesser key",
    "goetia",
    "sixth and seventh books of moses",
    "sixth-seventh",
    "emerald tablet",
    "kabala of numbers",
    "kabala-numbers",
    "raphael",
    "secret teachings of all ages",
    "secret-teachings",
    "bhagavad",
    "upanishad",
    "myths of china",
    "myths-china",
    "celtic",
    "golden bough",
    "golden-bough",
    "ramayana",
    "avesta",
    "daemonologie",
    "scott",
    "demonology",
]

WRITINGS_DUP_02 = (
    "gospel of thomas",
    "gospel-of-thomas",
    "gospel of mary",
    "gospel of judas",
    "gospel of philip",
    "gospel of truth",
    "gospel of peter",
    "egerton",
    "infancy",
    "secret mark",
    "stranger",
    "pistis",
    "enoch",  # careful — jubilees/readings may contain enoch; checked after jubilees
)

# --- update_03 ---
REFUSE_03 = {
    "etymological dictionary of greek.pdf",
    "150276553-aramaic-bible(1).pdf",
    "eastons-bible-dictionary.pdf",
    "calendar2026.pdf",
    "alphabet-chart-editable-1.pptx",
    "backdrops_original-hebrew-and-modern-aramaic_editable-1.pptx",
    "original-hebrew-font-files.zip",
    "ohb-all-books-genesis-to-malachi-1.pdf",
    "baileyuniversaletymdict1ed.pdf",
    "dictionaryofbwi01smit.pdf",
    "paleo-strongs-1.1.pdf",
    "free-bible-timeline-v-1.2.pdf",
    "calendar-kit_year-6228-from-adam-2026-2027.pdf",
    "28-month-calendar_years-6227-6229-from-adam-nov-2025-mar-2028.pdf",
}

KEEP_03 = {
    "eastons_bible_dictionary.pdf",
    "pg29765-h.zip",
    "dictionaryofbwi01smit_hocr_searchtext.txt.gz",
    "paleo-strongs-1.1.xlsx",
    "free-bible-timeline-spreadsheet-v-1.2.xlsx",
    "calendar-kit_year-6228-from-adam-march-2026-march-2027.xlsx",
    "to-the-watchmen-e-book_ancient-calendar-of-israel-biblical-timelines-and-end-times-prophecies.pdf",
    "original-hebrew-bible-spreadsheet-version-1.0.xlsx",
    "endtimestimeline_danielsfinalweek_apossiblescenario.webp",
    "mashach-anoint4k.png",
    "padah-redeem4k.png",
    "palal-pray4k.png",
    "qodesh-holy4k.png",
    "tov-good4k.png",
    "tsadiq-righteous4k.png",
    "word-study-chesed.pdf",
    "alphabet-chart.pdf",
    "10-commandments-in-paleo-hebrew.pdf",
    "aaronic-blessing-in-paleo-hebrew.pdf",
    "how-the-paleo-hebrew-alphabet-points-to-yashua-our-messiah.pdf",
}

# --- update_01 filename refuse (markers in name; content refuse needs PDF head) ---
REFUSE_01_NAME = (
    "keys of enoch",
    "keys-of-enoch",
    "pdfcoffee.com-the-book-of-knowledge-the-keys-of-enoch",
    "dictionary-of-deities-and-demons",
    "hebrew gospel of matthew by george howard",
    "george howard",
    "1990",
    "book of mormon",  # 1990 typesetting — desk uses public-domain note path
    "laitman",
    "zohar",
)

KEEP_01_NAME = (
    "jasher",
    "targum",
    "daemonologie",
    "demonology by king james",
    "talmud",
    "sepher yetzirah",
    "book of formation",
    "geneva",  # build source for witness; large but may still be KEEP for rebuilds — mark KEEP_SOURCE
    "paleo",
    "alphabet",
)


def size_of(path: Path) -> int:
    return path.stat().st_size if path.is_file() else 0


def fmt_mb(n: int) -> str:
    return f"{n / (1024 * 1024):.1f} MB"


def classify_02(name: str) -> str:
    key = name.lower()
    if key.endswith(".crdownload") or "qr code" in key:
        return "REFUSE"
    for mark in REFUSE_02:
        if mark in key:
            return "REFUSE"
    # writings.json duplicates — skip (already shipped)
    for mark in (
        "gospel-of-thomas",
        "gospel of thomas",
        "gospel-of-mary",
        "gospel of mary",
        "gospel-of-judas",
        "gospel of judas",
        "gospel-of-philip",
        "gospel of philip",
        "gospel-of-truth",
        "gospel of truth",
        "gospel-of-peter",
        "gospel of peter",
        "egerton",
        "infancy-gospel",
        "secret-mark",
        "stranger",
        "pistis-sophia",
        "poxy",
        "quelle",
        "secret book of james",
    ):
        if mark in key:
            return "SKIP"
    for mark in INGEST_02_MATCHES:
        if mark in key:
            return "KEEP"
    if not key.endswith(".pdf"):
        return "SKIP"
    return "UNKNOWN"


def classify_03(name: str) -> str:
    key = name.lower()
    if key in REFUSE_03:
        return "REFUSE"
    if key in KEEP_03:
        return "KEEP"
    if "mazzaroth" in key or "tribeoscope" in key or "hebrew-of-creation" in key:
        return "SKIP"
    return "SKIP"


def classify_01(name: str) -> str:
    key = name.lower()
    for mark in REFUSE_01_NAME:
        if mark in key:
            # Book of Mormon 1830 vs 1990 — refuse if 1990 in name
            if mark == "book of mormon" and "1990" not in key and "1830" in key:
                return "KEEP"
            if mark == "book of mormon" and "1990" not in key:
                return "SKIP"  # ambiguous edition
            if mark == "book of mormon":
                return "REFUSE"
            return "REFUSE"
    for mark in KEEP_01_NAME:
        if mark in key:
            return "KEEP"
    if key.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
        return "SKIP"
    if key.endswith(".pdf"):
        return "UNKNOWN"
    return "SKIP"


def classify(folder: str, name: str) -> str:
    if folder == "update_01":
        return classify_01(name)
    if folder == "update_02":
        return classify_02(name)
    if folder == "update_03":
        return classify_03(name)
    return "UNKNOWN"


def dir_size(path: Path) -> int:
    total = 0
    if not path.exists():
        return 0
    for p in path.rglob("*"):
        if p.is_file():
            total += p.stat().st_size
    return total


def audit_folder(name: str) -> dict[str, list[tuple[Path, int]]]:
    folder = extra / name
    buckets: dict[str, list[tuple[Path, int]]] = {"KEEP": [], "REFUSE": [], "SKIP": [], "UNKNOWN": []}
    if not folder.is_dir():
        return buckets
    for path in sorted(folder.iterdir(), key=lambda p: p.name.lower()):
        if not path.is_file():
            continue
        kind = classify(name, path.name)
        buckets[kind].append((path, size_of(path)))
    return buckets


def print_report(buckets_by_folder: dict[str, dict[str, list[tuple[Path, int]]]]) -> list[str]:
    lines: list[str] = []
    grand = {"KEEP": 0, "REFUSE": 0, "SKIP": 0, "UNKNOWN": 0}

    def add(line: str) -> None:
        lines.append(line)
        print(line)

    add("=" * 72)
    add("extra_resources audit (filename rules from build-*.py)")
    add("=" * 72)

    for folder, buckets in buckets_by_folder.items():
        add("")
        add(f"## {folder}")
        for kind in ("KEEP", "REFUSE", "SKIP", "UNKNOWN"):
            items = buckets[kind]
            total = sum(sz for _, sz in items)
            grand[kind] += total
            add(f"  {kind:8} {len(items):3} files  {fmt_mb(total)}")
            for path, sz in sorted(items, key=lambda x: -x[1])[:8]:
                add(f"    - {fmt_mb(sz):>10}  {path.name}")
            if len(items) > 8:
                add(f"    … +{len(items) - 8} more")

    add("")
    add("## Totals across update_01–03")
    for kind, total in grand.items():
        add(f"  {kind:8} {fmt_mb(total)}")
    reclaim = grand["REFUSE"] + grand["SKIP"]
    add(f"  reclaimable (REFUSE+SKIP): {fmt_mb(reclaim)}")

    add("")
    add("## Bible dump packs vs shipped witnesses")
    for name in ("bibles_json_6.0", "bibles_csv_6.0", "bibles_pdf_6.0"):
        add(f"  {name:22} {fmt_mb(dir_size(extra / name))}")
    add(f"  {'public/witnesses':22} {fmt_mb(dir_size(root / 'public' / 'witnesses'))}")

    add("")
    add("## Notable root dumps under extra_resources/")
    for path in sorted(extra.iterdir(), key=lambda p: -size_of(p) if p.is_file() else 0):
        if path.is_file() and size_of(path) > 5 * 1024 * 1024:
            add(f"  {fmt_mb(size_of(path)):>10}  {path.name}")

    return lines


def move_refuse_skip(buckets_by_folder: dict[str, dict[str, list[tuple[Path, int]]]]) -> None:
    archive_root.mkdir(parents=True, exist_ok=True)
    moved = 0
    bytes_moved = 0
    for folder, buckets in buckets_by_folder.items():
        dest = archive_root / folder
        dest.mkdir(parents=True, exist_ok=True)
        for kind in ("REFUSE", "SKIP"):
            for path, sz in buckets[kind]:
                target = dest / path.name
                if target.exists():
                    target = dest / f"{path.stem}__dup{path.suffix}"
                print(f"MOVE  {kind:6} {path.name} → {target}")
                shutil.move(str(path), str(target))
                moved += 1
                bytes_moved += sz
    print(f"Moved {moved} files ({fmt_mb(bytes_moved)}) to {archive_root}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--move-refuse",
        action="store_true",
        help="Move REFUSE and SKIP files from update_* into D:\\APPS\\Anointedstaff-archives\\",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=root / "extra_resources_audit.txt",
        help="Write report text here",
    )
    args = parser.parse_args()

    folders = ("update_01", "update_02", "update_03")
    buckets_by_folder = {name: audit_folder(name) for name in folders}
    lines = print_report(buckets_by_folder)
    args.report.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nWrote {args.report}")

    if args.move_refuse:
        move_refuse_skip(buckets_by_folder)


if __name__ == "__main__":
    main()

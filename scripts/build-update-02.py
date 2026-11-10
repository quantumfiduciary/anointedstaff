"""Ingest public-domain Extra-canon works from extra_resources/update_02.

Modern copyrighted PDFs are refused. Duplicates already in writings.json are skipped.
Merges into public/library/*.json and public/library/catalog.json without dropping
existing catalog entries.
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
UPDATE = root / "extra_resources" / "update_02"
out_dir = root / "public" / "library"
catalog_path = out_dir / "catalog.json"

# Already shipped in writings.json — do not re-add under library.
WRITINGS_IDS = {
    "enoch",
    "pistis",
    "poxy-5575",
    "thomas",
    "mary",
    "judas",
    "philip",
    "truth",
    "peter",
    "egerton",
    "quelle",
    "james",
    "infancy-james",
    "infancy-thomas",
    "stranger",
    "secret-mark",
}

# Filename substrings → hard refuse (modern copyright / incomplete / wrong surface).
REFUSE_FILES = (
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

# Extra in-content refuse markers for update_02.
REFUSED_EXTRA = (
    "aryeh kaplan",
    "michael laitman",
    "dion fortune",
    "agata paluch",
    "harold willmington",
    "theresa bane",
    "rosemary ellen guiley",
    "anthony c. yu",
    "clearquran",
    "all rights reserved",
    "© 20",
    "copyright © 20",
)

# Eligible ingest specs: filename match (case-insensitive substring) → work meta.
# Order matters: first match wins.
INGEST: list[dict] = [
    # Enoch / Hebrew adjacent
    {
        "match": "book-of-jubilees",
        "id": "jubilees",
        "title": "Book of Jubilees",
        "credit": "R. H. Charles tradition / public-domain English of Jubilees. From update_02 PDF when extractable.",
        "shelf": "enoch",
        "max_sections": 60,
    },
    {
        "match": "baruch-2-baruch",
        "id": "baruch",
        "title": "Apocalypse of Baruch (2 Baruch)",
        "credit": "Public-domain English of 2 Baruch (Syriac Apocalypse of Baruch). Update_02 extract.",
        "shelf": "enoch",
        "max_sections": 60,
    },
    {
        "match": "first-book-of-adam-and-eve",
        "id": "adam-eve",
        "title": "First Book of Adam and Eve",
        "credit": "Rutherford H. Platt, Jr., The First Book of Adam and Eve. Public domain.",
        "shelf": "hebrew",
        "max_sections": 80,
    },
    {
        "match": "odes-of-solomon",
        "id": "odes-solomon",
        "title": "Odes of Solomon",
        "credit": "Public-domain English of the Odes of Solomon. Update_02 extract.",
        "shelf": "enoch",
        "max_sections": 50,
    },
    {
        "match": "sibylline-oracles",
        "id": "sibylline",
        "title": "Sibylline Oracles",
        "credit": "Public-domain English of the Sibylline Oracles. Update_02 extract.",
        "shelf": "enoch",
        "max_sections": 60,
    },
    {
        "match": "3-maccabees",
        "id": "3-maccabees",
        "title": "3 Maccabees",
        "credit": "Public-domain English of 3 Maccabees (not in the KJVA Bible window). Update_02 extract.",
        "shelf": "enoch",
        "max_sections": 40,
    },
    {
        "match": "4-maccabees",
        "id": "4-maccabees",
        "title": "4 Maccabees",
        "credit": "Public-domain English of 4 Maccabees (not in the KJVA Bible window). Update_02 extract.",
        "shelf": "enoch",
        "max_sections": 40,
    },
    # Fathers / early Christian
    {
        "match": "15.-the-shepherd-of-hermas",
        "id": "hermas",
        "title": "Shepherd of Hermas",
        "credit": "Public-domain English of the Shepherd of Hermas. Update_02 extract.",
        "shelf": "fathers",
        "max_sections": 80,
    },
    {
        "match": "9.-epistle-of-barnabas",
        "id": "barnabas",
        "title": "Epistle of Barnabas",
        "credit": "Public-domain English of the Epistle of Barnabas. Update_02 extract.",
        "shelf": "fathers",
        "max_sections": 40,
    },
    {
        "match": "8.-the-acts-of-paul-and-thecla",
        "id": "paul-thecla",
        "title": "Acts of Paul and Thecla",
        "credit": "Public-domain English of the Acts of Paul and Thecla. Update_02 extract.",
        "shelf": "fathers",
        "max_sections": 40,
    },
    {
        "match": "13.-apocalypse-of-peter",
        "id": "apocalypse-peter",
        "title": "Apocalypse of Peter",
        "credit": "Public-domain English of the Apocalypse of Peter. Update_02 extract.",
        "shelf": "fathers",
        "max_sections": 40,
    },
    {
        "match": "14.-apocalypse-of-paul",
        "id": "apocalypse-paul",
        "title": "Apocalypse of Paul",
        "credit": "Public-domain English of the Apocalypse of Paul. Update_02 extract.",
        "shelf": "fathers",
        "max_sections": 50,
    },
    {
        "match": "epistle-of-the-apostles",
        "id": "epistula-apostolorum",
        "title": "Epistle of the Apostles",
        "credit": "Public-domain English of the Epistula Apostolorum. Update_02 extract.",
        "shelf": "fathers",
        "max_sections": 40,
    },
    {
        "match": "16.-acts-of-peter-and-the-twelve",
        "id": "acts-peter-twelve",
        "title": "Acts of Peter and the Twelve Apostles",
        "credit": "Public-domain English of the Acts of Peter and the Twelve Apostles. Update_02 extract.",
        "shelf": "fathers",
        "max_sections": 40,
    },
    {
        "match": "acts-of-thomas",
        "id": "acts-thomas",
        "title": "Acts of Thomas",
        "credit": "Public-domain English of the Acts of Thomas. Update_02 extract.",
        "shelf": "fathers",
        "max_sections": 60,
    },
    {
        "match": "gospel-of-nicodemus",
        "id": "nicodemus",
        "title": "Gospel of Nicodemus (Acts of Pilate)",
        "credit": "Public-domain English of the Gospel of Nicodemus / Acts of Pilate. Update_02 extract.",
        "shelf": "fathers",
        "max_sections": 50,
    },
    {
        "match": "gospel-of-the-ebionites",
        "id": "ebionites",
        "title": "Gospel of the Ebionites",
        "credit": "Public-domain fragments of the Gospel of the Ebionites. Update_02 extract.",
        "shelf": "fathers",
        "max_sections": 20,
    },
    {
        "match": "protoevangelium-of-st.-james",
        "id": "infancy-james",
        "title": "Protoevangelium of James",
        "credit": "Already shipped as Infancy Gospel of James in writings.json.",
        "shelf": "fathers",
        "skip": True,
    },
    # Gnostic / Nag Hammadi
    {
        "match": "apocryphon-of-john",
        "id": "apocryphon-john",
        "title": "Apocryphon of John",
        "credit": "Public-domain English of the Apocryphon of John (Secret Book of John). Update_02 extract.",
        "shelf": "sophia",
        "max_sections": 50,
    },
    {
        "match": "sophia-of-jesus-christ",
        "id": "sophia-jesus",
        "title": "Sophia of Jesus Christ",
        "credit": "Public-domain English of the Sophia of Jesus Christ. Update_02 extract.",
        "shelf": "sophia",
        "max_sections": 40,
    },
    {
        "match": "on-the-origin-of-the-worl",
        "id": "origin-world",
        "title": "On the Origin of the World",
        "credit": "Public-domain English of On the Origin of the World (Nag Hammadi). Update_02 extract.",
        "shelf": "sophia",
        "max_sections": 40,
    },
    {
        "match": "gospel-of-bartholomew",
        "id": "bartholomew",
        "title": "Gospel of Bartholomew",
        "credit": "Public-domain English of the Gospel of Bartholomew. Update_02 extract.",
        "shelf": "gospels",
        "max_sections": 40,
    },
    {
        "match": "5.-the-gospel-of-truth",
        "id": "truth",
        "title": "Gospel of Truth",
        "credit": "Already in writings.json as Gospels.net / Sophia shelf; skipped if present.",
        "shelf": "sophia",
        "skip": True,
    },
    {
        "match": "secret-gospel-of-mark",
        "id": "secret-mark",
        "title": "Secret Gospel of Mark",
        "credit": "Already in writings.json; skipped.",
        "shelf": "gospels",
        "skip": True,
    },
    # Hermetic / classical occult PD
    {
        "match": "the-kybalion-three-initiates",
        "id": "kybalion",
        "title": "The Kybalion",
        "credit": "Three Initiates, 1908. Public domain.",
        "shelf": "hermetic",
        "max_sections": 40,
    },
    {
        "match": "the-kabbalah-unveiled",
        "id": "kabbalah-unveiled",
        "title": "The Kabbalah Unveiled",
        "credit": "S. L. MacGregor Mathers. Public domain English of Zoharic selections.",
        "shelf": "hermetic",
        "max_sections": 50,
    },
    {
        "match": "sepher-yetzirah-the-book-of-formation-william-wynn-westcott",
        "id": "yetzirah",
        "title": "Sefer Yetzirah (Westcott)",
        "credit": "William Wynn Westcott, Sepher Yetzirah. Public domain. Replaces desk-notes stub when extract succeeds.",
        "shelf": "hebrew",
        "max_sections": 30,
    },
    {
        "match": "the-greater-key-of-solomon",
        "id": "greater-key-solomon",
        "title": "Greater Key of Solomon",
        "credit": "S. L. MacGregor Mathers edition. Public domain historical grimoire text for study, not practice instruction.",
        "shelf": "hermetic",
        "max_sections": 50,
    },
    {
        "match": "the-lesser-key-of-solomon-goetia",
        "id": "lesser-key-goetia",
        "title": "Lesser Key of Solomon (Goetia)",
        "credit": "Public-domain English of the Goetia (Lesser Key). Historical study text only.",
        "shelf": "hermetic",
        "max_sections": 50,
    },
    {
        "match": "the-sixth-and-seventh-books-of-moses",
        "id": "sixth-seventh-moses",
        "title": "Sixth and Seventh Books of Moses",
        "credit": "Johann Scheible tradition English. Ingested only when the PDF head passes the public-domain gate.",
        "shelf": "hermetic",
        "max_sections": 40,
    },
    {
        "match": "letters-on-demonology-and-witchcraft-walter-scott",
        "id": "scott-demonology",
        "title": "Letters on Demonology and Witchcraft",
        "credit": "Sir Walter Scott, 1830. Public domain.",
        "shelf": "witnesses",
        "max_sections": 40,
    },
    {
        "match": "the-emerald-tablets",
        "id": "emerald-tablet",
        "title": "Emerald Tablet (Hermetic)",
        "credit": "Short Hermetic Emerald Tablet tradition. Modern New Age ‘Tablets of Thoth’ dumps are refused if copyrighted; PD short text only.",
        "shelf": "hermetic",
        "max_sections": 12,
        "max_pages": 40,
    },
    {
        "match": "01.-the-kabala-of-numbers",
        "id": "kabala-numbers",
        "title": "The Kabala of Numbers",
        "credit": "Sepharial. Early twentieth-century public-domain numerology text when the PDF passes the gate.",
        "shelf": "hermetic",
        "max_sections": 40,
    },
    {
        "match": "raphael-s-medical-astrology",
        "id": "raphael-astrology",
        "title": "Raphael’s Medical Astrology",
        "credit": "Raphael (historical). Ingested only when the PDF passes the public-domain gate. Reading beside Heavens, not chart data.",
        "shelf": "hermetic",
        "max_sections": 40,
    },
    {
        "match": "the-secret-teachings-of-all-ages",
        "id": "secret-teachings",
        "title": "The Secret Teachings of All Ages",
        "credit": "Manly P. Hall, 1928. Public domain in the US. Selected chapters when extract is large.",
        "shelf": "hermetic",
        "max_sections": 40,
        "max_pages": 120,
    },
    # World / comparative
    {
        "match": "the-bhagavad-gita-the-song-celestial-edwin-arnold",
        "id": "bhagavad-gita",
        "title": "Bhagavad Gita (Arnold)",
        "credit": "Sir Edwin Arnold, The Song Celestial, 1885. Public domain. Not a modern ISKCON edition.",
        "shelf": "world",
        "max_sections": 50,
    },
    {
        "match": "the-upanishads-f-max-muller",
        "id": "upanishads",
        "title": "The Upanishads (Max Müller)",
        "credit": "F. Max Müller translation. Public domain. Selected sections.",
        "shelf": "world",
        "max_sections": 50,
        "max_pages": 150,
    },
    {
        "match": "tao-te-ching-lao-tzu",
        "id": "tao-te-ching",
        "title": "Tao Te Ching",
        "credit": "Public-domain English of the Tao Te Ching (Laozi). One edition from update_02.",
        "shelf": "world",
        "max_sections": 90,
    },
    {
        "match": "tao_te_ching-laozi",
        "id": "tao-te-ching",
        "title": "Tao Te Ching",
        "credit": "Public-domain English of the Tao Te Ching (Laozi).",
        "shelf": "world",
        "max_sections": 90,
    },
    {
        "match": "taoteching",
        "id": "tao-te-ching",
        "title": "Tao Te Ching",
        "credit": "Public-domain English of the Tao Te Ching (Laozi).",
        "shelf": "world",
        "max_sections": 90,
    },
    {
        "match": "the-prose-edda",
        "id": "prose-edda",
        "title": "The Prose Edda",
        "credit": "Snorri Sturluson, public-domain English. Update_02 extract.",
        "shelf": "world",
        "max_sections": 50,
        "max_pages": 120,
    },
    {
        "match": "myths-and-legends-of-china",
        "id": "myths-china",
        "title": "Myths and Legends of China",
        "credit": "E. T. C. Werner. Public domain. Selected chapters.",
        "shelf": "world",
        "max_sections": 40,
        "max_pages": 100,
    },
    {
        "match": "myths-and-legends-of-the-celtic-race",
        "id": "myths-celtic",
        "title": "Myths and Legends of the Celtic Race",
        "credit": "T. W. Rolleston. Public domain. Selected chapters.",
        "shelf": "world",
        "max_sections": 40,
        "max_pages": 100,
    },
    {
        "match": "the-golden-bough",
        "id": "golden-bough",
        "title": "The Golden Bough (selected)",
        "credit": "Sir James George Frazer. Public-domain early edition. Selected chapters only.",
        "shelf": "world",
        "max_sections": 30,
        "max_pages": 80,
    },
    {
        "match": "ramayana-valmiki",
        "id": "ramayana",
        "title": "Ramayana (Valmiki, English)",
        "credit": "Public-domain English of the Ramayana when the PDF passes the gate. Selected books.",
        "shelf": "world",
        "max_sections": 40,
        "max_pages": 100,
    },
    {
        "match": "the-avesta",
        "id": "avesta",
        "title": "Avesta (sample)",
        "credit": "Sacred Zoroastrian texts sample. Shipped only if extract is substantial and public domain.",
        "shelf": "world",
        "max_sections": 20,
        "min_chars": 3000,
    },
    # Jasher already in library — skip re-ingest unless forced
    {
        "match": "book-of-jasher",
        "id": "jasher",
        "title": "Book of Jasher",
        "credit": "Already in Extra-canon library.",
        "shelf": "hebrew",
        "skip": True,
    },
]


def name_key(path: Path) -> str:
    return re.sub(r"[_\s]+", "-", path.name.lower())


def is_refused_file(path: Path) -> str | None:
    key = name_key(path)
    if path.suffix.lower() == ".crdownload":
        return "incomplete download"
    if path.suffix.lower() not in {".pdf", ".docx"}:
        if path.suffix.lower() in {".png", ".jpg", ".jpeg"}:
            return "not a book"
        return "unsupported type"
    for mark in REFUSE_FILES:
        if mark in key:
            return f"refuse list: {mark}"
    return None


def check_copyright(path: Path) -> str | None:
    """Return refuse reason or None if OK / unclear-but-allowed by allowlist ingest."""
    try:
        head = lib.first_pages(path, 4)
    except Exception as error:
        return f"unreadable: {error}"
    if any(mark in head for mark in lib.ALLOWED_PD):
        return None
    for mark in (*lib.REFUSED, *REFUSED_EXTRA):
        if mark in head:
            return f"in-copyright marker {mark!r}"
    if re.search(r"copyright\s*(©|\(c\))?\s*(19|20)\d{2}", head) and "public domain" not in head:
        year = re.search(r"(19|20)\d{2}", head)
        if year and int(year.group()) >= 1929:
            return f"modern copyright notice (~{year.group()})"
    return None


def chunk_long_paragraphs(sections: list[dict], max_chars: int = 1800) -> list[dict]:
    """Break a single giant OCR blob into readable readings."""
    out: list[dict] = []
    for section in sections:
        for para in section.get("paragraphs", []):
            if len(para) <= max_chars:
                out.append({"title": section["title"], "paragraphs": [para]})
                continue
            # Prefer verse-like breaks: leading "12 And ..."
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
                out.append({"title": f"{section['title']} · {part}" if part > 1 else section["title"], "paragraphs": [" ".join(bucket)]})
    return out or sections


def sections_from_text(text: str, max_sections: int) -> list[dict]:
    patterns = [
        (r"\n\s*(?:CHAPTER|Chapter|Chap\.?)\s+([IVXLC\d]+)[.\s:\-]*\n", "Chapter {number}"),
        (r"\n\s*JUBILEES\s+(\d+)\s*\n", "Jubilees {number}"),
        (r"\n\s*(?:ODE|Ode)\s+(\d+)\s*\n", "Ode {number}"),
        (r"\n\s*(?:VISION|Vision|MANDATE|Mandate|SIMILITUDE|Similitude)\s+([IVXLC\d]+)\s*\n", "{number}"),
        (r"\n\s*(?:BOOK|Book)\s+([IVXLC\d]+)\s*\n", "Book {number}"),
        (r"\n\s*(\d+)\s*\n", "Chapter {number}"),
    ]
    sections: list[dict] = []
    for pattern, title_fmt in patterns:
        sections = lib.split_chapters(text, pattern, title_fmt)
        if len(sections) >= 3:
            break
    if len(sections) < 3:
        body = lib.paragraphs(text, min_len=20)
        if len(body) == 1 and len(body[0]) > 4000:
            sections = chunk_long_paragraphs([{"title": "Reading", "paragraphs": body}], max_chars=1600)
        else:
            sections = [{"title": f"Reading {index // 6 + 1}", "paragraphs": body[index : index + 6]} for index in range(0, len(body), 6)]
    # Giant single sections → readable chunks
    if len(sections) <= 2:
        total = sum(len(p) for s in sections for p in s.get("paragraphs", []))
        if total > 8000:
            sections = chunk_long_paragraphs(sections, max_chars=1600)
    trimmed: list[dict] = []
    for section in sections:
        paras = [p[:8000] for p in section["paragraphs"][:10]]
        if paras:
            trimmed.append({"title": section["title"][:120], "paragraphs": paras})
        if len(trimmed) >= max_sections:
            break
    return trimmed


def ingest_pdf(path: Path, spec: dict) -> dict | None:
    if spec.get("skip"):
        return None
    work_id = spec["id"]
    if work_id in WRITINGS_IDS and spec.get("skip_if_writings", True) and work_id in {"truth", "secret-mark", "infancy-james"}:
        return None
    reason = check_copyright(path)
    # For known A-tier ancient texts without a printed PD notice, allow if extract is large.
    if reason and "modern copyright" in reason:
        raise RuntimeError(reason)
    if reason and "in-copyright marker" in reason:
        raise RuntimeError(reason)
    max_pages = spec.get("max_pages")
    text = lib.extract_pages(path, stop=max_pages)
    min_chars = spec.get("min_chars", 1500)
    if len(text) < min_chars:
        raise RuntimeError(f"extract too short ({len(text)} chars)")
    sections = sections_from_text(text, spec.get("max_sections", 40))
    if not sections:
        raise RuntimeError("no sections")
    return {
        "id": work_id,
        "title": spec["title"],
        "credit": spec["credit"],
        "shelf": spec["shelf"],
        "sections": sections,
    }


def match_spec(path: Path) -> dict | None:
    key = name_key(path)
    for spec in INGEST:
        if spec["match"] in key:
            return spec
    return None


def reparse_existing(work_id: str, max_sections: int = 60) -> dict | None:
    """Re-split a library JSON that landed as one giant blob."""
    path = out_dir / f"{work_id}.json"
    if not path.exists():
        return None
    current = json.loads(path.read_text(encoding="utf-8"))
    blob = "\n\n".join(p for s in current.get("sections", []) for p in s.get("paragraphs", []))
    if len(current.get("sections", [])) >= 8 and max(len(p) for s in current["sections"] for p in s["paragraphs"]) < 12000:
        return None
    sections = sections_from_text(blob, max_sections)
    if len(sections) <= len(current.get("sections", [])):
        # Still try chunking
        sections = chunk_long_paragraphs(current["sections"], max_chars=1600)[:max_sections]
    if not sections:
        return None
    current["sections"] = sections
    return current


def upgrade_jubilees_from_pdf() -> dict | None:
    path = UPDATE / "Book-of-Jubilees-Attributed-to-Moses.pdf"
    if not path.exists():
        return None
    text = lib.extract_pages(path)
    sections = sections_from_text(text, 60)
    if len(sections) < 5:
        return None
    return {
        "id": "jubilees",
        "title": "Book of Jubilees",
        "credit": "Public-domain English of Jubilees (update_02). Chaptered from JUBILEES N markers.",
        "shelf": "enoch",
        "sections": sections,
    }


def upgrade_mormon_from_web() -> dict | None:
    existing = out_dir / "mormon.json"
    if existing.exists():
        current = json.loads(existing.read_text(encoding="utf-8"))
        paras = sum(len(s.get("paragraphs", [])) for s in current.get("sections", []))
        blob = " ".join(p for s in current.get("sections", []) for p in s.get("paragraphs", []))
        if paras >= 20 and "Nephi" in blob:
            return None
    # SSL issues on some hosts — try Gutenberg with unverified context as last resort for PD text.
    import ssl
    import urllib.request

    url = "https://www.gutenberg.org/files/17/17-0.txt"
    try:
        ctx = ssl._create_unverified_context()
        request = urllib.request.Request(url, headers={"User-Agent": "AnointedStaff/0.1 (public-domain ingest)"})
        with urllib.request.urlopen(request, timeout=60, context=ctx) as response:
            text = response.read().decode("utf-8", "replace")
    except Exception as error:
        print("mormon fetch failed", error)
        return None
    # Reuse parse logic from build-library by writing temp through lib.mormon path:
    # Inline minimal Nephi extract.
    start = text.find("1 Nephi Chapter 1")
    if start < 0:
        return None
    body = text[start:].split("*** END OF")[0]
    parts = re.split(r"\n(?=\d?\s?[A-Za-z]+(?:\s+[A-Za-z]+)?\s+Chapter\s+\d+)", body)
    sections: list[dict] = []
    for part in parts:
        lines = [re.sub(r"\s+", " ", line).strip() for line in part.splitlines() if line.strip()]
        if not lines:
            continue
        title = lines[0][:100]
        paras = [line for line in lines[1:] if len(line) > 40][:8]
        if paras:
            sections.append({"title": title, "paragraphs": paras})
        if len(sections) >= 48:
            break
    if len(sections) < 5:
        return None
    return {
        "id": "mormon",
        "title": "Book of Mormon (1830)",
        "credit": "1830 English wording via Project Gutenberg. Public domain. Not the 1990 Church of Christ edition.",
        "shelf": "other",
        "sections": sections,
    }


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

    files = sorted(UPDATE.iterdir(), key=lambda p: p.name.lower())
    for path in files:
        if not path.is_file():
            continue
        refuse = is_refused_file(path)
        if refuse:
            report.append(f"REFUSE  {path.name}  ({refuse})")
            continue
        if path.suffix.lower() != ".pdf":
            report.append(f"SKIP    {path.name}  (not pdf)")
            continue
        spec = match_spec(path)
        if not spec:
            report.append(f"SKIP    {path.name}  (no ingest rule — left on disk)")
            continue
        if spec.get("skip"):
            report.append(f"SKIP    {path.name}  (duplicate / already shipped as {spec['id']})")
            continue
        if spec["id"] in seen_ids:
            report.append(f"SKIP    {path.name}  (already ingested as {spec['id']})")
            continue
        try:
            work = ingest_pdf(path, spec)
        except Exception as error:
            report.append(f"FAIL    {path.name}  ({error})")
            continue
        if not work:
            report.append(f"SKIP    {path.name}  (empty)")
            continue
        entry = lib.write_work(work)
        written.append(entry)
        seen_ids.add(work["id"])
        report.append(f"OK      {path.name}  → {work['id']}")

    # Re-split thin/giant blobs already written
    for work_id in (
        "jubilees",
        "hermas",
        "odes-solomon",
        "lesser-key-goetia",
        "nicodemus",
        "bartholomew",
        "sophia-jesus",
        "origin-world",
        "apocryphon-john",
        "myths-celtic",
        "emerald-tablet",
    ):
        try:
            work = reparse_existing(work_id)
        except Exception as error:
            report.append(f"FAIL    reparse:{work_id}  ({error})")
            continue
        if not work:
            report.append(f"SKIP    reparse:{work_id}")
            continue
        entry = lib.write_work(work)
        written.append(entry)
        report.append(f"OK      reparse:{work_id}  → {len(work['sections'])} sections")

    # Jubilees from PDF with JUBILEES N markers
    try:
        work = upgrade_jubilees_from_pdf()
        if work and len(work["sections"]) >= 10:
            entry = lib.write_work(work)
            written.append(entry)
            report.append(f"OK      pdf:jubilees  → {len(work['sections'])} sections")
        else:
            report.append("SKIP    pdf:jubilees  (thin)")
    except Exception as error:
        report.append(f"FAIL    pdf:jubilees  ({error})")

    # Mormon from Gutenberg
    try:
        work = upgrade_mormon_from_web()
        if work:
            entry = lib.write_work(work)
            written.append(entry)
            report.append(f"OK      web:mormon  → {len(work['sections'])} sections")
        else:
            report.append("SKIP    web:mormon")
    except Exception as error:
        report.append(f"FAIL    web:mormon  ({error})")

    # Keep Westcott only if richer than desk notes; else restore notes
    yetzirah_path = out_dir / "yetzirah.json"
    if yetzirah_path.exists():
        current = json.loads(yetzirah_path.read_text(encoding="utf-8"))
        paras = sum(len(s.get("paragraphs", [])) for s in current.get("sections", []))
        if paras < 6 or "Westcott" in current.get("credit", "") and paras < 10:
            notes = lib.yetzirah_notes()
            entry = lib.write_work(notes)
            written.append(entry)
            report.append("OK      restore:yetzirah desk notes")

    merge_catalog(written)

    print("\n--- update_02 report ---")
    for line in report:
        print(line)
    ok = sum(1 for line in report if line.startswith("OK"))
    refuse = sum(1 for line in report if line.startswith("REFUSE"))
    fail = sum(1 for line in report if line.startswith("FAIL"))
    skip = sum(1 for line in report if line.startswith("SKIP"))
    print(f"\nsummary: ok={ok} refuse={refuse} fail={fail} skip={skip}")


if __name__ == "__main__":
    main()

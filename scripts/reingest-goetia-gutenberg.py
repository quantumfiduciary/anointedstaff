"""Re-ingest Lesser Key / Goetia from Project Gutenberg #72679 (De Laurence 1916, PD US).

Historical Extra-canon study text only — not ritual instruction.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "extra_resources" / "pg72679.txt"
OUT = ROOT / "public" / "library" / "lesser-key-goetia.json"
CATALOG = ROOT / "public" / "library" / "catalog.json"

CREDIT = (
    "L. W. de Laurence, ed., The Lesser Key of Solomon — Goetia (Chicago, 1916). "
    "Public domain in the USA via Project Gutenberg eBook #72679. "
    "Hermetic historical study text only — not ritual instruction."
)

SECTION_MARKERS = [
    "PRELIMINARY INVOCATION.",
    "THE INITIATED INTERPRETATION OF CEREMONIAL MAGIC.",
    "PRELIMINARY DEFINITION OF MAGIC.",
    "THE BRIEF INTRODUCTORY DESCRIPTION.",
    "THE BOOK OF EVIL SPIRITS.",
    "SHEMHAMPHORASH.",
    "OBSERVATIONS.",
    "CLASSIFIED LIST OF THE 72 CHIEF SPIRITS OF THE GOETIA",
    "THE MAGICAL CIRCLE.",
    "THE MAGICAL TRIANGLE OF SOLOMON.",
    "THE HEXAGRAM OF SOLOMON.",
    "THE PENTAGRAM OF SOLOMON.",
    "THE MAGIC RING OR DISC OF SOLOMON.",
    "THE VESSEL OF BRASS.",
    "THE SECRET SEAL OF SOLOMON.",
    "THE OTHER MAGICAL REQUISITES.",
    "THE ADORATION AT THE BATH.",
    "THE INDUING OF THE VESTMENTS.",
    "THE CONJURATION TO CALL FORTH ANY OF THE AFORESAID SPIRITS.",
    "THE SECOND CONJURATION.",
    "THE CONSTRAINT.",
    "THE INVOCATION OF THE KING.",
    "THE CONJURATION OF THE FIRE.",
    "THE GREATER CURSE.",
    "THE ADDRESS UNTO THE SPIRIT UPON HIS COMING.",
    "THE WELCOME UNTO THE SPIRIT.",
    "THE LICENSE TO DEPART.",
    "EXPLANATION OF CERTAIN NAMES USED IN THIS BOOK LEMEGETON.",
]


def load_body() -> str:
    text = SRC.read_text(encoding="utf-8", errors="ignore")
    start = text.find("*** START OF")
    end = text.find("*** END OF")
    body = text[start:end] if start >= 0 else text
    # Drop Gutenberg license/boilerplate front until first useful heading
    for marker in ("PRELIMINARY INVOCATION.", "SHEMHAMPHORASH."):
        i = body.find(marker)
        if i > 0:
            # keep a little intro before first marker if present
            pref = body.find("Goetia")
            if 0 <= pref < i:
                body = body[pref:]
            break
    return body


def paragraphs(block: str) -> list[str]:
    parts = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", block)]
    out: list[str] = []
    for part in parts:
        if len(part) < 50:
            continue
        if part.startswith("***"):
            continue
        if "Project Gutenberg" in part:
            continue
        out.append(part)
    return out


def build_sections(body: str) -> list[dict]:
    # Spirit catalog: split (N.) NAME.—
    shem_i = body.find("SHEMHAMPHORASH.")
    pre = body[:shem_i] if shem_i >= 0 else body
    shem = body[shem_i:] if shem_i >= 0 else ""

    sections: list[dict] = []
    # Front matter by markers
    positions = []
    for marker in SECTION_MARKERS:
        i = pre.find(marker)
        if i >= 0:
            positions.append((i, marker.rstrip(".")))
    positions.sort()
    for idx, (pos, title) in enumerate(positions):
        end = positions[idx + 1][0] if idx + 1 < len(positions) else len(pre)
        paras = paragraphs(pre[pos:end])
        if paras:
            sections.append({"title": title.title(), "paragraphs": paras[:30]})

    # Spirits
    if shem:
        # Gutenberg text uses "(1.) BAEL.—..." (period inside the parentheses).
        spirit_parts = re.split(r"(?=\(\d{1,2}\.\)\s+[A-Z])", shem)
        spirits: list[str] = []
        for part in spirit_parts:
            line = re.sub(r"\s+", " ", part).strip()
            if re.match(r"\(\d{1,2}\.\)", line) and len(line) > 80:
                spirits.append(line)
        # group spirits into sections of 6
        for i in range(0, len(spirits), 6):
            chunk = spirits[i : i + 6]
            nums = [int(n) for n in re.findall(r"\((\d+)\.\)", " ".join(chunk))]
            title = (
                f"Spirits {nums[0]}–{nums[-1]}"
                if nums
                else f"Spirits {i // 6 + 1}"
            )
            sections.append({"title": title, "paragraphs": chunk})

        # trailing apparatus after last spirit
        last = spirit_parts[-1] if spirit_parts else ""
        # if last has OBSERVATIONS etc already handled; append leftover conjurations from shem tail
        tail_i = shem.find("OBSERVATIONS.")
        if tail_i > 0:
            # already have observations from pre if duplicated; skip if spirits include it
            pass

    return sections


def update_catalog() -> None:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    for w in data["works"]:
        if w.get("id") == "lesser-key-goetia":
            w["title"] = "Lesser Key of Solomon (Goetia)"
            w["credit"] = CREDIT
            break
    CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    sections = build_sections(load_body())
    if len(sections) < 10:
        raise SystemExit(f"too few sections: {len(sections)}")
    work = {
        "id": "lesser-key-goetia",
        "title": "Lesser Key of Solomon (Goetia)",
        "credit": CREDIT,
        "shelf": "hermetic",
        "sections": sections,
    }
    OUT.write_text(json.dumps(work, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    update_catalog()
    paras = sum(len(s["paragraphs"]) for s in sections)
    print(f"OK lesser-key-goetia sections={len(sections)} paras={paras} bytes={OUT.stat().st_size}")


if __name__ == "__main__":
    main()

"""Replace Doreal Emerald Tablets dump with PD Hermes Tablet translations.

Source: Internet Sacred Text Archive compilation
https://sacred-texts.com/book/emerald-tablet-of-hermes/index
Only historical public-domain English renderings are kept (Newton, Latin/medieval,
Holmyard/Jabir, Davis/Beato, Bacstrom). Modern Fulcanelli / Shah / Needham /
Blavatsky-1972 / Anon-1985 blocks are refused.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "extra_resources" / "emerald-tablet-hermes-sacred.txt"
OUT = ROOT / "public" / "library" / "emerald-tablet.json"
CATALOG = ROOT / "public" / "library" / "catalog.json"

CREDIT = (
    "Emerald Tablet of Hermes — historical public-domain English renderings "
    "(Newton c.1680; Twelfth-century Latin; Jabir/Holmyard 1923; Beato/Davis 1926; "
    "Bacstrom). Compiled via Internet Sacred Text Archive. Not Doreal’s Emerald "
    "Tablets of Thoth. Hermetic historical study, not ritual instruction."
)

KEEP_HEADERS = [
    ("From Jabir ibn Hayyan", "Jabir ibn Hayyan (Holmyard)"),
    ("Twelfth Century Latin", "Twelfth-century Latin"),
    ("Translation from Aurelium Occultae Philosophorum", "Georgio Beato (Davis)"),
    ("Translation of Issac Newton", "Isaac Newton c. 1680"),
    ("Translation of Isaac Newton", "Isaac Newton c. 1680"),
    ("Translation from Kriegsmann", "Kriegsmann (Davis)"),
    ("From Sigismund Bacstrom", "Sigismund Bacstrom"),
    ("Translation from Roger Bacon", "Roger Bacon, Secretum Secretorum (c.1445)"),
    ("Translation of same source, made c. 1485", "Secretum Secretorum (c.1485)"),
]

REFUSE_MARKERS = (
    "Another Arabic Version (from the German of Ruska, translated by",
    "From Madame Blavatsky",
    "From Fulcanelli",
    "From Idres Shah",
    "From Idries Shah",
    "Hypothetical Chinese Original",
    "TEXTUAL REMARKS",
    "COMMENTARIES",
)


def extract_blocks(text: str) -> list[tuple[str, str]]:
    # Drop history essay; start at Translations
    start = text.find("Translations")
    if start >= 0:
        text = text[start:]
    # Cut modern commentary apparatus
    for marker in REFUSE_MARKERS:
        # keep cutting from first refuse that is NOT a keep header start we want
        pass
    cut = len(text)
    for marker in (
        "TEXTUAL REMARKS",
        "COMMENTARIES",
        "A COMMENTARY OF IBN UMAIL",
        "APPENDIX",
    ):
        i = text.find(marker)
        if 0 < i < cut:
            cut = i
    text = text[:cut]

    blocks: list[tuple[str, str]] = []
    # Split on known keep headers, skipping refuse headers
    # Build regex of all candidate headers appearing in file
    headers = []
    for raw, label in KEEP_HEADERS:
        if raw in text:
            headers.append((text.find(raw), raw, label))
    # also capture Jabir if phrasing differs
    if not any(h[2].startswith("Jabir") for h in headers):
        m = re.search(r"From Jabir ibn Hayya\w*", text)
        if m:
            headers.append((m.start(), m.group(0), "Jabir ibn Hayyan (Holmyard)"))
    headers.sort()
    if not headers:
        raise SystemExit("no PD translation headers found")

    # Remove refuse spans that sit between keeps
    cleaned_parts: list[tuple[str, str]] = []
    for idx, (pos, raw, label) in enumerate(headers):
        end = headers[idx + 1][0] if idx + 1 < len(headers) else len(text)
        chunk = text[pos:end]
        # If a refuse marker appears early in this chunk, truncate
        for bad in REFUSE_MARKERS:
            bi = chunk.find(bad)
            if bi > 40:  # after our own header
                chunk = chunk[:bi]
                break
        body = chunk[len(raw) :].strip()
        body = re.sub(r"\n{3,}", "\n\n", body)
        paras = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", body)]
        paras = [p for p in paras if len(p) >= 40 and not p.startswith("[")]
        # drop citation-only lines
        paras = [p for p in paras if not re.fullmatch(r"\[.*?\]\.?", p)]
        if paras:
            cleaned_parts.append((label, "\n\n".join(paras)))
    return cleaned_parts


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"missing {SRC}")
    text = SRC.read_text(encoding="utf-8", errors="ignore")
    blocks = extract_blocks(text)
    sections = []
    for title, body in blocks:
        paras = [p for p in re.split(r"\n\s*\n", body) if len(p.strip()) >= 40]
        if not paras:
            # single block
            paras = [body.strip()]
        sections.append({"title": title, "paragraphs": paras})
    if len(sections) < 3:
        raise SystemExit(f"too few PD sections: {len(sections)}")
    work = {
        "id": "emerald-tablet",
        "title": "Emerald Tablet of Hermes",
        "credit": CREDIT,
        "shelf": "hermetic",
        "sections": sections,
    }
    OUT.write_text(json.dumps(work, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    for w in data["works"]:
        if w.get("id") == "emerald-tablet":
            w["title"] = work["title"]
            w["credit"] = CREDIT
            break
    CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    paras = sum(len(s["paragraphs"]) for s in sections)
    print(f"OK emerald-tablet sections={len(sections)} paras={paras} bytes={OUT.stat().st_size}")
    for s in sections:
        print(" -", s["title"], len(s["paragraphs"]))


if __name__ == "__main__":
    main()

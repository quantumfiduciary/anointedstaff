"""
Ingest public-domain Nag Hammadi English (Samuel Zinner / Mark M. Mattison)
for the four previously gated Extra-canon works.

Sources (KEEP — explicit PD dedication on Luminescence / Other Gospels NH initiative):
  - https://www.luminescence-llc.net/on-the-origin-of-the-world
  - https://www.luminescence-llc.net/sophia-of-jesus-christ
  - https://www.luminescence-llc.net/acts-of-peter-and-the-twelve
  - Apocryphon of John Codex II column from Other Gospels Zinner tab
    (same PD translation; not the Stevan Davies exclusive harmonization)

Do NOT ingest Other Gospels commentary / introductions (Rachel Bousfield).
"""
from __future__ import annotations

import json
import re
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "library"
CATALOG = OUT / "catalog.json"
SRC = ROOT / "extra_resources"

CREDIT = (
    "Samuel Zinner, tr.; Mark M. Mattison, ed. Public domain English from the Coptic "
    "(Other Gospels / Luminescence Nag Hammadi initiative). Translation body only — "
    "not Brill/CGLP, not Stevan Davies. Historical Extra-canon study, not Scripture."
)

HEADING_SKIP = {
    "symbols",
    "contact",
    "nag hammadi codex iii",
    "nag hammadi library",
}


def strip_tags(html: str) -> str:
    html = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", html)
    html = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", html)
    html = re.sub(r"(?is)<noscript[^>]*>.*?</noscript>", " ", html)
    html = re.sub(r"(?is)<!--.*?-->", " ", html)
    html = re.sub(r"(?i)<br\s*/?>", "\n", html)
    html = re.sub(r"(?i)</p\s*>", "\n\n", html)
    html = re.sub(r"(?i)</h[1-6]\s*>", "\n\n", html)
    html = re.sub(r"(?i)</div\s*>", "\n", html)
    html = re.sub(r"<[^>]+>", " ", html)
    return unescape(html)


def extract_main_text(html: str) -> str:
    text = strip_tags(html)
    # Prefer article / main-ish Squarespace content markers
    # Fall back to PD notice → CONTACT window
    lower = text.lower()
    start = lower.find("the following translation has been committed to the public domain")
    if start < 0:
        start = lower.find("committed to the public domain")
    end = lower.find("### contact")
    if end < 0:
        end = lower.find("\ncontact\n")
    if end < 0:
        end = lower.rfind("mark.m.mattison@luminescence-llc.net")
    if start >= 0 and end > start:
        text = text[start:end]
    # Drop symbol legend block (with or without a "Symbols" heading)
    text = re.sub(
        r"(?:Symbols\s*)?\[\s*\]\s*Gap in the text.*?hyperlinked\)",
        " ",
        text,
        flags=re.I | re.S,
    )
    text = re.sub(r"\[\s*\d+\s*\]", " ", text)  # codex page numbers
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def paragraphs_from_block(block: str, min_len: int = 60) -> list[str]:
    parts = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n\s*\n", block)]
    out: list[str] = []
    for part in parts:
        if len(part) < min_len:
            continue
        low = part.lower()
        if low.startswith("the following translation has been committed"):
            continue
        if low.startswith("this translation from the coptic"):
            continue
        if low.startswith("this translation by samuel"):
            continue
        if low.startswith("it is based on the coptic"):
            continue
        if "gap in the text" in low and "editorial insertion" in low:
            continue
        if "mark.m.mattison@" in low:
            continue
        if low in HEADING_SKIP:
            continue
        out.append(part)
    return out


def sections_by_headings(text: str, heading_re: re.Pattern[str]) -> list[dict]:
    pieces = heading_re.split(text)
    sections: list[dict] = []
    # Leading prose before first heading
    if pieces and paragraphs_from_block(pieces[0], 80):
        sections.append({"title": "Opening", "paragraphs": paragraphs_from_block(pieces[0], 80)[:12]})
    for i in range(1, len(pieces), 2):
        title = re.sub(r"\s+", " ", pieces[i]).strip().title()
        body = pieces[i + 1] if i + 1 < len(pieces) else ""
        paras = paragraphs_from_block(body, 55)
        if not paras:
            continue
        if title.lower() in HEADING_SKIP or title.lower().startswith("symbols"):
            continue
        sections.append({"title": title[:100], "paragraphs": paras[:40]})
    return sections


def chunk_paragraphs(paras: list[str], size: int = 8, title_prefix: str = "Reading") -> list[dict]:
    sections: list[dict] = []
    for index in range(0, len(paras), size):
        chunk = paras[index : index + size]
        if not chunk:
            continue
        n = len(sections) + 1
        sections.append({"title": f"{title_prefix} {n}", "paragraphs": chunk})
    return sections


def work_from_luminescence_html(
    path: Path,
    work_id: str,
    title: str,
    shelf: str,
    heading_re: re.Pattern[str] | None = None,
) -> dict:
    html = path.read_text(encoding="utf-8", errors="replace")
    text = extract_main_text(html)
    if heading_re is not None:
        sections = sections_by_headings(text, heading_re)
    else:
        sections = []
    if len(sections) < 3:
        paras = paragraphs_from_block(text, 55)
        if len(paras) < 5:
            raise SystemExit(f"{work_id}: too thin ({len(paras)} paragraphs) from {path.name}")
        sections = chunk_paragraphs(paras, size=6 if work_id == "origin-world" else 5)
    return {
        "id": work_id,
        "title": title,
        "credit": CREDIT,
        "shelf": shelf,
        "sections": sections,
    }


def work_from_plain_paragraphs(
    path: Path,
    work_id: str,
    title: str,
    shelf: str,
) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace").strip()
    if "Davies" in text and "exclusive permission" in text.lower():
        raise SystemExit(f"{work_id}: refuse Davies exclusive text")
    paras = [re.sub(r"\s+", " ", p).strip() for p in text.split("\n\n") if len(p.strip()) > 20]
    # Group by restarting verse "1 " after prior higher numbers ≈ section breaks, else chunk
    sections = chunk_paragraphs(paras, size=10, title_prefix="Section")
    if len(sections) < 3:
        raise SystemExit(f"{work_id}: too thin")
    return {
        "id": work_id,
        "title": title,
        "credit": CREDIT + " Codex II witness (Zinner).",
        "shelf": shelf,
        "sections": sections,
    }


def write_work(work: dict) -> None:
    path = OUT / f"{work['id']}.json"
    path.write_text(json.dumps(work, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    paras = sum(len(s.get("paragraphs", [])) for s in work["sections"])
    print(f"OK  {work['id']:22} sections={len(work['sections']):3} paras={paras:4} bytes={path.stat().st_size}")


def upsert_catalog(works: list[dict]) -> None:
    data = json.loads(CATALOG.read_text(encoding="utf-8")) if CATALOG.exists() else {"works": []}
    by_id = {item["id"]: item for item in data.get("works", [])}
    for work in works:
        by_id[work["id"]] = {
            "id": work["id"],
            "title": work["title"],
            "credit": work["credit"],
            "shelf": work["shelf"],
            "file": f"{work['id']}.json",
        }
    works_out = sorted(by_id.values(), key=lambda item: item["title"].lower())
    note = (
        "Rights: Nag Hammadi Extra-canon titles on this desk use Samuel Zinner / Mark M. Mattison "
        "public-domain English (Luminescence / Other Gospels). Older Brill/CGLP and sacred-name dumps stay refused."
    )
    CATALOG.write_text(
        json.dumps({"works": works_out, "note": note}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print("catalog", len(works_out), "works")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    john_path = SRC / "zinner-apocryphon-john-codex-ii.txt"
    if not john_path.exists():
        # Fallback: Downloads folder from browser export
        downloads = Path.home() / "Downloads" / "zinner-apocryphon-john-codex-ii.txt"
        if downloads.exists():
            john_path.write_text(downloads.read_text(encoding="utf-8"), encoding="utf-8")
        else:
            raise SystemExit(
                f"missing {john_path} — export Codex II Zinner text from othergospels.com/john/ first"
            )

    heading = re.compile(
        r"\n(?=(?:Peter and the Apostles|The Difficulties|The Apostles Reach|"
        r"The Pearl Merchant|The Lord Instructs|Introduction|The Emanation|"
        r"The Manifestation|Sabaoth|He Who Is|The Savior Appears|"
        r"Opening|Closing|Amen\b)[^\n]{0,80}\n)",
        flags=re.I,
    )

    works = [
        work_from_plain_paragraphs(
            john_path,
            "apocryphon-john",
            "Apocryphon of John (Secret Writing According to John)",
            "sophia",
        ),
        work_from_luminescence_html(
            SRC / "zinner-origin-of-the-world.html",
            "origin-world",
            "On the Origin of the World",
            "sophia",
            heading_re=None,
        ),
        work_from_luminescence_html(
            SRC / "zinner-sophia-of-jesus-christ.html",
            "sophia-jesus",
            "Sophia of Jesus Christ",
            "sophia",
            heading_re=None,
        ),
        work_from_luminescence_html(
            SRC / "zinner-acts-of-peter-and-the-twelve.html",
            "acts-peter-twelve",
            "Acts of Peter and the Twelve Apostles",
            "fathers",
            heading_re=heading,
        ),
    ]
    for work in works:
        # Refuse markers
        blob = json.dumps(work)
        if "Brill has asserted" in blob or "gnosis.org" in blob.lower() or "yahwehsword" in blob.lower():
            raise SystemExit(f"{work['id']} contains refuse markers")
        if "exclusive permission" in blob.lower() and "Davies" in blob:
            raise SystemExit(f"{work['id']} looks like Davies exclusive text")
        write_work(work)
    upsert_catalog(works)
    print("done")


if __name__ == "__main__":
    main()

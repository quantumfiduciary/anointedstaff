"""Re-ingest Acts of Thomas from M. R. James 1924 (PD).

Source HTML: https://www.earlychristianwritings.com/text/actsthomas.html
(NASSCAL e-Clavis points here for the James English.)
"""
from __future__ import annotations

import json
import re
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC_HTML = ROOT / "extra_resources" / "acts-thomas-james.html"
SRC_TXT = ROOT / "extra_resources" / "acts-thomas-james.txt"
OUT = ROOT / "public" / "library" / "acts-thomas.json"
CATALOG = ROOT / "public" / "library" / "catalog.json"

CREDIT = (
    "M. R. James, The Apocryphal New Testament (Oxford: Clarendon, 1924). "
    "Public domain English. Via Early Christian Writings / NASSCAL e-Clavis pointer. "
    "Historical Extra-canon study, not Scripture."
)

ACT_RE = re.compile(
    r"(?=(?:The (?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|"
    r"Eleventh|Twelfth|Thirteenth) Act|THE MARTYRDOM))",
    re.I,
)


def load_body() -> str:
    if SRC_TXT.exists() and SRC_TXT.stat().st_size > 10_000:
        text = SRC_TXT.read_text(encoding="utf-8", errors="ignore")
    else:
        html = SRC_HTML.read_text(encoding="utf-8", errors="ignore")
        idx = html.find("<H3>The Acts of Thomas</H3>")
        chunk = html[idx:] if idx >= 0 else html
        chunk = re.sub(r"(?is)<script.*?</script>", " ", chunk)
        chunk = re.sub(r"(?is)<style.*?</style>", " ", chunk)
        chunk = re.sub(r"(?i)<br\s*/?>", "\n", chunk)
        chunk = re.sub(r"(?i)</(?:p|div|h[1-6]|li|tr)>", "\n", chunk)
        chunk = re.sub(r"<[^>]+>", " ", chunk)
        text = unescape(chunk)
    start = text.find("At that season")
    if start < 0:
        start = text.find("At that time we the apostles")
    if start < 0:
        raise SystemExit("Acts of Thomas narrative start not found")
    body = text[start:]
    for marker in ("Kirby, Peter", "Early Christian Writings is copyright", "Jewish/Christian"):
        i = body.find(marker)
        if i > 0:
            body = body[:i]
            break
    body = re.sub(r"[ \t]+", " ", body)
    body = re.sub(r"\n{3,}", "\n\n", body)
    return body.strip()


def paragraphs(block: str) -> list[str]:
    # James uses numbered verses; group into readable paragraphs.
    parts = re.split(r"(?=\n\s*\d+\s+[A-Z])", block)
    out: list[str] = []
    buf: list[str] = []
    for part in parts:
        line = re.sub(r"\s+", " ", part).strip()
        if len(line) < 40:
            continue
        buf.append(line)
        if sum(len(x) for x in buf) >= 900:
            out.append(" ".join(buf))
            buf = []
    if buf:
        out.append(" ".join(buf))
    return out


def sections_from_body(body: str) -> list[dict]:
    pieces = ACT_RE.split(body)
    # Leading text before first titled act = First Act opening
    sections: list[dict] = []
    if pieces and pieces[0].strip():
        paras = paragraphs(pieces[0])
        if paras:
            sections.append({"title": "The First Act", "paragraphs": paras})
    for piece in pieces[1:]:
        piece = piece.strip()
        if not piece:
            continue
        # title is first line-ish
        m = re.match(
            r"((?:The (?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|"
            r"Eleventh|Twelfth|Thirteenth) Act|THE MARTYRDOM)[^\n]{0,80})",
            piece,
            re.I,
        )
        title = m.group(1).strip() if m else "Act"
        title = re.sub(r"\s+", " ", title)
        title = re.sub(r"[\]\[]+", "", title).strip()[:100]
        if title.upper().startswith("THE MARTYRDOM"):
            title = "The Martyrdom"
        rest = piece[m.end() :] if m else piece
        paras = paragraphs(rest)
        if not paras:
            continue
        sections.append({"title": title.title() if title.isupper() else title, "paragraphs": paras})
    return sections


def update_catalog_credit() -> None:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    for work in data["works"]:
        if work.get("id") == "acts-thomas":
            work["credit"] = CREDIT
            work["title"] = "Acts of Thomas"
            break
    CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    body = load_body()
    sections = sections_from_body(body)
    if len(sections) < 8:
        raise SystemExit(f"too few sections: {len(sections)}")
    work = {
        "id": "acts-thomas",
        "title": "Acts of Thomas",
        "credit": CREDIT,
        "shelf": "fathers",
        "sections": sections,
    }
    OUT.write_text(json.dumps(work, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    update_catalog_credit()
    paras = sum(len(s["paragraphs"]) for s in sections)
    print(f"OK acts-thomas sections={len(sections)} paras={paras} bytes={OUT.stat().st_size}")


if __name__ == "__main__":
    main()

"""Full Book of Mormon (1830 English) from Project Gutenberg #17.

Gutenberg #17 uses headings like ``1 Nephi Chapter 1`` (not bare CHAPTER N).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "extra_resources" / "pg17-mormon.txt"
OUT = ROOT / "public" / "library" / "mormon.json"
CATALOG = ROOT / "public" / "library" / "catalog.json"

CREDIT = (
    "1830 English wording via Project Gutenberg eBook #17. Public domain. "
    "Not the 1990 Church of Christ Independence edition. Other-canon shelf, not Scripture."
)

CHAPTER_RE = re.compile(
    r"(?m)^((?:[0-9]+ )?[A-Za-z][A-Za-z’' ]+ Chapter \d+|Words of Mormon)\s*$"
)


def load_body() -> str:
    if not SRC.exists():
        raise SystemExit(f"missing {SRC}")
    text = SRC.read_text(encoding="utf-8", errors="ignore")
    end = text.find("*** END OF")
    if end >= 0:
        text = text[:end]
    start = text.find("1 Nephi Chapter 1")
    if start < 0:
        raise SystemExit("1 Nephi Chapter 1 not found")
    return text[start:]


def paragraphs(block: str) -> list[str]:
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in block.splitlines() if ln.strip()]
    out: list[str] = []
    buf: list[str] = []
    for ln in lines:
        if re.match(r"^\d+:\d+\s", ln) and buf:
            out.append(" ".join(buf))
            buf = [ln]
        else:
            buf.append(ln)
        if sum(len(x) for x in buf) > 1400:
            out.append(" ".join(buf))
            buf = []
    if buf:
        out.append(" ".join(buf))
    return [p for p in out if len(p) >= 20]


def build_sections(text: str) -> list[dict]:
    matches = list(CHAPTER_RE.finditer(text))
    if len(matches) < 100:
        raise SystemExit(f"too few chapter headings: {len(matches)}")
    sections: list[dict] = []
    for i, m in enumerate(matches):
        title = re.sub(r"\s+", " ", m.group(1)).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        paras = paragraphs(text[start:end])
        if paras:
            sections.append({"title": title, "paragraphs": paras})
    return sections


def update_catalog() -> None:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    for work in data["works"]:
        if work.get("id") == "mormon":
            work["credit"] = CREDIT
            work["title"] = "Book of Mormon (1830)"
            break
    CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    sections = build_sections(load_body())
    work = {
        "id": "mormon",
        "title": "Book of Mormon (1830)",
        "credit": CREDIT,
        "shelf": "other",
        "sections": sections,
    }
    OUT.write_text(json.dumps(work, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    update_catalog()
    paras = sum(len(s["paragraphs"]) for s in sections)
    chars = sum(len(p) for s in sections for p in s["paragraphs"])
    print(
        f"OK mormon sections={len(sections)} paras={paras} chars={chars} bytes={OUT.stat().st_size}"
    )
    print(" first:", sections[0]["title"])
    print(" last :", sections[-1]["title"])


if __name__ == "__main__":
    main()

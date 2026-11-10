"""Turn the public-domain extracanonical PDFs into a small reading library."""

import json
import re
from pathlib import Path

from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
extra = root / "extra_resources"
out = root / "public" / "writings.json"


def pages(path: Path) -> str:
    reader = PdfReader(str(path))
    chunks = []
    for page in reader.pages:
        chunks.append(page.extract_text() or "")
    text = "\n".join(chunks)
    text = text.replace("\u00ad", "")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def paragraphs(block: str) -> list[str]:
    parts = [re.sub(r"\s+", " ", part).strip() for part in re.split(r"\n\s*\n", block)]
    return [part for part in parts if len(part) > 40]


def enoch() -> dict:
    text = pages(extra / "Enoch.pdf")
    pieces = re.split(r"\[Chapter\s+(\d+)\]", text)
    sections = []
    # pieces[0] is the introduction before the first marker
    if pieces and paragraphs(pieces[0]):
        sections.append({"title": "Introduction", "paragraphs": paragraphs(pieces[0])[:12]})
    for index in range(1, len(pieces), 2):
        number = pieces[index]
        body = pieces[index + 1] if index + 1 < len(pieces) else ""
        body_paragraphs = paragraphs(body)
        if body_paragraphs:
            sections.append({"title": f"Chapter {number}", "paragraphs": body_paragraphs})
    return {
        "id": "enoch",
        "title": "1 Enoch",
        "credit": "R. H. Charles, 1913. Public domain.",
        "sections": sections,
    }


def pistis() -> dict:
    reader = PdfReader(str(extra / "george-robert-stowe-mead_pistis-sophia.pdf"))
    chunks = []
    for index, page in enumerate(reader.pages):
        if index < 31:
            continue
        chunks.append(page.extract_text() or "")
    text = "\n".join(chunks)
    pieces = re.split(r"(?:Chapter|CHAPTER)\s+(\d+)", text)
    sections = []
    for index in range(1, len(pieces), 2):
        body = paragraphs(pieces[index + 1] if index + 1 < len(pieces) else "")
        if body:
            sections.append({"title": f"Chapter {pieces[index]}", "paragraphs": body})
    return {
        "id": "pistis",
        "title": "Pistis Sophia",
        "credit": "G. R. S. Mead. Public domain.",
        "sections": sections,
    }


works = [enoch(), pistis()]
out.write_text(json.dumps({"works": works}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
for work in works:
    count = sum(len(section["paragraphs"]) for section in work["sections"])
    print(work["id"], len(work["sections"]), "sections", count, "paragraphs")

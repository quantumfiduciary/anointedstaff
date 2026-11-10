"""Build the Arithmos cipher catalog and the practice library from local study files."""

from __future__ import annotations

import json
import re
import shutil
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CONSTANTS = ROOT / "extra_resources" / "Arithmos-master" / "Arithmos-master" / "ArithmosModels" / "Constants.cs"
EXTRA = ROOT / "extra_resources"
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def cipher_bodies(source: str) -> dict[str, str]:
    bodies: dict[str, str] = {}
    for name, body in re.findall(r'public const string (\w+) = "([^"]+)";', source):
        if "=" in body and "," in body:
            bodies[name] = body
    return bodies


def parse_body(body: str) -> dict[str, int]:
    values: dict[str, int] = {}
    for pair in body.split(","):
        glyph, value = pair.split("=")
        values[glyph] = int(value)
    return values


def merge(bodies: dict[str, str], names: list[str]) -> dict[str, int]:
    values: dict[str, int] = {}
    for name in names:
        values.update(parse_body(bodies[name]))
    return values


def docx_lines(path: Path) -> list[str]:
    root = ET.fromstring(zipfile.ZipFile(path).read("word/document.xml"))
    lines: list[str] = []
    for paragraph in root.iter(f"{W}p"):
        text = "".join(node.text or "" for node in paragraph.iter(f"{W}t")).strip()
        if text:
            lines.append(text)
    return lines


def aroma_lines() -> list[str]:
    raw = (ROOT / "scripts" / "_aroma.txt").read_text(encoding="utf-8")
    lines: list[str] = []
    for line in raw.replace("\x0b", "\n").replace("\xa0", " ").splitlines():
        cleaned = " ".join(line.split()).strip()
        if cleaned and cleaned != "AROMA'S LIST":
            lines.append(cleaned)
    return lines


def write_arithmos(bodies: dict[str, str]) -> None:
    methods = [
        ("standard", "Standard", "Combined", ["EnglishStandard", "GreekStandard", "HebrewStandard"]),
        ("ordinal", "Ordinal", "Combined", ["EnglishOrdinal", "GreekOrdinal", "HebrewOrdinal"]),
        ("reduced", "Reduced", "Combined", ["EnglishReduced", "GreekReduced", "HebrewReduced"]),
        ("sumerian", "Sumerian", "Combined", ["EnglishSumerian"]),
    ]
    for key in bodies:
        if key.startswith("English"):
            group = "English"
        elif key.startswith("Greek"):
            group = "Greek"
        elif key.startswith("Hebrew"):
            group = "Hebrew"
        else:
            continue
        label = re.sub(r"([a-z])([A-Z])", r"\1 \2", key)
        methods.append((key[0].lower() + key[1:], label, group, [key]))

    rows = []
    for method_id, name, group, parts in methods:
        rows.append(
            {
                "id": method_id,
                "name": name,
                "group": group,
                "values": merge(bodies, parts),
            }
        )
    payload = json.dumps(rows, ensure_ascii=False, indent=2)
    target = ROOT / "src" / "study" / "arithmosData.ts"
    target.write_text(
        "/** Cipher tables from Arithmos. Copyright (c) 2018-2024 Daniel Lascelles. MIT License. https://github.com/dlascelles/Arithmos */\n"
        "export type ArithmosCipher = { id: string; name: string; group: \"Combined\" | \"English\" | \"Greek\" | \"Hebrew\"; values: Record<string, number> }\n\n"
        f"export const arithmosCiphers: ArithmosCipher[] = {payload}\n",
        encoding="utf-8",
    )
    standard = next(row for row in rows if row["id"] == "standard")
    sample = "annointed staff app"
    total = sum(standard["values"].get(char, 0) for char in sample)
    sumerian = next(row for row in rows if row["id"] == "sumerian")
    sumerian_total = sum(sumerian["values"].get(char, 0) for char in sample)
    print("methods", len(rows), "standard sample", total, "sumerian sample", sumerian_total)


def write_practice() -> None:
    dna = docx_lines(EXTRA / "DNA.docx")
    untangle = docx_lines(EXTRA / "Prayer to Untangle by Jason Westerfield.docx")
    pieces = [
        {
            "id": "aroma",
            "title": "Aroma list",
            "credit": "Tom Wright, from your aroma list.",
            "paragraphs": aroma_lines(),
        },
        {
            "id": "dna",
            "title": "DNA prayer",
            "credit": "From your DNA prayer.",
            "paragraphs": dna,
        },
        {
            "id": "untangle",
            "title": "Prayer to Untangle",
            "credit": "Jason Westerfield.",
            "paragraphs": untangle,
        },
    ]
    target = ROOT / "public" / "practice.json"
    target.write_text(json.dumps({"pieces": pieces}, ensure_ascii=False, indent=2), encoding="utf-8")
    print("practice", {piece["id"]: len(piece["paragraphs"]) for piece in pieces})


def main() -> None:
    write_arithmos(cipher_bodies(CONSTANTS.read_text(encoding="utf-8")))
    write_practice()
    shutil.copyfile(EXTRA / "Temple_of_the_Holy_Spirit_Chart.jpg", ROOT / "public" / "temple-of-the-holy-spirit.jpg")
    print("temple copied")


if __name__ == "__main__":
    main()

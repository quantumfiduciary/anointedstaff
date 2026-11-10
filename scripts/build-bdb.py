"""Build a compact Strong's-keyed BDB gloss from Eliran Wong's PD CSV.

Source: https://github.com/eliranwong/unabridged-BDB-Hebrew-lexicon
Brown–Driver–Briggs lexicon text is public domain; Wong's formatting is for marvel.bible.
We strip markup and keep short plain-text excerpts keyed by Strong's H numbers.
"""

from __future__ import annotations

import csv
import html
import io
import json
import re
import ssl
import sys
import urllib.request
import zipfile
from pathlib import Path

csv.field_size_limit(min(sys.maxsize, 32 * 1024 * 1024))

root = Path(__file__).resolve().parents[1]
cache = root / "extra_resources" / "lexicons"
cache.mkdir(parents=True, exist_ok=True)
zip_path = cache / "unabridged-BDB-Hebrew-lexicon.csv.zip"
out_path = root / "public" / "bdb.json"

URL = "https://raw.githubusercontent.com/eliranwong/unabridged-BDB-Hebrew-lexicon/master/unabridged-BDB-Hebrew-lexicon.csv.zip"

tags = re.compile(r"<[^>]+>")
space = re.compile(r"\s+")
strong_num = re.compile(r"^H\d+$", re.I)


def fetch_zip() -> bytes:
    if zip_path.exists() and zip_path.stat().st_size > 1000:
        return zip_path.read_bytes()
    ctx = ssl._create_unverified_context()
    with urllib.request.urlopen(URL, context=ctx, timeout=180) as response:
        data = response.read()
    zip_path.write_bytes(data)
    return data


def plain(content: str) -> str:
    text = html.unescape(content or "")
    text = tags.sub(" ", text)
    text = space.sub(" ", text).strip()
    return text


def main() -> None:
    raw = fetch_zip()
    zf = zipfile.ZipFile(io.BytesIO(raw))
    member = next(name for name in zf.namelist() if name.endswith(".csv") and not name.startswith("__"))
    lex: dict[str, str] = {}
    with zf.open(member) as handle:
        text = io.TextIOWrapper(handle, encoding="utf-8", errors="replace", newline="")
        reader = csv.DictReader(text, delimiter="\t")
        for row in reader:
            number = (row.get("StrongNumber") or "").strip().upper()
            if not strong_num.match(number):
                continue
            body = plain(row.get("content") or "")
            if len(body) < 12:
                continue
            # Keep the longest / richest first hit per Strong's id (entries can repeat).
            if number not in lex or len(body) > len(lex[number]):
                lex[number] = body[:480]

    payload = {
        "credit": "Brown–Driver–Briggs Hebrew and English Lexicon (public domain). Compacted from Eliran Wong’s unabridged CSV (marvel.bible formatting).",
        "source": "https://github.com/eliranwong/unabridged-BDB-Hebrew-lexicon",
        "lex": lex,
    }
    out_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(lex)} Strong's-keyed entries → {out_path} ({out_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

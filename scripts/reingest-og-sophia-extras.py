"""Ingest additional Zinner/Mattison PD Nag Hammadi works from Luminescence / Other Gospels.

Adds Thunder, Perfect Mind and Substance of the Archons (from the Other Gospels index).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

# Reuse extractors from the NH Zinner script
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "extra_resources"
OUT = ROOT / "public" / "library"
CATALOG = OUT / "catalog.json"

spec = importlib.util.spec_from_file_location(
    "nh", ROOT / "scripts" / "reingest-nag-hammadi-zinner.py"
)
nh = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(nh)


def main() -> None:
    works = [
        nh.work_from_luminescence_html(
            SRC / "zinner-thunder-perfect-mind.html",
            "thunder",
            "The Thunder, Perfect Mind",
            "sophia",
            heading_re=re.compile(
                r"\n(?=(?:First .I Am. Speech|Second .I Am. Speech|Third .I Am. Speech|"
                r"Heed Me|Embrace Me|Obey me and Live Forever|The Thunder)[^\n]{0,60}\n)",
                re.I,
            ),
        ),
        nh.work_from_luminescence_html(
            SRC / "zinner-archons.html",
            "archons",
            "Substance of the Archons",
            "sophia",
            heading_re=None,
        ),
    ]
    for work in works:
        blob = json.dumps(work)
        if "public domain" not in Path(
            SRC / ("zinner-thunder-perfect-mind.html" if work["id"] == "thunder" else "zinner-archons.html")
        ).read_text(encoding="utf-8", errors="ignore").lower():
            raise SystemExit(f"{work['id']}: source missing PD dedication")
        if "Brill has asserted" in blob:
            raise SystemExit(f"{work['id']}: refuse Brill")
        nh.write_work(work)
    nh.upsert_catalog(works)
    print("done")


if __name__ == "__main__":
    main()

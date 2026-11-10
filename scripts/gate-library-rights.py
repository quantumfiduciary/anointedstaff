"""Rights gate helper for Extra-canon catalog.

As of 2026-11-09 the former Sophia / Acts blocks are cleared after Zinner+Mattison
PD re-ingest (see reingest-nag-hammadi-zinner.py). Jubilees + 2 Baruch ship from
R. H. Charles. Keep BLOCK empty unless a new uncleared extract lands in catalog.
"""
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "public" / "library" / "catalog.json"
# Cleared: apocryphon-john, origin-world, sophia-jesus, acts-peter-twelve (Zinner/Mattison PD).
BLOCK: set[str] = set()
RIGHTS_NOTE = (
    "Rights: Nag Hammadi Extra-canon titles on this desk use Samuel Zinner / Mark M. Mattison "
    "public-domain English (Luminescence / Other Gospels). Older Brill/CGLP and sacred-name "
    "dumps stay refused. Jubilees + 2 Baruch ship from R. H. Charles (1917 / 1913)."
)


def main() -> None:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    before = len(data["works"])
    data["works"] = [w for w in data["works"] if w.get("id") not in BLOCK]
    note = (data.get("note") or "").strip()
    if "Zinner" not in note or "Charles" not in note:
        data["note"] = RIGHTS_NOTE
    elif not note:
        data["note"] = RIGHTS_NOTE
    CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"works {before} -> {len(data['works'])} (block={sorted(BLOCK) or 'none'})")


if __name__ == "__main__":
    main()

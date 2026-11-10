"""Move bulky non-runtime dumps from extra_resources to D:\\APPS\\Anointedstaff-archives.

Archives:
  - bibles_csv_6.0, bibles_pdf_6.0, bibles_json_6.0 (witnesses already in public/)
  - large refuse/unused root files under extra_resources/
"""

from __future__ import annotations

import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[1]
extra = root / "extra_resources"
archive = Path(r"D:\APPS\Anointedstaff-archives")
archive.mkdir(parents=True, exist_ok=True)

DIRS = ("bibles_csv_6.0", "bibles_pdf_6.0", "bibles_json_6.0")

# Root-level dumps not needed at runtime (witnesses/writings already built).
ROOT_FILES = (
    "geneva_bible1560.pdf",  # duplicate of update_01 Geneva; witnesses use JSON
    "keys of enoch.pdf",
    "The Nag Hammadi Library. The Definitive Translation of the Gnostic Scriptures Complete in One Volume.pdf",
    "locally-uncensored.exe",
    "Book-of-Remembrance_2024.pdf",
    "TribeOscope - John Lewis.pdf",
    "BI KABBALAH.pptx",
    "Sin Con.pptx",
)


def fmt_mb(n: int) -> str:
    return f"{n / (1024 * 1024):.1f} MB"


def dir_size(path: Path) -> int:
    return sum(p.stat().st_size for p in path.rglob("*") if p.is_file())


def main() -> None:
    moved_bytes = 0
    for name in DIRS:
        src = extra / name
        if not src.exists():
            print(f"SKIP  missing {src}")
            continue
        dest = archive / name
        if dest.exists():
            print(f"SKIP  already archived {dest}")
            continue
        size = dir_size(src)
        print(f"MOVE  {name} ({fmt_mb(size)}) → {dest}")
        shutil.move(str(src), str(dest))
        moved_bytes += size

    root_dest = archive / "extra_resources_root"
    root_dest.mkdir(parents=True, exist_ok=True)
    for name in ROOT_FILES:
        src = extra / name
        if not src.is_file():
            print(f"SKIP  missing root {name}")
            continue
        size = src.stat().st_size
        dest = root_dest / name
        print(f"MOVE  root/{name} ({fmt_mb(size)}) → {dest}")
        shutil.move(str(src), str(dest))
        moved_bytes += size

    print(f"Done. Moved {fmt_mb(moved_bytes)} to {archive}")


if __name__ == "__main__":
    main()

"""Report workspace vs ship sizes after footprint prune."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def dir_bytes(path: Path) -> int:
    if not path.exists():
        return 0
    if path.is_file():
        return path.stat().st_size
    total = 0
    for p in path.rglob("*"):
        if p.is_file():
            try:
                total += p.stat().st_size
            except OSError:
                pass
    return total


def mb(n: int) -> str:
    return f"{n / (1024 * 1024):.1f} MB"


def main() -> None:
    targets = [
        ("dist/", ROOT / "dist"),
        ("public/", ROOT / "public"),
        ("public/brand/", ROOT / "public" / "brand"),
        ("public/witnesses/", ROOT / "public" / "witnesses"),
        ("extra_resources/", ROOT / "extra_resources"),
        ("extra_resources/update_01/", ROOT / "extra_resources" / "update_01"),
        ("extra_resources/update_02/", ROOT / "extra_resources" / "update_02"),
        ("extra_resources/update_03/", ROOT / "extra_resources" / "update_03"),
        ("src/", ROOT / "src"),
        ("node_modules/", ROOT / "node_modules"),
    ]
    print("=== Anointed Staff footprint ===")
    for label, path in targets:
        n = dir_bytes(path)
        print(f"{mb(n):>12}  {label}")

    # Workspace excluding node_modules
    skip = {"node_modules", ".git"}
    workspace = 0
    for p in ROOT.rglob("*"):
        if not p.is_file():
            continue
        if any(part in skip for part in p.relative_to(ROOT).parts):
            continue
        try:
            workspace += p.stat().st_size
        except OSError:
            pass
    print(f"{mb(workspace):>12}  workspace (excl. node_modules/.git)")
    print(f"\nShip to users: dist/ only ({mb(dir_bytes(ROOT / 'dist'))}).")


if __name__ == "__main__":
    main()

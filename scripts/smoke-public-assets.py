"""Confirm shipped public assets exist after dump archive."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
public = root / "public"
checks = [
    "writings.json",
    "library/catalog.json",
    "library/jubilees.json",
    "library/baruch.json",
    "library/apocryphon-john.json",
    "library/origin-world.json",
    "library/sophia-jesus.json",
    "library/acts-peter-twelve.json",
    "library/acts-thomas.json",
    "library/emerald-tablet.json",
    "library/mormon.json",
    "library/lesser-key-goetia.json",
    "library/sixth-seventh-moses.json",
    "library/thunder.json",
    "library/archons.json",
    "library/mazzaroth-rolleston.json",
    "library/bond-gematria.json",
    "practice-meditations.json",
    "audio/practice/manifest.json",
    "audio/practice/guide-breath.mp3",
    "audio/practice/guide-rejoice.mp3",
    "audio/practice/guide-word.mp3",
    "audio/practice/guide-creation.mp3",
    "audio/practice/guide-fast-frame.mp3",
    "audio/practice/guide-psalm-tone.mp3",
    "audio/practice/guide-temple.mp3",
    "audio/practice/cue-correct.mp3",
    "audio/practice/cue-again.mp3",
    "audio/practice/cue-complete.mp3",
    "audio/practice/cue-next.mp3",
    "audio/practice/cue-reveal.mp3",
    "audio/practice/cue-drill.mp3",
    "audio/practice/bed-meditate.mp3",
    "audio/practice/bed-read.mp3",
    "audio/practice/phrases.json",
    "audio/practice/letter-alef.mp3",
    "audio/practice/letter-tav.mp3",
    "audio/practice/letter-kaf-sofit.mp3",
    "audio/practice/name-moses.mp3",
    "audio/practice/name-jesus.mp3",
    "library/laodiceans.json",
    "brand/desk-atmosphere.png",
    "witnesses/catalog.json",
    "witnesses/geneva.json",
    "dictionaries/catalog.json",
    "paleo-strongs.json",
    "calendar/kit-6228.json",
    "ohb/genesis.json",
    "scripture.json",
    "brand/bible-moss-light.png",
    "brand/bible-moss-dark.png",
    "brand/atmosphere-desk.png",
    "brand/atmosphere-desk-light.png",
]
ok = True
for rel in checks:
    path = public / rel
    if path.exists():
        print(f"OK    {path.stat().st_size:>10}  {rel}")
    else:
        print(f"MISS             {rel}")
        ok = False
raise SystemExit(0 if ok else 1)

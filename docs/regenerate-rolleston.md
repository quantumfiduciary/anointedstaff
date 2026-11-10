# Regenerate Rolleston Extra-canon

Frances Rolleston, *Mazzaroth; or, The Constellations* (1862) — public domain.

## Source

Place the PDF at:

`extra_resources/update_04/rolleston-mazzaroth.pdf`

## Build

```bash
python scripts/build-update-04.py
npm run smoke:public
```

Writes `public/library/mazzaroth-rolleston.json` and updates `public/library/catalog.json`.

Ingest strips Philologos nav chrome, drops TOC dumps, and prefers desk stance + twelve sign sections. Cast / Witness stay desk-authored — this JSON is Extra-canon history beside Job 38:32, not fortune data.

## Desk surfaces that link it

- Heavens → Rolleston (PD) buttons (Witness, Decans, Job, Camp)
- Study → Links → Mazzaroth history
- Extra-canon shelf `witnesses`

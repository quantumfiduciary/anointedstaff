# Developer notes

Public product copy lives in the root [README](../README.md). This file is for contributors building or packaging the desk.

## Run & verify

```bash
npm install
npm run dev
npm run build
npm run smoke:public
npm run test:chart
```

### Marketing site (`site/`)

Astro static site → Cloudflare Pages (`anointedstaff.pages.dev` / anointedstaff.com). Does **not** host the study desk runtime. Voice, section map, and blog rules: [marketing.md](marketing.md). CRO notes: [LANDING-CRO.md](../LANDING-CRO.md).

```bash
cd site
npm install
npm run dev
npm run build    # site/dist
npx wrangler pages deploy dist --project-name=anointedstaff --commit-dirty=true
```

Pages (git connect): root `site`, build `npm run build`, output `dist`. Installers ship as GitHub Release assets, not inside Pages. See [deploy-github-pages.md](deploy-github-pages.md).

## Ship size

| Artifact | Typical size | Notes |
|----------|--------------|--------|
| **`dist/`** after `npm run build` | **~145 MB** | Installable web/desk bundle. |
| `public/` | ~155 MB | Runtime JSON, brand, Practice audio (copied into `dist/`). |
| `extra_resources/` | build sources only | **Not shipped.** Ignored from git. |
| `node_modules/` | ~340 MB | Dev only. |

Do not zip the whole repo for users. Tauri/NSIS packs must include **`dist/` only**, never `extra_resources/`.

```bash
python scripts/audit-extra-resources.py
npm run smoke:public
```

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production bundle |
| `npm run test:chart` | Heavens cast golden fixtures |
| `npm run smoke:public` | Confirm shipped JSON / brand / Practice audio |
| `npm run witnesses` | Rebuild Compare packs |
| `npm run bdb` | Compact BDB → `public/bdb.json` |
| `npm run scripture` | Rebuild `public/scripture.json` |
| `npm run tauri:build` | Windows NSIS (+ AppImage on Linux); needs Rust |
| `python scripts/build-*.py` | PD ingest / Extra-canon / Strong’s / etc. |

Python builds need `pypdf` and (for xlsx) `openpyxl`.

## Layout

| Path | Role |
|------|------|
| `src/` | React desk |
| `public/` | Runtime JSON, brand, dictionaries, Practice audio |
| `scripts/` | PD ingest and compactors |
| `extra_resources/` | Thin rebuild kit (gitignored bulk) |
| `site/` | Astro marketing (landing + blogs) |
| `site/src/content/blog/` | Desk-note articles |
| `src/changelog.ts` | What’s New |
| `src/guide.ts` | In-app Guide |
| `DESIGN.md` | Visual system |
| `docs/marketing.md` | Marketing voice + section map |
| `LANDING-CRO.md` | Landing CRO scores / A/B notes |

## Content rules

- Prefer public domain / CC0 with clear UI credit.
- Refuse modern copyright wrappers.
- Keep large PDFs as **build sources**; ship compact JSON under `public/`.
- See root [NOTICE](../NOTICE) and Settings → About for the license split.

## Desktop packaging

| Piece | Status |
|-------|--------|
| Icons | `public/brand/icons/` + `src-tauri/icons/` |
| Fonts | Self-hosted (`@fontsource-variable/*`, Noto) |
| Tauri 2 | `src-tauri/` — NSIS + AppImage; `npm run tauri:build` |
| Release asset | `release/Anointed Staff_0.1.0_x64-setup.exe` (~72 MB, gitignored) |

## Security (summary)

Local-first desk; browser/desktop profile is the trust boundary.

- API keys default to **session-only**; persist is opt-in.
- CSP without script `unsafe-inline`; wiki preview via DOMPurify.
- Leave-device confirms for Nominatim / SearXNG / cloud model / remote STT.
- `npm run audit:deps` (omit dev). `.env*` gitignored.

## Day-to-day

1. Change UI under `src/components/` or study helpers under `src/study/`.
2. After ingest, run the matching `scripts/build-*.py` and confirm credits.
3. Add a short entry at the top of `src/changelog.ts`.
4. Update Guide copy in `src/guide.ts` when a surface changes for users.
5. Keep the **root README** product-facing — put engineering notes here, not in the GitHub landing page.
6. Marketing/lore edits: update `site/`, [marketing.md](marketing.md), and a short What’s New + Guide line when the public URL or Fence changes for users.

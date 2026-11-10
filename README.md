# Anointed Staff

A local-first **Anointed Staff** desk: Scripture beside notes, wiki, Strong’s, Roots, Gematria, Extra-canon, Heavens, and optional AI chat — a holistic study surface for Word, language, sky, and growth. Public-domain texts only — no NIV/ESV/NET.

## Run

```bash
npm install
npm run dev
```

Open the Vite URL (often `http://localhost:5173` or the next free port). Build for production:

```bash
npm run build
npm run preview
npm run smoke:public
npm run test:chart
```

### Marketing site (`site/`)

The public landing and blogs live in [`site/`](site/) (Astro → static HTML for Cloudflare Pages on **anointedstaff.com**). They do **not** host the study desk runtime.

```bash
cd site
npm install
npm run dev      # local preview
npm run build    # output: site/dist
```

Pages build settings: root directory `site`, build command `npm run build`, output `dist`. Attach the custom domain in the Cloudflare dashboard. Desktop installers ship as **GitHub Release** assets (NSIS), not inside the Pages deploy. Step-by-step push + Pages + domain: [`docs/deploy-github-pages.md`](docs/deploy-github-pages.md).

## Ship size (what users install)

| Artifact | Typical size | Notes |
|----------|--------------|--------|
| **`dist/`** after `npm run build` | **~145 MB** | **This is the installable app.** Zip or serve only this folder. |
| `public/` | ~155 MB | Runtime JSON, brand, and Practice audio; Vite copies it into `dist/`. |
| `extra_resources/` | build sources only | **Not shipped.** PDFs and Bible dumps used by Python ingest scripts. |
| `node_modules/` | ~340 MB | Dev install only. |

Do not zip the whole repo for users — that can look like multi‑GB “app properties” because of offline dumps. Future Electron/Tauri packs must include **`dist/` only**, never `extra_resources/`.

Footprint helpers:

```bash
python scripts/audit-extra-resources.py          # KEEP / REFUSE / SKIP sizes for update_*
npm run smoke:public                             # confirm shipped JSON/brand/Practice audio
```

Refused update dumps and Bible packs live outside the project at `D:\APPS\Anointedstaff-archives\` when pruned.

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production bundle |
| `npm run test:chart` | Golden fixtures for the Heavens cast engine |
| `npm run smoke:public` | Confirm shipped JSON, brand, and Practice audio files exist |
| `npm run witnesses` | Rebuild Compare packs (PD languages + Cherokee NT) |
| `npm run bdb` | Compact BDB Hebrew lexicon → `public/bdb.json` |
| `npm run scripture` | Rebuild `public/scripture.json` from raw sources |
| `python scripts/build-update-03.py` | Inventory `extra_resources/update_03` (INGEST/REFUSE/SKIP) |
| `python scripts/build-update-03.py --build` | Write dictionaries, paleo, calendar, OHB sample, library works |
| `python scripts/build-update-04.py` | Extra-canon: Rolleston Mazzaroth (1862 PD, curated signs) + Bond gematria; refuse Cozmophyzix / Born Identity / modern astrology |
| `python scripts/build-update-02.py` | Extra-canon library from `update_02` |
| `python scripts/reingest-jubilees-baruch.py` | Extra-canon: Charles Jubilees + 2 Baruch (PD) |
| `python scripts/reingest-nag-hammadi-zinner.py` | Extra-canon: Zinner/Mattison NH quartet (PD) |
| `python scripts/reingest-acts-thomas-james.py` | Extra-canon: Acts of Thomas (James 1924) |
| `python scripts/reingest-mormon-gutenberg.py` | Extra-canon: Book of Mormon (Gutenberg #17) |
| `python scripts/reingest-emerald-hermes.py` | Extra-canon: Hermes Emerald Tablet (PD renderings) |
| `python scripts/reingest-goetia-gutenberg.py` | Extra-canon: Lesser Key Goetia (Gutenberg #72679) |
| `python scripts/reingest-moses-scheible.py` | Extra-canon: Sixth & Seventh Moses (Scheible OCR) |
| `python scripts/reingest-og-sophia-extras.py` | Extra-canon: Thunder + Archons (Zinner PD) |
| `python scripts/build-gospels.py` | Gospels.net PD shelf into `writings.json` |
| `python scripts/build-library.py` | Core Extra-canon / update_01 patterns |
| `python scripts/build-strongs.py` | `public/strongs.json` |
| `python scripts/build-originals.py` | `public/originals.json` |
| `python scripts/build-witnesses.py` | Compare witnesses under `public/witnesses/` (needs archived `bibles_json_6.0` if rebuilding) |
| `python scripts/audit-extra-resources.py` | Classify `update_*` dumps (KEEP/REFUSE/SKIP) |
| `python scripts/audit-extra-resources.py --move-refuse` | Move REFUSE/SKIP into `Anointedstaff-archives` |
| `python scripts/archive-bulky-dumps.py` | Archive `bibles_*` packs + large root refuse files |
| `python scripts/smoke-public-assets.py` | Confirm `public/` runtime files after prune |

Python builds need `pypdf` and (for xlsx) `openpyxl`.

## Layout

| Path | Role |
|------|------|
| `src/` | React desk (App, panes, study helpers) |
| `public/` | Runtime JSON, brand art, dictionaries, calendar, fonts |
| `public/audio/practice/` | Offline meditation guides, quiz cues, Hebrew letter/name clips, Temple guide, beds (`manifest.json`) |
| `public/practice-meditations.json` | Meditate session scripts (steps, verses, audio paths) |
| `scripts/` | PD ingest and compactors |
| `extra_resources/` | Thin rebuild kit (INGEST sources only); bulk dumps archived off-tree |
| `src/changelog.ts` | Dated product notes (newest first) |
| `src/guide.ts` | In-app Guide tab copy |
| `docs/regenerate-rolleston.md` | Rebuild Extra-canon Mazzaroth from update_04 PDF |
| `docs/regenerate-practice-media.md` | Offline Comfy / Practice bed notes |
| `DESIGN.md` | Visual system notes |

## Content rules

- Prefer public domain / CC0 with clear credit in UI.
- Refuse modern copyright wrappers (Ages Software, Brill Beekes, Bauscher Aramaic, Kaplan Zohar editions, etc.).
- Keep large PDFs as **build sources**; ship compact JSON under `public/`.
- Scripture rights stay on the desk (translations + Open Bible CC BY for cross-refs).

## Progress snapshot (2026-11-09)

Extra-canon now: **61** library works + **16** writings (Gospels.net / Charles 1 Enoch / Mead Pistis). Practice audio includes Hebrew letter/name Hear clips, Temple guide, and Quiet music. Appearance: five looks (Light · Dark · Mystic · Parchment · Ink).

Shipped recently:

1. **Appearance · Parchment + Ink** — Five looks (Light, Dark, Mystic, Parchment, Ink). Settings → Desk swatches + View menu pick; topbar still cycles. Existing themes refined with softer gold glow.
2. **Desk UX polish** — Quiet music labels (was Bed); Temple-first Practice intro + promoted spoken walk; Gematria Hear primary; Roots Hear text; Tour audio step; Extra-canon naming aligned.
3. **Hebrew Hear · Temple guide · read bed** — Offline River letter pronunciations (22 + sofit) and featured Hitchcock name clips; Practice → Temple spoken overview; Quiet music for Meditate plus Scripture Listen / Extra-canon (`bed-read.mp3`). Docs: `docs/practice-audio.md`.
4. **Extra-canon rights pass** — Verified PD English restored for Jubilees + 2 Baruch (Charles); NH quartet + Thunder + Archons (Zinner/Mattison); Acts of Thomas (James 1924); Goetia (Gutenberg #72679); Sixth & Seventh Moses (Scheible 1880 OCR); full 1830 Book of Mormon (Gutenberg #17); Hermes Emerald Tablet (not Doreal). Gospels.net Thomas / Stranger / Secret Mark refreshed. Hermetic shelves = historical study only.
5. **Security harden** — Session-only API keys by default (`persistSecrets` opt-in); leave-device confirms for Nominatim / SearXNG / model test; CSP without script `unsafe-inline` + Tauri CSP; wiki DOMPurify; `npm run audit:deps`; `.env*` gitignored. Settings → About **Licenses & acknowledgments**.
6. **Ship trim** — Unused brand brainstorm assets removed from `public/`; practice audio notes → `docs/practice-audio.md`.
7. **Rolleston PD · Heavens studies** — Clean Extra-canon Mazzaroth (Frances Rolleston, 1862); Heavens → Decans (36 figures), Job star-name lexicon, Camp cherub typology; Study → Links → Mazzaroth history. Clocks-not-fortunes; Cast stays clocks.
8. **QA · forensic** — Leave-device confirms (chat / wiki ingest / expand / remote STT); notebook import caps; study-pack size guard; smoke + forensic probes green.
9. **Desk UX motion** — Clearer rail groups, pane settle motion, Study Links TOC, Ctrl K jumps; optional offline Meditate / reading beds via practice manifest.
10. **Named books + Shem 72** — Lost-book status chips + Laodiceans PD forgery; Seventy-two names catalog (`shemHaMephorash.ts`).
11. **Biblical anthropology** — Peoples and night names: Lilith, Habiru/Hebrew, Horites, typology, emet/golem, shadow.
12. **AI study packet + streaming** — Chat packs open passage, cross-refs, originals, Strong’s, named verses, capped Easton, and notes; Packed receipt; streaming + Stop.
13. **Cast Custom place** — Name + Nominatim search fills Lat/Lon; set IANA before Cast.
14. **Typography** — Outfit (UI) · Fraunces (titles) · Literata (scripture) · Noto (Hebrew/Greek); self-hosted for packaging.
15. **Appearance + desk depth** — Five looks (see item 1); medium lifted chrome; reading stays flat.
16. **Practice spoken audio base** — Offline River guides + quiz cues (`public/audio/practice/`); extended by later audio items.
17. **Heavens cast polish** — Chart library; denser natal report; wheel zoom; Circle / Witness / Scripture twelves.
18. **Study wiki / Listen / Draw** — markdown wiki, chapter read-aloud, Board Cards \| Draw.
19. **Packaging scaffold** — Icons, web manifest, Tauri 2 NSIS/AppImage shell, mobile safe-area.

### External repo review (2026-10-29)

| Repo | License | Desk stance |
|------|---------|-------------|
| [HebrewTools/ParseTrainer](https://github.com/HebrewTools/ParseTrainer) | **GPL-3.0** | Inspiration only → Practice parse drill; do not vendor PHP/MySQL app |
| [beztechconsulting/berean-bible-bots](https://github.com/beztechconsulting/berean-bible-bots) | **No LICENSE** (AI WIP) | Do not dump lessons/Anki/MCP; ideas for later morph stats / word journeys if data licenses clear (STEPBible/MACULA/BSB PD) |
| [spragginsdesigns/bible-ai-explorer](https://github.com/spragginsdesigns/bible-ai-explorer) (SureWord) | **No LICENSE** on GitHub | Inspiration only → chat citations, follow-up chips, reading trail in study packets. No Next.js/RAG/NKJV/Clerk dump |
| [bibletime/bibletime](https://github.com/bibletime/bibletime) | **GPL-2.0** (+ SWORD) | Inspiration only → Recent strip + Kept bookmarks. Do not vendor Qt/SWORD or CrossWire modules |

## Desktop packaging

Scaffold is in-repo (ships `dist/` only — never `extra_resources/`):

| Piece | Status |
|-------|--------|
| Icons | `public/brand/icons/` (32 / 192 / 512 for web) + `src-tauri/icons/` (desktop) |
| Fonts | Self-hosted via `@fontsource-variable/*` + Noto Serif / Hebrew (no Google Fonts CDN) |
| Mobile web | `100dvh` + safe-area insets; Heavens pinch zoom; `public/manifest.webmanifest` |
| Tauri 2 | `src-tauri/` — NSIS + AppImage targets. **Requires [Rust](https://rustup.rs/)** then `npm run tauri:build` |
| Native stores | Capacitor / Play / App Store still deferred |

Windows NSIS installer (after `npm run tauri:build`): `release/Anointed Staff_0.1.0_x64-setup.exe` (~72 MB). Linux AppImage builds on a Linux host with the same command. Fallback without installer: `npm run build` then serve `dist/` over HTTP.

Deferred / next candidates:

- **More Other Gospels / Luminescence PD NH** (map: [alphabetical index](https://othergospels.com/alphabetical-index/)) — Eugnostos, Dialogue of the Savior, Exegesis on the Soul, Tripartite Tractate, etc., only with explicit PD dedication.
- **Tighten Fathers credits:** prefer Charles / pre-1929 named translators (Lightfoot, Roberts–Donaldson, James, etc.) over update_02 OCR dumps that still say “Update_02 extract.”
- **Odes of Solomon** — need a clear PD English (Nuhra 2021 refused: no PD dedication on page).
- **Moses OCR polish** — Scheible Archive scan is complete but noisy; optional cleaner PD edition later.
- Confirm **ElevenLabs River** redistribution terms for installer bundles; keep About credit. Letter/name/Temple packs + read bed shipped — regen only when `phrases.json` or beds change (`docs/practice-audio.md`).
- Confirm **fathersalphabet** word-art image redistribution; compress 4K PNGs / atmosphere stack when bandwidth matters.
- Optional ship trim: defer Excalidraw **Xiaolai** CJK font pack (~12 MB) unless CJK sketch text is required.
- Update_04 letter/angel chart *images* stay refuse; paleo meanings + Named-in-Scripture lost books are rewritten in `letterStudy` / `lostBooks` (no JPG/GIF ship).
- MCP (in-app client and desk-as-server) — skipped for now; berean-bible-bots MCP is not adopted.
- Morphology overlay from openscriptures/morphhb (CC BY 4.0) or STEPBible if we vendor with attribution.
- Cross-corpus stem-frequency “ask the text” tools (berean-bots idea) on PD corpora only.
- Bailey dictionary OCR (image-only PDF) — prefer LiteParse scripts; Unlimited-OCR only as optional GPU batch.
- Deeper Ben Sira Alphabet PD ingest only if license-cleared (desk already ships short bensiira notes).
- Gad the Seer Extra-canon ingest only after a clean public-domain English extract (Cochin MS notes stay Links-only for now).
- Full OHB beyond Genesis sample; OH font redistribution if license clears.
- Synastry / progressions / transits on the same `NatalChart` model.
- Deeper originals merge from OHB into the Reader line.
- Local hybrid verse/library RAG (BM25 + EmbeddingGemma-2 / SQLite-vec style) — own PD index only; no SureWord dump.
- BibleTime Mag/search UX polish without SWORD.

## Day-to-day

1. Change UI in `src/components/` or study helpers under `src/study/`.
2. After ingesting new packs, run the matching `scripts/build-*.py` and confirm credits.
3. Add a short entry at the top of `src/changelog.ts`.
4. Update Guide copy in `src/guide.ts` when a surface changes for users.
5. Keep this README’s progress section current when a milestone lands.

## Security notes (2026-11-09)

Local-first desk; still treat the browser profile as the trust boundary.

| Severity | Topic | Notes |
|----------|--------|--------|
| Mitigated | API keys | Default **session-only** (`sessionStorage`); Settings → remember keys on this device is opt-in (`persistSecrets`). Workspaces always scrub keys. Legacy disk keys migrate once. |
| Mitigated | CSP | `index.html` + Tauri `security.csp`: no script `unsafe-inline`, `frame-ancestors 'none'`, fonts self-hosted. `connect-src` still allows http/https/ws for user model/STT/SearXNG. Pin hosts at the reverse proxy if needed. Residual: `unsafe-eval` (Vite/bundler). |
| Mitigated | Leave-device egress | Confirms (once/session) for Nominatim place search, SearXNG, cloud model test; chat / wiki ingest / expand / remote STT already confirm. |
| Mitigated | Wiki HTML preview | Escape → markup → **DOMPurify** allowlist. |
| Mitigated | Excalidraw `files` | Binary drawing files capped at **2 MB** on persist (Notes → Draw). |
| Low | Birth chart PII | Name/DOB/place in `localStorage` for Heavens cast (chart library too). **Study this sky** confirms before sending identity to a non-local model host. |
| Low | Practice audio | Offline mp3 only; Voice cues preference in `localStorage`. Regeneration needs ElevenLabs outside the shipped app. |
| Ops | Dependency audit | `npm run audit:deps` (omit dev). Direct `dompurify@3.4.17` for wiki. Residual moderate/high under **Excalidraw → Mermaid** (nested older DOMPurify/nanoid/KaTeX) — upgrade Excalidraw when a fix lands; Draw stays local. `.env*` gitignored. |

Chat replies render as text (citations are buttons), not raw HTML. Study packs and workspaces omit API keys.

## License posture

**Application source** is licensed under the **Apache License 2.0** — see [`LICENSE`](LICENSE). **Scripture, Extra-canon texts, cross-refs, Practice audio, and brand art** are not “Apache-washed”; see [`NOTICE`](NOTICE) for the content split (PD / CC BY / River bake terms / brand reserved / fathersalphabet word-art under review).

Do not vendor AGPL study corpora into the desk. Forks must keep third-party credits and must not use Anointed Staff marks to imply an official build.

**User-visible credits:** Settings → About → Licenses & acknowledgments (Open Bible CC BY + URL, PD scripture, Extra-canon per-title credits, Practice River / YuE2, OFL fonts, brand provenance). Writings always shows each work’s `credit` footer.

**Rights gate (2026-11-09):** Do not ship modern sacred-name “restored” editions or Brill/Coptic Gnostic Library Project English as if they were PD. Hermetic / world shelves remain historical study (not ritual). Cleared re-ingests: Charles Jubilees + 2 Baruch; Zinner/Mattison NH (John, Origin, Sophia, Acts of Peter & the Twelve, Thunder, Archons); James Acts of Thomas; Gutenberg Goetia + 1830 Mormon; Scheible Moses; Hermes Emerald Tablet (not Doreal). `scripts/gate-library-rights.py` BLOCK is empty while those clear; re-add ids only for new uncleared extracts. See `src/changelog.ts` for the dated What’s New trail.

**Ship hygiene:** Vite copies all of `public/` into `dist/`. Keep brainstorming, regen notes, and refuse dumps out of `public/` (use `docs/`, `extra_resources/`, or `Anointedstaff-archives/`). Practice audio notes: `docs/practice-audio.md`.

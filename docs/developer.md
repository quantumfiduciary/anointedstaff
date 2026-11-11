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

Astro static site → Cloudflare Pages at [www.anointedstaff.com](https://www.anointedstaff.com) (origin `anointedstaff.pages.dev`). Does **not** host the study desk runtime. Voice, section map, and blog rules: [marketing.md](marketing.md). CRO notes: [LANDING-CRO.md](../LANDING-CRO.md).

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
| `npm run tauri:build` | Desktop bundles for the current OS; needs Rust |
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
| Tauri 2 | `src-tauri/` — targets: `nsis`, `appimage`, `deb`, `dmg` |
| Local Windows build | `npm run tauri:build` → NSIS under `src-tauri/target/release/bundle/` (gitignored) |
| CI release | [`.github/workflows/desktop-release.yml`](../.github/workflows/desktop-release.yml) on `v*` tags |

Installers attach to **GitHub Releases** only. Do not commit `release/`, AABs, or IPAs. Do not upload installers to Cloudflare Pages.

### Per-OS toolchains (local)

| OS | Host | Tooling | Bundle |
|----|------|---------|--------|
| Windows | This machine / `windows-latest` | Rust stable, MSVC, Node 22, WebView2 | NSIS `.exe` |
| Linux | Linux host / `ubuntu-22.04` | Rust stable, Node 22, `libwebkit2gtk-4.1-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `patchelf` | AppImage + `.deb` |
| macOS | Mac host / `macos-latest` | Rust stable, Node 22, Xcode CLT | `.dmg` (`aarch64-apple-darwin` first) |

macOS and iOS cannot be cross-compiled from Windows. Use a Mac or GitHub `macos-latest`.

### Tag a multi-OS release

```bash
git tag v0.2.0
git push origin v0.2.0
```

The desktop-release workflow builds Windows, Linux, and macOS and uploads artifacts to that tag’s Release. Marketing CTAs stay “Download for Windows” until a non-Windows asset is actually on the Release — then update the root README and `site/` download copy.

### Signing secrets (GitHub Actions)

| Secret | Needed for | Notes |
|--------|------------|--------|
| `GITHUB_TOKEN` | All platforms | Provided by Actions; uploads Release assets |
| `APPLE_CERTIFICATE` | macOS notarized production | Base64 `.p12` Developer ID Application cert |
| `APPLE_CERTIFICATE_PASSWORD` | macOS | Password for the `.p12` |
| `APPLE_SIGNING_IDENTITY` | macOS | e.g. `Developer ID Application: …` |
| `APPLE_ID` | macOS notarization | Apple ID email |
| `APPLE_PASSWORD` | macOS notarization | App-specific password |
| `APPLE_TEAM_ID` | macOS notarization | 10-character team id |

Unsigned macOS `.dmg` still builds and uploads; Gatekeeper will require right-click → Open until notarization secrets are set. Apple Developer Program is $99/year.

### Mobile (deferred)

Android and iOS stay **out of CI** until a phone layout exists. The desk is a multi-pane 1280-wide room; store builds before a stacked rail/chapter layout will fail review and daily use. Keep one React desk — do not fork React Native or Flutter.

When ready (separate PRs):

1. **Phone layout** — rail, panes, and chapter stack under ~430px; verify notes/`localStorage` and Practice audio.
2. **Android** — `npm run tauri android init` (same id family `app.anointedstaff.desk`), JDK 17, Android SDK + NDK; ship an **AAB** to Play internal testing first.
3. **iOS** — same Tauri mobile project on `macos-latest` + Xcode; Apple Developer Program, provisioning, privacy nutrition labels (local notes; optional network for AI/search); **TestFlight** before App Store.
4. Watch AAB/IPA size (`public/` scripture + Practice audio). If stores reject size, make Practice audio optional later — not before the first desktop Linux/macOS ports.

Play / Apple store secrets (later): `ANDROID_KEYSTORE_*`, Play service account JSON, iOS provisioning profile + distribution cert. Still never commit binaries; still never host them on Pages.

## Security (summary)

Local-first desk; browser/desktop profile is the trust boundary.

- API keys default to **session-only**; persist is opt-in.
- CSP without script `unsafe-inline`; wiki preview via DOMPurify.
- Leave-device confirms for Nominatim / SearXNG / cloud model / remote STT.
- `npm run audit:deps` (omit dev). `.env*` gitignored.

## Day-to-day

1. Change UI under `src/components/` or study helpers under `src/study/`.
2. After ingest, run the matching `scripts/build-*.py` and confirm credits.
3. What’s New (`src/changelog.ts`) is **brief user notice only** — what they can do or see. Never list ingest, rights gates, Gutenberg ids, packaging, CSP, or other development tracking there (use git + this doc).
4. Update Guide copy in `src/guide.ts` when a surface changes for users.
5. Keep the **root README** product-facing — put engineering notes here, not in the GitHub landing page.
6. Marketing/lore edits: update `site/` and [marketing.md](marketing.md). Touch What’s New only if readers need a short product notice (not a deploy diary).

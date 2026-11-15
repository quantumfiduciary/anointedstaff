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
| macOS | Mac host / `macos-latest` | Rust stable, Node 22, Xcode CLT | universal `.dmg` (`universal-apple-darwin`, ad-hoc `signingIdentity: "-"`) |

macOS and iOS cannot be cross-compiled from Windows. Use a Mac or GitHub `macos-latest`.

### Release loop (tag → CI → verify → Pages)

1. Bump versions in root `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and `site/package.json` together.
2. Keep `src/changelog.ts` brief and **reader-only** (what they can do or see).
3. Update download filenames in [`site/src/data/downloads.ts`](../site/src/data/downloads.ts), root README OS links, and any landing copy that hard-codes the tag.
4. Commit, then tag and push:
   ```bash
   git tag v0.2.1
   git push origin v0.2.1
   ```
5. Wait for [`.github/workflows/desktop-release.yml`](../.github/workflows/desktop-release.yml) on Windows / Ubuntu / macOS. Confirm Release assets match `site/src/data/downloads.ts` names (expect `*_universal.dmg` on macOS).
6. Smoke: install Windows NSIS + one Linux artifact; open a chapter offline; open Settings → About → What’s new.
7. Redeploy marketing: `cd site && npm run build` then `npx wrangler pages deploy site/dist --project-name=anointedstaff` (see [deploy-github-pages.md](deploy-github-pages.md)).
8. Optional metric: GitHub Release download counts + Cloudflare analytics on CTA clicks — no in-app analytics SDK.

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

**Never set empty Apple secrets.** The workflow only injects `APPLE_*` env when `APPLE_CERTIFICATE` is non-empty. Empty strings break codesign.

#### Apple notarization checklist (when you have a Developer ID)

1. Enroll in Apple Developer Program; create a **Developer ID Application** certificate; export `.p12`.
2. Create an app-specific password for notarization; note Team ID.
3. Base64 the `.p12` (no line breaks) into `APPLE_CERTIFICATE`.
4. Set all six Apple secrets in the repo; leave none blank.
5. Retag or `workflow_dispatch` so the signed macOS job runs; verify Gatekeeper opens the `.dmg` without right-click → Open.
6. Update landing Gatekeeper note once notarized builds ship.

Until notarization lands, macOS builds use **ad-hoc signing** (`signingIdentity: "-"`) so Apple Silicon does not show the false “damaged / Move to Trash” dialog. Users may still need right-click → Open, or `xattr -cr` if quarantine sticks — see [install-desktop.md](install-desktop.md). Apple Developer Program is $99/year. Windows code signing (SmartScreen) is optional and lower urgency.

### Mobile

Full runbook: **[mobile.md](mobile.md)**.

Android and iOS stay **out of CI** until the phone/narrow layout gate in that doc is checked. Keep one React desk — do not fork React Native or Flutter.

Shipped in the desk already:

- Phone CSS (~430px) + safe areas / tap targets in `src/styles.css`
- `src/mobile.ts` runtime helpers; `src/share.ts` share-sheet exports
- Settings hides desktop-local Ollama/LM Studio on phone; SearXNG / STT callouts; Excalidraw opt-in on small screens
- npm scripts: `tauri:android:*`, `tauri:ios:*`

When generating native projects (separate commits):

1. Confirm layout gate in [mobile.md](mobile.md).
2. **Android** — `npm run tauri:android:init` (id family `app.anointedstaff.desk`), JDK 17, SDK + NDK; Play internal **AAB** first.
3. **iOS** — `npm run tauri:ios:init` on Mac / `macos-latest` + Xcode; TestFlight before App Store.
4. Watch AAB/IPA size (`public/`). If stores reject size, make Practice audio optional later.

Play / Apple secrets (later): `ANDROID_KEYSTORE_*`, Play service account JSON, iOS provisioning + distribution cert. Never commit binaries; never host them on Pages.

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
6. Marketing/lore edits: update `site/` and [marketing.md](marketing.md). Voice for posts/ads: [voice-profile.md](voice-profile.md). Touch What’s New only if readers need a short product notice (not a deploy diary).

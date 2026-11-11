# Deploy GitHub + Cloudflare Pages

Public monorepo + Astro marketing in `site/`. Application source is Apache-2.0; content split is in [NOTICE](../NOTICE).

## Status

| Step | State |
|------|--------|
| Public GitHub repo | https://github.com/quantumfiduciary/anointedstaff |
| Tag + Release `v0.1.0` + NSIS | https://github.com/quantumfiduciary/anointedstaff/releases/tag/v0.1.0 |
| Tag + Release `v0.2.0` + desktop CI | https://github.com/quantumfiduciary/anointedstaff/releases/tag/v0.2.0 (Windows NSIS, Linux AppImage/deb, macOS dmg via `desktop-release.yml`) |
| Cloudflare Pages project `anointedstaff` | Live |
| Marketing deploy | https://www.anointedstaff.com |
| Custom domain on Pages | `anointedstaff.com` (+ www) registered on the project |
| Apex/www CNAME → `anointedstaff.pages.dev` | **Done** — public canonical URL is `https://www.anointedstaff.com` |

Marketing voice, section map, and CRO notes: [marketing.md](marketing.md), [LANDING-CRO.md](../LANDING-CRO.md).

## Redeploy marketing (direct upload)

```bash
cd site
npm install
npm run build
cd ..
npx wrangler pages deploy site/dist --project-name=anointedstaff --commit-dirty=true
```

Or connect the GitHub repo in Workers & Pages: root `site`, build `npm run build`, output `dist`.

## DNS for anointedstaff.com

In the `anointedstaff.com` zone, add proxied CNAMEs:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `@` | `anointedstaff.pages.dev` | Proxied |
| CNAME | `www` | `anointedstaff.pages.dev` | Proxied |

Dashboard: https://dash.cloudflare.com/?to=/:account/anointedstaff.com/dns

After CNAMEs exist, Pages domain status moves from pending → active.

## Release assets

Do **not** commit `release/`, AABs, or IPAs. Do **not** upload installers to Cloudflare Pages.

Preferred path: push a version tag; [`.github/workflows/desktop-release.yml`](../.github/workflows/desktop-release.yml) builds Windows NSIS, Linux AppImage + `.deb`, and macOS `.dmg`, then attaches them to the GitHub Release.

```bash
git tag v0.2.0
git push origin v0.2.0
```

Local Windows-only fallback:

```bash
npm run tauri:build   # requires Rust
# Attach the NSIS under src-tauri/target/release/bundle/nsis/ to the Release
```

Per-OS toolchains and Apple signing secrets: [developer.md](developer.md). CTAs in `site/` and the root README stay Windows-first until Linux/macOS assets exist on the Release.

## Site internals

- Headers: `site/public/_headers`
- Sitemap: `sitemap-index.xml` from `@astrojs/sitemap`
- Screenshots: `site/public/screenshots/`
- Blogs: `site/src/content/blog/`
- Schema: Organization / WebSite / SoftwareApplication / FAQPage on home; BlogPosting + BreadcrumbList on posts

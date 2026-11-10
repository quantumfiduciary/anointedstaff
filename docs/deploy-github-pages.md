# Deploy GitHub + Cloudflare Pages

Public monorepo + Astro marketing in `site/`. Application source is Apache-2.0; content split is in [NOTICE](../NOTICE).

## Status

| Step | State |
|------|--------|
| Public GitHub repo | https://github.com/quantumfiduciary/anointedstaff |
| Tag + Release `v0.1.0` + NSIS | https://github.com/quantumfiduciary/anointedstaff/releases/tag/v0.1.0 |
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

Do **not** commit `release/`. Attach NSIS from a local build:

```bash
npm run tauri:build   # requires Rust
gh release create v0.1.0 "release/Anointed Staff_0.1.0_x64-setup.exe" --title "v0.1.0" --notes "…"
```

CTAs in `site/` and the root README already point at `quantumfiduciary/anointedstaff`.

## Site internals

- Headers: `site/public/_headers`
- Sitemap: `sitemap-index.xml` from `@astrojs/sitemap`
- Screenshots: `site/public/screenshots/`
- Blogs: `site/src/content/blog/`
- Schema: Organization / WebSite / SoftwareApplication / FAQPage on home; BlogPosting + BreadcrumbList on posts

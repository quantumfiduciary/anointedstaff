# Deploy GitHub + Cloudflare Pages

Local repo is initialized on `main` with Apache-2.0 + `site/` marketing. Annotated tag `v0.1.0` is present locally. Finish remote publish with:

## Status (agent progress)

| Step | State |
|------|--------|
| Local monorepo + commits | Done |
| Tag `v0.1.0` | Done (local) |
| Cloudflare Pages project `anointedstaff` | Done |
| Direct upload of `site/dist` | Live at https://anointedstaff.pages.dev |
| Custom domain `anointedstaff.com` on Pages project | Registered (pending DNS CNAME) |
| Apex/www CNAME → `anointedstaff.pages.dev` | Needs DNS Write (dashboard or API token) |
| GitHub public repo + push | Needs `gh auth login` |
| GitHub Release + NSIS asset | After push (`release/Anointed Staff_0.1.0_x64-setup.exe` already built, gitignored) |

## 1. GitHub (public monorepo)

Device login (if a code is waiting in the terminal): open https://github.com/login/device and paste the one-time code.

```bash
# one-time
gh auth login

# create + push (adjust owner if needed)
gh repo create anointedstaff --public --source=. --remote=origin --push
```

Or create the empty repo on github.com, then:

```bash
git remote add origin git@github.com:<YOU>/anointedstaff.git
git push -u origin main
git push origin v0.1.0
```

Attach the Windows NSIS installer as a **Release** asset for `v0.1.0` — do not commit `release/`.

```bash
gh release create v0.1.0 "release/Anointed Staff_0.1.0_x64-setup.exe" --title "v0.1.0" --notes "First public desk build."
```

Update marketing CTAs if the GitHub owner/name differs from `anointedstaff/anointedstaff` in `site/src/pages/index.astro` and `site/src/layouts/BaseLayout.astro`.

## 2. Cloudflare Pages (anointedstaff.com)

**Already deployed (direct upload):**

```bash
npx wrangler pages deploy site/dist --project-name=anointedstaff --commit-dirty=true
```

**DNS (required for the custom domain):** in the `anointedstaff.com` zone, add proxied CNAMEs:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `@` | `anointedstaff.pages.dev` | Proxied |
| CNAME | `www` | `anointedstaff.pages.dev` | Proxied |

Dashboard deep link: https://dash.cloudflare.com/?to=/:account/anointedstaff.com/dns

Wrangler OAuth can create the Pages project and deploy assets, but **DNS Write** needs a dashboard click or an API token with `Zone.DNS` edit. After CNAMEs exist, Pages domain status moves from pending → active.

**Preferred after GitHub exists:** Workers & Pages → Connect git repo → root directory `site`, build `npm run build`, output `dist`.

Headers: `site/public/_headers`. Sitemap: built as `sitemap-index.xml`.

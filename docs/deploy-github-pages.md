# Deploy GitHub + Cloudflare Pages

Local repo is initialized on `main` with Apache-2.0 + `site/` marketing. Finish remote publish with:

## 1. GitHub (public monorepo)

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
```

Attach the Windows NSIS installer (when built) as a **Release** asset for `v0.1.0` — do not commit `release/`.

```bash
npm run tauri:build   # requires Rust
gh release create v0.1.0 "release/Anointed Staff_0.1.0_x64-setup.exe" --title "v0.1.0" --notes "First public desk build."
```

Update marketing CTAs if the GitHub owner/name differs from `anointedstaff/anointedstaff` in `site/src/pages/index.astro` and `site/src/layouts/BaseLayout.astro`.

## 2. Cloudflare Pages (anointedstaff.com)

**Preferred after GitHub exists:** Workers & Pages → Create → Connect git repo → root directory `site`, build `npm run build`, output `dist`. Attach custom domain `anointedstaff.com`.

**Direct upload (no git hook yet):**

```bash
cd site
npm run build
npx wrangler pages project create anointedstaff --production-branch=main
npx wrangler pages deploy dist --project-name=anointedstaff
```

Then Custom domains → `anointedstaff.com` (zone must be on Cloudflare).

Headers: `site/public/_headers`. Sitemap: built as `sitemap-index.xml`.

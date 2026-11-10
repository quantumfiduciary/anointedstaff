# anointedstaff.com (marketing)

Astro static site for Cloudflare Pages. Lamp-lit lore for the local Scripture desk — does **not** host the study runtime.

```bash
npm install
npm run dev
npm run build   # → dist/
```

Redeploy:

```bash
npx wrangler pages deploy dist --project-name=anointedstaff --commit-dirty=true
```

Live: https://www.anointedstaff.com

## Pages settings

| Setting | Value |
|---------|--------|
| Root directory | `site` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Custom domain | `https://www.anointedstaff.com` (DNS linked to Pages) |

## Content map

| Path | Role |
|------|------|
| `src/pages/index.astro` | Landing (Staff / Desk / Fence / FAQ / Download) |
| `src/content/blog/` | Extra-canon, Heavens, Practice articles |
| `src/layouts/BaseLayout.astro` | Chrome, meta, OG |
| `public/screenshots/` | Real desk UI (Heavens, Extra-canon, Notes, Gematria, Strong’s, AI…) |
| `public/brand/` | Clean wordmarks + feature plates (Staff / Heavens / Practice / shelf) |
| `public/og-atmosphere.png` | Lamp-night OG wash |
| `public/_headers` | Security headers |

Feature catalog + gallery live on the home page (`#catalog`, `#gallery`). Keep new marketing shots under `public/screenshots/` (do not rely on gitignored `extra_resources/`).

Voice and fences: [`docs/marketing.md`](../docs/marketing.md). Deploy checklist: [`docs/deploy-github-pages.md`](../docs/deploy-github-pages.md).

Brand art: use `public/brand/wordmark-clean-*.png` for lockups and `feature-*.png` for section atmosphere. Fathersalphabet word-art plates are not used on the marketing site. Screen captures stay the product proof.

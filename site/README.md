# anointedstaff.com (marketing)

Astro static site for Cloudflare Pages. Does **not** host the study desk runtime.

```bash
npm install
npm run dev
npm run build   # → dist/
```

## Pages settings

| Setting | Value |
|---------|--------|
| Root directory | `site` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Custom domain | `anointedstaff.com` |

Security headers live in `public/_headers`. Screenshots are under `public/screenshots/` (real desk UI). Brand marks are copied from the desk `public/brand/` for the lockup only — fathersalphabet word-art plates are not used here.

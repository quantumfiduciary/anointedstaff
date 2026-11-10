# Marketing site voice and structure

Public surface: Astro in [`site/`](../site/) → Cloudflare Pages at [www.anointedstaff.com](https://www.anointedstaff.com) (Pages origin `anointedstaff.pages.dev`). Does **not** host the study desk runtime.

## Voice

Calm editorial study desk — lamp-night lore, Staff Gold voltage, short sentences.

**Allowed:** anointing/staff companion metaphor; Word as center; Extra-canon as older shelves; Heavens as clocks and glory; Practice as quiet Temple walk.

**Forbidden:** revival hype; fortune-telling; ritual/seal how-to; fake urgency; invented social proof; “game-changing” SaaS filler.

Campaign line: *A study desk you keep, not a cloud Bible that keeps you.*

Typography/color: [DESIGN.md](../DESIGN.md). CRO teardown: [LANDING-CRO.md](../LANDING-CRO.md).

## Landing sections (`site/src/pages/index.astro`)

| Section | Job |
|---------|-----|
| Hero | Brand + lore H1 + Download primary / GitHub secondary (desk-heavens-cast) |
| Why | Tabs vs one desk |
| The Staff | Companion lore (not relic shop) |
| The Desk | PD witnesses, Strong’s, local keys + screenshot |
| On the desk | Feature catalog (Read / Study / Tools highlights) |
| Look inside | Screenshot gallery (real panes) |
| Triptych | Extra-canon / Heavens / Practice → blogs |
| The Fence | Clocks-not-fortunes; PD rights; no ritual; local-first |
| Appearances | Five looks |
| FAQ | Cloud? Fortunes? Which Bibles? Ritual? Free? |
| Download | Final CTA |

## Screenshots (`site/public/screenshots/`)

Copied from desk captures for marketing (not from gitignored `extra_resources/` at runtime — keep copies under `site/public/screenshots/`):

| File | Shows |
|------|--------|
| `desk-heavens-cast.png` | Cast form + study tools + Books |
| `desk-heavens-wheel.png` | Wheel + Witness |
| `desk-extra-canon.png` | Extra-canon shelf |
| `desk-notes-kanban.png` | Notes Kanban |
| `desk-gematria.png` | Letter / Gematria Learn |
| `desk-strongs.png` | Strong’s pane |
| `desk-ai-chat.png` | AI chat + local model settings |

## Blogs (`site/src/content/blog/`)

1. `extra-canon-public-domain-shelf` — rights ethics + shelf walkthrough
2. `heavens-clocks-not-fortunes` — Isaiah 47 fence + Cast/Witness study
3. `offline-practice-quiet-desk` — Temple / Hear / Quiet music / themes

Keep posts detailed, concrete, cross-linked to each other and home. Lead with desk artifacts, not landscape filler.

## Deploy

See [deploy-github-pages.md](deploy-github-pages.md). After content edits: `cd site && npm run build`, then `wrangler pages deploy site/dist --project-name=anointedstaff`.

## Repo alignment

Root [README](../README.md) stays product-facing (badges, screenshots, Download). Contributor tooling stays in [developer.md](developer.md). What’s New is not a marketing or deploy log — only a brief in-desk notice when something changes for the reader.

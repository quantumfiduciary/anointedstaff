---
version: alpha
name: Anointed-Staff-desk
description: >
  Study desk adapted from Cursor's marketing design system (getdesign add cursor).
  Keep Cursor's editorial calm — warm cream canvas, warm near-black ink, hairline-only
  depth, magazine display weight, scarce single brand voltage — but map the voltage to
  Anointed Staff gold (not Cursor Orange). Type: Outfit for UI chrome, Fraunces for
  titles, Literata for scripture, Noto for Hebrew/Greek. Timeline pastels are reserved
  for AI chat stages (thinking / reading / writing / done). Five appearances: Light,
  Dark, Mystic (lamp-and-night), Parchment (warmer paper), and Ink (cool night, quiet
  steel). Medium dimensional chrome on shell panels; reading surfaces stay flat and sharp.

colors:
  primary: "#8f5e24"
  primary-active: "#7a4e1a"
  ink: "#26251e"
  body: "#5a5852"
  body-strong: "#26251e"
  muted: "#807d72"
  muted-soft: "#a09c92"
  hairline: "#e6e5e0"
  hairline-soft: "#efeee8"
  hairline-strong: "#cfcdc4"
  canvas: "#ebe8e2"
  canvas-soft: "#f7f7f4"
  surface-card: "#ffffff"
  surface-strong: "#e6e5e0"
  on-primary: "#fffdf8"
  gold: "#8f5e24"
  gold-deep: "#7a4e1a"
  olive: "#3f6b4e"
  rose: "#9a4e48"
  link: "#1d4ed8"
  timeline-thinking: "#dfa88f"
  timeline-read: "#9fbbe0"
  timeline-write: "#c0a8dd"
  timeline-done: "#c08532"
  semantic-error: "#cf2d56"
  semantic-success: "#1f8a65"
  dark-canvas: "#0c0c0b"
  dark-stage: "#141412"
  dark-card: "#1c1c19"
  dark-panel: "#232320"
  dark-ink: "#f4f3ef"
  dark-muted: "#a09c92"
  dark-hairline: "rgba(244, 243, 239, 0.1)"
  dark-gold: "#e0b86a"
  mystic-canvas: "#0a0c14"
  mystic-stage: "#12151f"
  mystic-card: "#1a1e2a"
  mystic-panel: "#222836"
  mystic-ink: "#f2efe6"
  mystic-gold: "#e8c878"
  mystic-link: "#b7c9e6"
  parchment-canvas: "#ebe0cf"
  parchment-stage: "#f4ebdc"
  parchment-card: "#fffaf2"
  parchment-gold: "#8a5620"
  ink-canvas: "#0b0e12"
  ink-stage: "#12161c"
  ink-card: "#181d24"
  ink-ring: "#a8b8cc"

typography:
  ui: "'Outfit', system-ui, 'Segoe UI', sans-serif"
  display: "'Fraunces', 'Iowan Old Style', Palatino, serif"
  read: "'Literata', 'Iowan Old Style', Palatino, serif"
  hebrew: "'Noto Serif Hebrew', 'Noto Serif Greek', 'Times New Roman', serif"
  display-weight: 600
  title-weight: 600
  button-weight: 500

rounded:
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  base: 16px
  md: 20px
  lg: 24px
---

## Overview

Anointed Staff borrows Cursor's **quietly-confident editorial system**: warm cream floors, warm ink, and a single scarce brand voltage. Voltage here is **Staff Gold** (`#8f5e24`), not Cursor Orange — the desk is a scripture study surface, not a download CTA.

**Appearances** (cycle from the topbar, or pick in Settings → Desk / View menu): **Light** · **Dark** · **Mystic** · **Parchment** · **Ink**. Mystic is lamp-and-night — indigo-ink stage, warmer gold, soft star veil. Parchment is warmer paper light. Ink is a cool quiet night with steel edge (restrained gold). Not purple neon, crystal UI, or fortune-teller chrome.

**Depth:** Medium dimensional chrome via `--depth-shadow` / `--depth-shadow-strong` on topbar, rail, windows, cards, and menus (inset highlight + ground shadow). Scripture and Strong’s stay flat; no skewed text panels. Atmosphere may drift slowly; honor `prefers-reduced-motion`.

**Reading** stays in **Literata** (long-form scripture and Extra-canon body). **Display** titles use **Fraunces** (soft old-style for lamp-and-parchment character). **Chrome** uses **Outfit** (warmer UI sans than Source Sans 3). Hebrew/Greek stay **Noto Serif**.

**Key Characteristics:**
- Warm cream (Light), near-black (Dark), indigo night (Mystic), warm paper (Parchment), cool slate (Ink).
- Staff Gold (or quiet steel on Ink) is the scarce brand voltage — used for focus, active rail marks, primary study accents.
- Medium lift on shell chrome; flat opaque reading panels.
- Three-tier type: Outfit UI · Fraunces titles · Literata reading.
- Compact 8–14px radii.
- AI timeline pastels only on chat thinking / agent stage chips.

## Do's and Don'ts

### Do
- Prefer gold + olive + parchment / night ink for mystical atmosphere.
- Keep scripture in Literata; titles in Fraunces; chrome in Outfit.
- Use gold scarcely for focus rings, active accents, and primary study marks.
- Scope timeline pastels to AI chat stages.
- Keep Mystic reading panels opaque and high-contrast.

### Don't
- Don't replace Staff Gold with Cursor Orange on product chrome.
- Don't bold every heading — Fraunces at 600 is enough for desk titles.
- Don't ship purple IDE glow themes or crystal/fortune aesthetics.
- Don't skew or perspective-transform reading text.
- Don't put Cinzel / all-caps monument faces on UI chrome.
- Don't use timeline pastels as general system colors.

## Source

Installed via `npx getdesign@latest add cursor`, then adapted for Anointed Staff brand, Literata reading, Fraunces display, Outfit chrome, and Mystic appearance.

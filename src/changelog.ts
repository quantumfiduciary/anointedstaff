export type ChangeEntry = {
  date: string
  title: string
  /** Brief user-facing notes only (What's New + Settings → About). Not a development log. */
  items: string[]
}

/**
 * What's New for readers of the desk.
 * Keep entries short and about what they can do or notice.
 * Do not list source materials, ingest/rights work, packaging, or backend chores —
 * those belong in git history and docs/developer.md.
 */
export const changeLog: ChangeEntry[] = [
  {
    date: "2026-11-09",
    title: "Five looks · quieter Practice",
    items: [
      "New desk looks: Parchment and Ink, alongside Light, Dark, and Mystic. Pick one in Settings → Desk or the View menu.",
      "Practice opens on Temple with a spoken walk. Quiet music can play under Meditate, Listen, and Extra-canon.",
      "Hebrew Hear plays offline letter and name clips in Gematria and Roots when available.",
    ],
  },
  {
    date: "2026-11-09",
    title: "Extra-canon shelf · private by default",
    items: [
      "Extra-canon again opens a wide public-domain shelf beside Scripture, with a credit on each work.",
      "API keys stay in this session unless you choose to remember them. Place search and cloud model tests ask before leaving the machine.",
    ],
  },
  {
    date: "2026-11-01",
    title: "Heavens studies · smarter chat",
    items: [
      "Heavens adds Decans and related sky studies beside Scripture. Cast and Witness stay clocks — not fortunes.",
      "Chat can pack the open passage and stream replies; press Stop anytime.",
    ],
  },
  {
    date: "2026-10-30",
    title: "Practice hub · chart library",
    items: [
      "Practice gathers Temple, Drill, Cards, Meditate, and Journal in one place.",
      "Heavens Cast can save and switch charts; the wheel zooms for a closer look.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Compare · Listen · Draw",
    items: [
      "Compare adds more public-domain witnesses. Listen reads the open chapter aloud.",
      "Notes → Board includes Draw for sketches that stay with your notebook.",
    ],
  },
]

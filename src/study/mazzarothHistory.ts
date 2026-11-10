/** Study → Links: Mazzaroth history beside Scripture. Rolleston is Extra-canon PD; Cast stays clocks. */

export type MazzarothHistoryThread = {
  id: string
  title: string
  eyebrow: string
  summary: string
  hypothesis?: string
  refs: string[]
  libraryIds: string[]
  furtherReading: { label: string; url: string }[]
  askPrompt: string
}

export const mazzarothHistoryThreads: MazzarothHistoryThread[] = [
  {
    id: "job-mazzaroth",
    title: "Job 38 · Mazzaroth in his season",
    eyebrow: "Scripture first",
    summary:
      "Job 38:31–33 names Pleiades, Orion, Mazzaroth, and Ayish under the Lord’s questions. Genesis 1:14 already set lights for seasons. This desk reads those verses as ordinances and clocks — not as a license for monthly forecasts (Isaiah 47:13).",
    refs: ["Job 38:31", "Job 38:32", "Job 38:33", "Genesis 1:14", "Isaiah 47:13"],
    libraryIds: ["mazzaroth-rolleston", "beginnings"],
    furtherReading: [],
    askPrompt:
      "Open Job 38:31–33 and Genesis 1:14. Explain Mazzaroth as seasons under God’s ordinances. Keep clocks-not-fortunes; refuse monthly prognosticators.",
  },
  {
    id: "rolleston-1862",
    title: "Frances Rolleston · 1862 history",
    eyebrow: "Extra-canon · public domain",
    summary:
      "Frances Rolleston, Mazzaroth; or, The Constellations (London, 1862), is public domain Extra-canon on this desk. She gathered star names, decans, and tribe traditions as a Christian reading of the sky. Use it beside Scripture. Cast, Witness, and tribe labels stay Anointed Staff study — not pasted fortune tables.",
    hypothesis:
      "Historical hypothesis only. Rolleston’s prophecy-in-the-stars program is Extra-canon study, not Cast doctrine.",
    refs: ["Job 38:32", "Psalm 19:1", "Genesis 3:15"],
    libraryIds: ["mazzaroth-rolleston"],
    furtherReading: [
      {
        label: "Internet Archive · Mazzaroth (search editions)",
        url: "https://archive.org/search?query=mazzaroth%20rolleston",
      },
    ],
    askPrompt:
      "Summarize what Frances Rolleston (1862) claimed about the constellations as prophecy history. Contrast that with this desk’s Witness path and Cast clocks. No natal fortunes.",
  },
  {
    id: "decans-cherub",
    title: "Decans · cherub faces · camp",
    eyebrow: "Heavens tools",
    summary:
      "Heavens → Decans walks thirty-six figures with Scripture refs. Camp adds cherub-face typology (lion, ox, man, eagle) beside Numbers 2 cornerstones. Eagle-for-Dan is labeled tradition. Open those tools; keep Isaiah 47’s refusal of prognosticators.",
    hypothesis: "Typology and sky-map study — not birth-angel calendars or standard-as-fortune charts.",
    refs: ["Ezekiel 1:10", "Revelation 4:7", "Numbers 2:3", "Numbers 2:10", "Numbers 2:18", "Numbers 2:25"],
    libraryIds: ["mazzaroth-rolleston"],
    furtherReading: [],
    askPrompt:
      "How do Ezekiel’s four living-creature faces sit beside Israel’s four camp sides and the desk’s Mazzaroth cornerstones? Label tradition where the text is thin. Clocks-not-fortunes.",
  },
]

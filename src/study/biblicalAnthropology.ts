/** Desk-authored biblical anthropology notes. Scripture first; further reading is off-desk (no essay dumps). */

export type AnthropologyThread = {
  id: string
  title: string
  eyebrow: string
  summary: string
  /** Extra labeled caution when the thread is hypothesis / typology. */
  hypothesis?: string
  refs: string[]
  strongIds: string[]
  relatedPowerIds: string[]
  /** Extra-canon catalog ids when the desk ships a text. */
  libraryIds: string[]
  furtherReading: { label: string; url: string }[]
  askPrompt: string
}

export const anthropologyThreads: AnthropologyThread[] = [
  {
    id: "lilith",
    title: "Lilith · night creature",
    eyebrow: "Isaiah and later tale",
    summary:
      "Isaiah 34:14 names לִילִית (H3917) among the wild company of a wasted land. The King James says screech owl. Near Eastern lilītu spirits and medieval Alphabet of Ben Sira stories fill in what Genesis never says: Lilith as Adam’s first companion is legend, not the Torah. Keep Isaiah as Scripture; Ben Sira’s Alphabet as Extra-canon folklore.",
    refs: ["Isaiah 34:14", "Genesis 1:27", "Genesis 2:18"],
    strongIds: ["H3917"],
    relatedPowerIds: ["lilith"],
    libraryIds: ["bensiira", "enoch"],
    furtherReading: [
      {
        label: "Biblical Archaeology Society · Lilith (Janet Howe Gaines)",
        url: "https://www.biblicalarchaeology.org/daily/people-cultures-in-the-bible/people-in-the-bible/lilith/",
      },
    ],
    askPrompt:
      "Study Lilith: Isaiah 34:14 (H3917) as the biblical night-creature, then how medieval Alphabet of Ben Sira tales differ from Genesis. Keep Scripture and Extra-canon labeled.",
  },
  {
    id: "habiru",
    title: "Habiru · Hebrew",
    eyebrow: "Temple servants and the crosser",
    summary:
      "Ancient Near Eastern texts know ha’biru / ha’piru / ‘apiru — people bound to temple and king, often mobile. Genesis 14:13 calls Abram the Hebrew (עִבְרִי). Lexicon and letter vision meet: עָבַר is to cross over; the desk’s Ayin·Beth·Resh reading paints eye·in·head. Anthropology asks how Habiru caste language and Hebrew as “one who crossed” sit beside each other — without collapsing every ‘apiru into Israel.",
    refs: ["Genesis 14:13", "Genesis 12:1", "Exodus 3:18"],
    strongIds: ["H5680", "H5674"],
    relatedPowerIds: [],
    libraryIds: [],
    furtherReading: [
      {
        label: "Just Genesis · Ha’biru, Ha’piru, ‘Apiru, or Hebrew",
        url: "https://jandyongenesis.blogspot.com/2015/05/habiru-hapiru-apiru-or-hebrew.html",
      },
    ],
    askPrompt:
      "Compare Habiru / ‘apiru temple-servant language with Genesis 14:13 Abram the Hebrew (H5680) and the root עבר to cross over (H5674). How do caste history and the letter picture of Hebrew sit beside Scripture?",
  },
  {
    id: "horites",
    title: "Horites · Edom and Seir",
    eyebrow: "Peoples of the hill country",
    summary:
      "Genesis 36 names Horites in the land of Seir before Edom’s kings. Habakkuk 3:7 speaks of tents of Cushan and Midian in a theophany scene. Desk anthropology reads Horite mounds and shrines as priestly geography in the south — study map, not a Cast house. Numbers 12:1 notes Moses’ Cushite wife beside Midianite kinship; keep the family pattern as a note, not a novel.",
    refs: ["Genesis 36:20", "Genesis 36:2", "Habakkuk 3:7", "Numbers 12:1", "Deuteronomy 2:12"],
    strongIds: ["H2752"],
    relatedPowerIds: [],
    libraryIds: [],
    furtherReading: [
      { label: "Just Genesis · Who Were the Horites?", url: "https://jandyongenesis.blogspot.com/2011/01/who-were-horites.html" },
      { label: "Just Genesis · Origins of the Word Horite", url: "https://jandyongenesis.blogspot.com/2012/07/origins-of-the-word-horite.html" },
      { label: "Biblical Anthropology · Horite Mounds", url: "https://biblicalanthropology.blogspot.com/2019/11/horite-mounds.html" },
      { label: "Just Genesis · Moses’ Two Wives", url: "https://jandyongenesis.blogspot.com/2009/04/moses-two-wives.html" },
    ],
    askPrompt:
      "Open Genesis 36 on the Horites of Seir and Habakkuk 3:7. Summarize what Scripture says about these peoples, then what desk anthropology adds as hypothesis about southern priestly geography.",
  },
  {
    id: "horite-typology",
    title: "Horite ancestry hypothesis",
    eyebrow: "Typology · not desk creed",
    summary:
      "Some biblical anthropologists trace a Nilotic ruler-priest pattern: devotion to the High God and a divine son (HR / Horus in Egyptian sources), two-wife territories, and conception by overshadowing. They place Abraham’s kin among Horite Hebrew of Edom and read Luke 1:35’s overshadowing as echoing that older motif. Use this only as a labeled typology hypothesis beside the Gospels — never as a replacement for Matthew, Mark, Luke, or John.",
    hypothesis:
      "Hypothesis only. The desk does not teach that Horus is Jesus. Scripture’s Christ remains the Gospel witness; anthropology offers a possible cultural backdrop.",
    refs: ["Genesis 36:1", "Luke 1:35", "Matthew 1:20", "Genesis 25:1"],
    strongIds: [],
    relatedPowerIds: [],
    libraryIds: [],
    furtherReading: [
      {
        label: "Just Genesis · The Horite Ancestry of Jesus Christ",
        url: "https://jandyongenesis.blogspot.com/2012/08/the-horite-ancestry-of-jesus-christ_8.html",
      },
      { label: "Just Genesis · Who Were the Horites?", url: "https://jandyongenesis.blogspot.com/2011/01/who-were-horites.html" },
    ],
    askPrompt:
      "Explain the Horite / overshadowing typology hypothesis as anthropology (Luke 1:35 beside older High-God-and-son motifs), clearly labeled as hypothesis — not as a creed that replaces the Gospels.",
  },
  {
    id: "emet-golem",
    title: "Emet · golem letter vision",
    eyebrow: "Truth on clay",
    summary:
      "אֱמֶת (emet, H571) is truth — Alef, Mem, Tav spanning the alef-bet. Folklore says a clay servant (golem) is animated by truth written on it; erase Alef and מת (dead) remains. Desk letter study: truth holds life; remove the first letter and death is left. Folklore only — no ritual steps, no spellcraft.",
    refs: ["Psalm 119:160", "Deuteronomy 32:4", "John 14:6"],
    strongIds: ["H571"],
    relatedPowerIds: [],
    libraryIds: ["yetzirah"],
    furtherReading: [],
    askPrompt:
      "Study אמת (H571, truth) as Alef–Mem–Tav and the golem folklore that removing Alef leaves מת (dead). Keep it letter vision and folklore, not a how-to.",
  },
  {
    id: "shadow",
    title: "Shadow · unowned darkness",
    eyebrow: "Adversary and inward night",
    summary:
      "Scripture names Satan, Belial, and night powers; psychology speaks of a shadow — the unowned darkness a person will not face. Desk study holds both: open Job 1 and Isaiah 34 for named adversaries, then ask what “hidden predator” patterns look like when fear or pride stays unconfessed. Metaphor for growth beside Word — not a dump of any modern paper.",
    refs: ["Job 1:6", "Isaiah 34:14", "Psalm 23:4", "Ephesians 5:11"],
    strongIds: ["H7854", "H3917"],
    relatedPowerIds: ["satan", "belial", "lilith"],
    libraryIds: [],
    furtherReading: [
      {
        label: "Academia.edu · The Hidden Predator (further reading only)",
        url: "https://www.academia.edu/63794708/The_Hidden_Predator_Deconstructing_the_Shadow_Side_of_Reality",
      },
    ],
    askPrompt:
      "Beside Job 1 and Isaiah 34, how can “shadow” as unowned inward darkness sit next to named adversaries in Scripture without replacing them? Keep psychology as metaphor for study, not a substitute gospel.",
  },
]

export function anthropologyById(id: string) {
  return anthropologyThreads.find((item) => item.id === id)
}

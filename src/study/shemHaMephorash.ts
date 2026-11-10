/** Desk study: Shem HaMephorash · 72 names. Scripture first; tradition labeled; no ritual, seals, or birth-angel calendar. */

export type ShemThread = {
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

export type ShemAngel = {
  n: number
  triad: string
  name: string
  /** Scripture verse traditionally paired in Western lists (study tag, not a conjuration key). */
  verseRef: string
}

export const shemThreads: ShemThread[] = [
  {
    id: "exodus-shem",
    title: "Exodus 14 · seventy-two letters",
    eyebrow: "Scripture root",
    summary:
      "Exodus 14:19–21 each run seventy-two Hebrew letters in the Masoretic count. Kabbalistic reading arranges the three verses into seventy-two three-letter columns (Shem HaMephorash, the “explicit” or divided Name). Tradition says Moses spoke that Name at the sea. Keep Exodus as Scripture; the seventy-two columns are a later letter vision — study map, not a replacement for the narrative of the pillar and the east wind.",
    refs: ["Exodus 14:19", "Exodus 14:20", "Exodus 14:21", "Exodus 3:14"],
    libraryIds: ["yetzirah", "kabbalah-unveiled"],
    furtherReading: [
      {
        label: "Chabad · 72 Names of G-d (Exodus letters)",
        url: "https://www.chabad.org/kabbalah/article_c/aid/1388270/jewish/72-Names-of-G-d.htm",
      },
      {
        label: "Wikipedia · Shem HaMephorash",
        url: "https://en.wikipedia.org/wiki/Shem_HaMephorash",
      },
    ],
    askPrompt:
      "Study Exodus 14:19–21 as Scripture, then explain how later kabbalah forms seventy-two three-letter names from those verses. Keep the desk’s clocks-not-fortunes tone — letter vision, not a spell.",
  },
  {
    id: "seventy-two-angels",
    title: "Seventy-two angel names",
    eyebrow: "Tradition endings",
    summary:
      "Each triad is traditionally finished with -el or -iah to form an angelic name (Vehuiah, Sitael, and the rest of the catalog below). Western lists often tag a Psalm or Genesis verse to each name. Those tags are study labels in older Christian kabbalah — not a Bible table of contents for summoning. Browse the catalog; open verses; ask. No birth-date rulers on this desk.",
    refs: ["Psalm 91:11", "Hebrews 1:14", "Luke 1:19"],
    libraryIds: [],
    furtherReading: [
      {
        label: "Occult.wiki · Kabbalistic angel (further reading only)",
        url: "https://www.occult.wiki/index.php/Kabbalistic_angel",
      },
    ],
    askPrompt:
      "Explain how Shem HaMephorash triads become angel names with -el or -iah endings. Compare that tradition with angels named in Scripture (Michael, Gabriel). Keep Extra-canon and tradition labeled.",
  },
  {
    id: "goetia-pair",
    title: "Seventy-two Goetia counterparts",
    eyebrow: "Late pairing",
    summary:
      "Early modern grimoires list seventy-two spirits in the Goetia (Lesser Key of Solomon). Later occult writers pair each with a Shem angel as light and shadow. That pairing is historical study — Extra-canon already ships a public-domain Goetia text. This desk does not show seals, does not teach conjuration, and does not treat Goetia as Scripture.",
    refs: ["1 Kings 4:29", "Matthew 12:28", "Acts 19:19"],
    libraryIds: ["lesser-key-goetia", "greater-key-solomon"],
    furtherReading: [],
    askPrompt:
      "How did later tradition pair seventy-two Shem angels with seventy-two Goetia spirits? Keep the Lesser Key as Extra-canon history — no ritual steps.",
  },
  {
    id: "quinances",
    title: "Quinances vs Mazzaroth",
    eyebrow: "Sky slices · not Cast fortune",
    summary:
      "Occult lists assign each Shem name to a five-degree slice of the zodiac (quinances), often traced to Egyptian decans. That is not the same as Job’s ordinances of heaven or the desk’s Mazzaroth Witness (Rolleston as history). Cast watches clocks and Scripture; it does not sell guardian-angel birthdays.",
    hypothesis:
      "Hypothesis / tradition only. Five-degree angel rulers are not Cast doctrine and are not the Mazzaroth of Scripture.",
    refs: ["Job 38:31", "Job 38:32", "Genesis 1:14", "Psalm 19:1"],
    libraryIds: ["mazzaroth-rolleston"],
    furtherReading: [],
    askPrompt:
      "Contrast Shem quinance astrology with Job 38 and the desk’s Mazzaroth Witness. Keep clocks-not-fortunes: astronomy and Scripture, not birth-angel calendars.",
  },
  {
    id: "one-forty-four",
    title: "Seventy-two plus seventy-two · 144,000",
    eyebrow: "Typology · not creed",
    summary:
      "Some modern and Tarot-side talk folds seventy-two angels and seventy-two spirits into one hundred forty-four sky spirits, then glances at Revelation’s 144,000. Folk lore also says half of 144 angels fell. Use that only as a labeled typology question beside Revelation 7 and 14 — never as desk doctrine that replaces the sealed of Israel or the Lamb’s company.",
    hypothesis:
      "Hypothesis only. The desk does not teach that Goetia spirits are the fallen half of the 144,000. Revelation remains Scripture; 72+72 is later arithmetic.",
    refs: ["Revelation 7:4", "Revelation 14:1", "Revelation 14:3", "Genesis 6:2"],
    libraryIds: ["enoch-readings"],
    furtherReading: [],
    askPrompt:
      "Open Revelation 7 and 14 on the 144,000. Then explain how later talk of 72+72 or fallen half-angels differs — labeled typology, not creed.",
  },
]

/** Compact Western Shem list: triad + traditional name + verse tag. Desk-authored table; not an occult.wiki prose dump. */
export const shemAngels: ShemAngel[] = [
  { n: 1, triad: "VHV", name: "Vehuiah", verseRef: "Psalm 3:3" },
  { n: 2, triad: "YLY", name: "Jeliel", verseRef: "Psalm 22:19" },
  { n: 3, triad: "SYT", name: "Sitael", verseRef: "Psalm 91:2" },
  { n: 4, triad: "OLM", name: "Elemiah", verseRef: "Psalm 6:4" },
  { n: 5, triad: "MHSh", name: "Mahasiah", verseRef: "Psalm 34:4" },
  { n: 6, triad: "LLH", name: "Lelahel", verseRef: "Psalm 9:11" },
  { n: 7, triad: "AKA", name: "Achaiah", verseRef: "Psalm 103:8" },
  { n: 8, triad: "KHTh", name: "Cahetel", verseRef: "Psalm 95:6" },
  { n: 9, triad: "HZY", name: "Haziel", verseRef: "Psalm 25:6" },
  { n: 10, triad: "ALD", name: "Aladiah", verseRef: "Psalm 33:22" },
  { n: 11, triad: "LAV", name: "Lauviah", verseRef: "Psalm 18:46" },
  { n: 12, triad: "HHO", name: "Hahaiah", verseRef: "Psalm 110:1" },
  { n: 13, triad: "YZL", name: "Yezael", verseRef: "Psalm 98:4" },
  { n: 14, triad: "MBH", name: "Mebahel", verseRef: "Psalm 9:9" },
  { n: 15, triad: "HRY", name: "Hariel", verseRef: "Psalm 94:22" },
  { n: 16, triad: "HQM", name: "Hakamiah", verseRef: "Psalm 88:1" },
  { n: 17, triad: "LAV", name: "Loviah", verseRef: "Psalm 8:9" },
  { n: 18, triad: "KLY", name: "Caliel", verseRef: "Psalm 35:24" },
  { n: 19, triad: "LVV", name: "Leuviah", verseRef: "Psalm 40:1" },
  { n: 20, triad: "PHL", name: "Pahaliah", verseRef: "Psalm 120:1" },
  { n: 21, triad: "NLK", name: "Nelchael", verseRef: "Psalm 31:14" },
  { n: 22, triad: "YYY", name: "Yeiaiel", verseRef: "Psalm 121:5" },
  { n: 23, triad: "MLH", name: "Melahel", verseRef: "Psalm 121:8" },
  { n: 24, triad: "ChHV", name: "Haheuiah", verseRef: "Psalm 33:18" },
  { n: 25, triad: "NThH", name: "Nithhaiah", verseRef: "Psalm 9:1" },
  { n: 26, triad: "HAA", name: "Haaiah", verseRef: "Psalm 119:145" },
  { n: 27, triad: "YRTh", name: "Yerathel", verseRef: "Psalm 140:1" },
  { n: 28, triad: "ShAH", name: "Seehiah", verseRef: "Psalm 71:12" },
  { n: 29, triad: "RYY", name: "Reiaiel", verseRef: "Psalm 54:4" },
  { n: 30, triad: "AUM", name: "Omael", verseRef: "Psalm 71:5" },
  { n: 31, triad: "LKB", name: "Lecabel", verseRef: "Psalm 71:16" },
  { n: 32, triad: "VShR", name: "Vasariah", verseRef: "Psalm 33:4" },
  { n: 33, triad: "YChV", name: "Yehuiah", verseRef: "Psalm 94:11" },
  { n: 34, triad: "LHCh", name: "Lehahiah", verseRef: "Psalm 131:3" },
  { n: 35, triad: "KVQ", name: "Chavakiah", verseRef: "Psalm 116:1" },
  { n: 36, triad: "MND", name: "Menadel", verseRef: "Psalm 26:8" },
  { n: 37, triad: "ANI", name: "Aniel", verseRef: "Psalm 80:3" },
  { n: 38, triad: "ChOM", name: "Haamiah", verseRef: "Psalm 91:9" },
  { n: 39, triad: "RHO", name: "Rehael", verseRef: "Psalm 30:10" },
  { n: 40, triad: "YYZ", name: "Yeiazel", verseRef: "Psalm 88:14" },
  { n: 41, triad: "HHH", name: "Hahahel", verseRef: "Psalm 120:2" },
  { n: 42, triad: "MIK", name: "Mikael", verseRef: "Psalm 121:7" },
  { n: 43, triad: "VVL", name: "Veuiah", verseRef: "Psalm 88:13" },
  { n: 44, triad: "YLH", name: "Yelahiah", verseRef: "Psalm 119:108" },
  { n: 45, triad: "SAL", name: "Sealiah", verseRef: "Psalm 94:18" },
  { n: 46, triad: "ORI", name: "Ariel", verseRef: "Psalm 145:9" },
  { n: 47, triad: "OShL", name: "Asaliah", verseRef: "Psalm 92:5" },
  { n: 48, triad: "MIH", name: "Mihael", verseRef: "Psalm 98:2" },
  { n: 49, triad: "VHV", name: "Vehuel", verseRef: "Psalm 145:3" },
  { n: 50, triad: "DNI", name: "Daniel", verseRef: "Psalm 145:8" },
  { n: 51, triad: "HChSh", name: "Hahasiah", verseRef: "Psalm 104:31" },
  { n: 52, triad: "OMM", name: "Imamiah", verseRef: "Psalm 7:17" },
  { n: 53, triad: "NNA", name: "Nanael", verseRef: "Psalm 119:75" },
  { n: 54, triad: "NITh", name: "Nithael", verseRef: "Psalm 103:19" },
  { n: 55, triad: "MBH", name: "Mebahiah", verseRef: "Psalm 102:12" },
  { n: 56, triad: "PVI", name: "Poiel", verseRef: "Psalm 145:14" },
  { n: 57, triad: "NMM", name: "Nemamiah", verseRef: "Psalm 115:11" },
  { n: 58, triad: "YYL", name: "Yeialel", verseRef: "Psalm 6:3" },
  { n: 59, triad: "HRCh", name: "Harahel", verseRef: "Psalm 113:3" },
  { n: 60, triad: "MTzR", name: "Mizrael", verseRef: "Psalm 145:17" },
  { n: 61, triad: "VMB", name: "Umabel", verseRef: "Psalm 113:2" },
  { n: 62, triad: "YHH", name: "Iahhel", verseRef: "Psalm 119:159" },
  { n: 63, triad: "ONV", name: "Anauel", verseRef: "Psalm 100:2" },
  { n: 64, triad: "MChI", name: "Mehiel", verseRef: "Psalm 33:18" },
  { n: 65, triad: "DMB", name: "Damabiah", verseRef: "Psalm 90:13" },
  { n: 66, triad: "MNQ", name: "Manakel", verseRef: "Psalm 38:21" },
  { n: 67, triad: "AIA", name: "Eiael", verseRef: "Psalm 37:4" },
  { n: 68, triad: "ChBV", name: "Habuhiah", verseRef: "Psalm 106:1" },
  { n: 69, triad: "RAH", name: "Rochel", verseRef: "Psalm 16:5" },
  { n: 70, triad: "YBM", name: "Jabamiah", verseRef: "Genesis 1:1" },
  { n: 71, triad: "HYY", name: "Haiaiel", verseRef: "Psalm 109:30" },
  { n: 72, triad: "MVM", name: "Mumiah", verseRef: "Psalm 116:7" },
]

export function shemThreadById(id: string) {
  return shemThreads.find((item) => item.id === id)
}

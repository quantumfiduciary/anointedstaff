/** Desk study: עבר — Hebrew as “cross over,” read letter-by-letter as eye · in · head. */

export type HebrewCrossingLetter = {
  glyph: string
  name: string
  symbol: string
  english: string
  /** Strong’s that backs the pictograph sense. */
  strong: string
  strongNote: string
}

export type HebrewCrossingStudy = {
  title: string
  hebrew: string
  translit: string
  image: string
  imageAlt: string
  /** Lexical / Scripture sense. */
  lexical: string
  /** Letter-symbol reading (desk mystical letter study). */
  symbolic: string
  /** Combined desk reading. */
  synthesis: string
  letters: HebrewCrossingLetter[]
  roots: { id: string; gloss: string }[]
  verses: { ref: string; note: string }[]
  askPrompt: string
}

export const hebrewCrossing: HebrewCrossingStudy = {
  title: "Hebrew · עבר",
  hebrew: "עבר",
  translit: "ʿavar / ʿIvri",
  image: "/brand/words/Hebrew-AyinBethResh.jpg",
  imageAlt: "HEBREW spelled Ayin Beth Resh — eye, in, head — read right to left",
  lexical:
    "The verb עָבַר (ʿavar) means to pass over, cross, or go through. From that root, עִבְרִי (ʿIvri, Hebrew) names the one who has crossed — the people who crossed over. Near Eastern ha’biru / ‘apiru texts name temple and king servants; Genesis 14:13 calls Abram the Hebrew — see Study → Links · Habiru.",
  symbolic:
    "Spelled ע־ב־ר (Ayin · Beth · Resh) and read with paleo pictographs: eye · in · head. Right to left, the letters paint “the eye in the head.”",
  synthesis:
    "Put together: a Hebrew is one who crosses over — and the letter picture invites crossing over by the eye in the head, the inner sight (sometimes called the third eye). Lexicon first; letter vision second. Not a fortune claim — a desk reading beside Strong’s and Scripture.",
  letters: [
    {
      glyph: "ע",
      name: "Ayin",
      symbol: "eye",
      english: "EYE",
      strong: "H5869",
      strongNote: "ʿayin — eye; also a spring / fountain",
    },
    {
      glyph: "ב",
      name: "Beth",
      symbol: "house / in",
      english: "IN",
      strong: "H1004",
      strongNote: "bayith — house; the letter also marks “in / into”",
    },
    {
      glyph: "ר",
      name: "Resh",
      symbol: "head",
      english: "HEAD",
      strong: "H7218",
      strongNote: "roʾsh — head, chief, beginning",
    },
  ],
  roots: [
    { id: "H5674", gloss: "ʿavar — to pass over, cross, go through" },
    { id: "H5680", gloss: "ʿIvri — Hebrew; one from beyond / who crossed" },
    { id: "H5676", gloss: "ʿeber — region beyond; the other side" },
  ],
  verses: [
    { ref: "Genesis 14:13", note: "Abram the Hebrew — first use of ʿIvri in the Torah." },
    { ref: "Genesis 12:1", note: "Go… to a land I will show you — a call to cross." },
    { ref: "Joshua 1:2", note: "Cross this Jordan — the people who pass over." },
    { ref: "Exodus 12:23", note: "The Lord will pass over the door — same root family in the Passover story." },
  ],
  askPrompt:
    "Study the word Hebrew (עבר / ʿIvri): Strong’s H5674 to cross over and H5680 Hebrew, then the letter picture Ayin–Beth–Resh as eye–in–head. How do the lexicon and the pictographs sit beside Genesis 14:13?",
}

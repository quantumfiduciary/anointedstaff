/**
 * Desk Hebrew verb parse drill — original quiz cards for Scripture study.
 *
 * Inspired by the *idea* of HebrewTools ParseTrainer (GPL-3.0 — not copied).
 * Forms are common pedagogical paradigms; answers use a compact desk notation.
 */

export type ParseCard = {
  id: string
  form: string
  root: string
  gloss: string
  /** Canonical parse tags, e.g. ["q", "pf", "3", "m", "s"] */
  tags: string[]
  /** Human gloss of the parse. */
  label: string
  /** Optional verse where a related form appears (study link, not the quiz source). */
  sample?: string
}

/** Compact stem aliases accepted in answers. */
const stemAliases: Record<string, string> = {
  q: "q",
  qal: "q",
  n: "n",
  ni: "n",
  niphal: "n",
  pi: "pi",
  piel: "pi",
  pu: "pu",
  pual: "pu",
  hit: "hit",
  hith: "hit",
  hithpael: "hit",
  hip: "hip",
  hiphil: "hip",
  hop: "hop",
  hophal: "hop",
}

const tenseAliases: Record<string, string> = {
  pf: "pf",
  perfect: "pf",
  ipf: "ipf",
  imperfect: "ipf",
  imp: "imp",
  imperative: "imp",
  infcs: "infcs",
  "inf-cs": "infcs",
  "inf.cs": "infcs",
  infabs: "infabs",
  "inf-abs": "infabs",
  "inf.abs": "infabs",
  ptc: "ptc",
  participle: "ptc",
  ptcp: "ptcp",
}

/**
 * Textbook-style cards. Not a corpus dump — a small recognition drill.
 * Sample refs point at verses already in the desk library.
 */
export const parseCards: ParseCard[] = [
  { id: "amar-pf-3ms", form: "אָמַר", root: "אמר", gloss: "he said", tags: ["q", "pf", "3", "m", "s"], label: "Qal perfect 3ms", sample: "Genesis 1:3" },
  { id: "amar-pf-3fs", form: "אָמְרָה", root: "אמר", gloss: "she said", tags: ["q", "pf", "3", "f", "s"], label: "Qal perfect 3fs", sample: "Genesis 3:13" },
  { id: "amar-pf-3mp", form: "אָמְרוּ", root: "אמר", gloss: "they said", tags: ["q", "pf", "3", "m", "p"], label: "Qal perfect 3mp", sample: "Genesis 11:3" },
  { id: "amar-ipf-3ms", form: "יֹאמַר", root: "אמר", gloss: "he will say / he says", tags: ["q", "ipf", "3", "m", "s"], label: "Qal imperfect 3ms", sample: "Genesis 2:18" },
  { id: "amar-imp-2ms", form: "אֱמֹר", root: "אמר", gloss: "say! (ms)", tags: ["q", "imp", "2", "m", "s"], label: "Qal imperative 2ms", sample: "Exodus 4:23" },
  { id: "qatal-pf-3ms", form: "קָטַל", root: "קטל", gloss: "he killed (paradigm)", tags: ["q", "pf", "3", "m", "s"], label: "Qal perfect 3ms" },
  { id: "qatal-ipf-3ms", form: "יִקְטֹל", root: "קטל", gloss: "he will kill (paradigm)", tags: ["q", "ipf", "3", "m", "s"], label: "Qal imperfect 3ms" },
  { id: "shamar-pf-3ms", form: "שָׁמַר", root: "שמר", gloss: "he kept / watched", tags: ["q", "pf", "3", "m", "s"], label: "Qal perfect 3ms", sample: "Genesis 37:11" },
  { id: "shamar-ipf-3ms", form: "יִשְׁמֹר", root: "שמר", gloss: "he will keep", tags: ["q", "ipf", "3", "m", "s"], label: "Qal imperfect 3ms", sample: "Psalm 121:7" },
  { id: "shamar-imp-2ms", form: "שְׁמֹר", root: "שמר", gloss: "keep! (ms)", tags: ["q", "imp", "2", "m", "s"], label: "Qal imperative 2ms", sample: "Exodus 20:8" },
  { id: "katav-pf-3ms", form: "כָּתַב", root: "כתב", gloss: "he wrote", tags: ["q", "pf", "3", "m", "s"], label: "Qal perfect 3ms", sample: "Exodus 24:4" },
  { id: "katav-ptc-ms", form: "כֹּתֵב", root: "כתב", gloss: "writing / a writer", tags: ["q", "ptc", "m", "s"], label: "Qal participle ms", sample: "Jeremiah 36:18" },
  { id: "niphal-amar", form: "נֶאֱמַר", root: "אמר", gloss: "it was said", tags: ["n", "pf", "3", "m", "s"], label: "Niphal perfect 3ms", sample: "Genesis 22:14" },
  { id: "piel-dabar", form: "דִּבֶּר", root: "דבר", gloss: "he spoke", tags: ["pi", "pf", "3", "m", "s"], label: "Piel perfect 3ms", sample: "Genesis 8:15" },
  { id: "hiphil-bo", form: "הֵבִיא", root: "בוא", gloss: "he brought", tags: ["hip", "pf", "3", "m", "s"], label: "Hiphil perfect 3ms", sample: "Genesis 2:19" },
  { id: "hiphil-yada", form: "הוֹדִיעַ", root: "ידע", gloss: "he made known", tags: ["hip", "pf", "3", "m", "s"], label: "Hiphil perfect 3ms", sample: "Psalm 98:2" },
  { id: "hitpael-halak", form: "הִתְהַלֵּךְ", root: "הלך", gloss: "he walked about", tags: ["hit", "pf", "3", "m", "s"], label: "Hithpael perfect 3ms", sample: "Genesis 5:22" },
  { id: "qal-infcs-amar", form: "לֵאמֹר", root: "אמר", gloss: "to say / saying", tags: ["q", "infcs"], label: "Qal infinitive construct", sample: "Genesis 1:22" },
  { id: "qal-infabs-amar", form: "אָמֹר", root: "אמר", gloss: "saying (abs)", tags: ["q", "infabs"], label: "Qal infinitive absolute", sample: "Genesis 18:18" },
  { id: "hayah-pf-3ms", form: "הָיָה", root: "היה", gloss: "he was / it came to be", tags: ["q", "pf", "3", "m", "s"], label: "Qal perfect 3ms", sample: "Genesis 1:3" },
  { id: "hayah-ipf-3ms", form: "יִהְיֶה", root: "היה", gloss: "he will be", tags: ["q", "ipf", "3", "m", "s"], label: "Qal imperfect 3ms", sample: "Genesis 1:29" },
  { id: "nathan-pf-3ms", form: "נָתַן", root: "נתן", gloss: "he gave", tags: ["q", "pf", "3", "m", "s"], label: "Qal perfect 3ms", sample: "Genesis 1:29" },
  { id: "bara-pf-3ms", form: "בָּרָא", root: "ברא", gloss: "he created", tags: ["q", "pf", "3", "m", "s"], label: "Qal perfect 3ms", sample: "Genesis 1:1" },
  { id: "raah-pf-3ms", form: "רָאָה", root: "ראה", gloss: "he saw", tags: ["q", "pf", "3", "m", "s"], label: "Qal perfect 3ms", sample: "Genesis 1:4" },
]

export const parseHelp =
  "Enter stem + tense + person/gender/number. Stems: Q, N/Ni, Pi, Pu, Hit, Hip, Hop. Tenses: pf, ipf, imp, infcs, infabs, ptc. Person 1|2|3, gender m|f|c, number s|p. Example: Q pf 3ms"

function tokenize(answer: string): string[] {
  return answer
    .toLowerCase()
    .replace(/[.,;/|]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

/** Normalize a free-text parse into canonical tags. */
export function normalizeParse(answer: string): string[] {
  const tokens = tokenize(answer)
  const out: string[] = []
  for (const token of tokens) {
    if (stemAliases[token]) {
      out.push(stemAliases[token])
      continue
    }
    if (tenseAliases[token]) {
      out.push(tenseAliases[token])
      continue
    }
    if (/^[123]$/.test(token)) {
      out.push(token)
      continue
    }
    if (/^[mfc]$/.test(token)) {
      out.push(token)
      continue
    }
    if (/^[sp]$/.test(token)) {
      out.push(token)
      continue
    }
    // Compact blobs like "3ms" or "2fp"
    const compact = token.match(/^([123])([mfc])([sp])$/)
    if (compact) {
      out.push(compact[1], compact[2], compact[3])
      continue
    }
    const genderNumber = token.match(/^([mfc])([sp])$/)
    if (genderNumber) {
      out.push(genderNumber[1], genderNumber[2])
    }
  }
  return out
}

export function checkParse(card: ParseCard, answer: string): boolean {
  const got = normalizeParse(answer)
  if (got.length !== card.tags.length) return false
  return card.tags.every((tag, index) => got[index] === tag)
}

export function shuffleCards(list: ParseCard[] = parseCards): ParseCard[] {
  const next = list.slice()
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

export const parseStance =
  "Anointed Staff drill for recognizing Hebrew verb shapes beside Scripture — stem and person practice on the desk, then open the verse."

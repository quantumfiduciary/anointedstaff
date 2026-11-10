/**
 * Desk study map: Tree of Life / 32 Paths of Wisdom.
 * Anchored in Genesis 1 (Elohim) + Sefer Yetzirah (10 sefirot + 22 letters).
 * Western Hermetic path titles are noted as history — not a Tarot reading desk.
 */

export type Sephirah = {
  number: number
  name: string
  hebrew: string
  gloss: string
  pillar: "middle" | "right" | "left"
  /** Genesis “Elohim said” tradition for this sefirah (desk paraphrase of the classic count). */
  elohim: { ref: string; note: string }
}

export type TreePath = {
  /** Western Hermetic path number (11–32 for the letter channels). */
  number: number
  glyph: string
  name: string
  from: number
  to: number
  group: "mother" | "double" | "simple"
  /** Historical Hermetic title for the letter channel (study label only). */
  hermeticTitle: string
  /** Element, planet, or zodiac association in the common Western map. */
  sky: string
}

export const treeIntro = {
  title: "Tree of Life · 32 Paths",
  summary:
    "The 32 Paths of Wisdom are the ten sefirot (emanations) plus the twenty-two Hebrew letters that join them. Sefer Yetzirah opens with these thirty-two mysterious paths. Jewish tradition also ties the number to the thirty-two times Elohim is named in Genesis 1.",
  genesisNote:
    "Count Elohim in Genesis 1: the classic teaching groups “Elohim said,” “Elohim made,” “Elohim saw,” and related phrases across the ten sefirot and the twenty-two letters (mothers, doubles, and simples). This desk keeps that Scripture map beside the Tree — not as a fortune chart.",
  hermeticNote:
    "Later Western kabbalah draws the letters as 22 channels on a Tree and historically pairs them with Major Arcana titles and sky signs. Anointed Staff lists those titles for study only. No Tarot draw, no angel chart dump, no copyrighted Tree image. Open Extra-canon → Sefer Yetzirah notes for the desk’s short Formation reading.",
  askPrompt:
    "Explain the 32 Paths of Wisdom as 10 sefirot + 22 Hebrew letters from Sefer Yetzirah, and how Jewish tradition links the number to Elohim in Genesis 1. Keep Tarot titles only as historical Hermetic labels.",
} as const

/** Ten sefirot — crown to kingdom, desk glosses. */
export const sephirot: Sephirah[] = [
  {
    number: 1,
    name: "Kether",
    hebrew: "כתר",
    gloss: "Crown — the first point; beginning of the map",
    pillar: "middle",
    elohim: { ref: "Genesis 1:1", note: "In the beginning Elohim created…" },
  },
  {
    number: 2,
    name: "Chokmah",
    hebrew: "חכמה",
    gloss: "Wisdom — flash of insight",
    pillar: "right",
    elohim: { ref: "Genesis 1:3", note: "Elohim said: Let there be light" },
  },
  {
    number: 3,
    name: "Binah",
    hebrew: "בינה",
    gloss: "Understanding — form that receives wisdom",
    pillar: "left",
    elohim: { ref: "Genesis 1:6", note: "Elohim said: Let there be a firmament…" },
  },
  {
    number: 4,
    name: "Chesed",
    hebrew: "חסד",
    gloss: "Mercy / loving-kindness — expansion",
    pillar: "right",
    elohim: { ref: "Genesis 1:9", note: "Elohim said: Let the waters be gathered…" },
  },
  {
    number: 5,
    name: "Geburah",
    hebrew: "גבורה",
    gloss: "Strength / severity — boundary and measure",
    pillar: "left",
    elohim: { ref: "Genesis 1:11", note: "Elohim said: Let the earth put forth grass…" },
  },
  {
    number: 6,
    name: "Tiphereth",
    hebrew: "תפארת",
    gloss: "Beauty — balance at the heart of the Tree",
    pillar: "middle",
    elohim: { ref: "Genesis 1:14", note: "Elohim said: Let there be lights in the firmament…" },
  },
  {
    number: 7,
    name: "Netzach",
    hebrew: "נצח",
    gloss: "Victory / endurance — lasting drive",
    pillar: "right",
    elohim: { ref: "Genesis 1:20", note: "Elohim said: Let the waters swarm… let fowl fly…" },
  },
  {
    number: 8,
    name: "Hod",
    hebrew: "הוד",
    gloss: "Splendor / acknowledgment — form and speech",
    pillar: "left",
    elohim: { ref: "Genesis 1:24", note: "Elohim said: Let the earth bring forth living creatures…" },
  },
  {
    number: 9,
    name: "Yesod",
    hebrew: "יסוד",
    gloss: "Foundation — channel into the world",
    pillar: "middle",
    elohim: { ref: "Genesis 1:26", note: "Elohim said: Let us make man…" },
  },
  {
    number: 10,
    name: "Malkuth",
    hebrew: "מלכות",
    gloss: "Kingdom — the world that receives",
    pillar: "middle",
    elohim: { ref: "Genesis 1:28", note: "Elohim said: Be fruitful and multiply…" },
  },
]

/**
 * Twenty-two letter channels on the common Western (Hermetic) Tree.
 * Path numbers 11–32. Connections follow the usual Kircher / Golden Dawn layout.
 */
export const letterPaths: TreePath[] = [
  { number: 11, glyph: "א", name: "Alef", from: 1, to: 2, group: "mother", hermeticTitle: "The Fool", sky: "Air" },
  { number: 12, glyph: "ב", name: "Beth", from: 1, to: 3, group: "double", hermeticTitle: "The Magician", sky: "Mercury" },
  { number: 13, glyph: "ג", name: "Gimel", from: 1, to: 6, group: "double", hermeticTitle: "The High Priestess", sky: "Moon" },
  { number: 14, glyph: "ד", name: "Daleth", from: 2, to: 3, group: "double", hermeticTitle: "The Empress", sky: "Venus" },
  { number: 15, glyph: "ה", name: "He", from: 2, to: 6, group: "simple", hermeticTitle: "The Emperor", sky: "Aries" },
  { number: 16, glyph: "ו", name: "Vav", from: 2, to: 4, group: "simple", hermeticTitle: "The Hierophant", sky: "Taurus" },
  { number: 17, glyph: "ז", name: "Zayin", from: 3, to: 6, group: "simple", hermeticTitle: "The Lovers", sky: "Gemini" },
  { number: 18, glyph: "ח", name: "Cheth", from: 3, to: 5, group: "simple", hermeticTitle: "The Chariot", sky: "Cancer" },
  { number: 19, glyph: "ט", name: "Teth", from: 4, to: 5, group: "simple", hermeticTitle: "Strength / Lust", sky: "Leo" },
  { number: 20, glyph: "י", name: "Yod", from: 4, to: 6, group: "simple", hermeticTitle: "The Hermit", sky: "Virgo" },
  { number: 21, glyph: "כ", name: "Kaph", from: 4, to: 7, group: "double", hermeticTitle: "Wheel of Fortune", sky: "Jupiter" },
  { number: 22, glyph: "ל", name: "Lamed", from: 5, to: 6, group: "simple", hermeticTitle: "Justice / Adjustment", sky: "Libra" },
  { number: 23, glyph: "מ", name: "Mem", from: 5, to: 8, group: "mother", hermeticTitle: "The Hanged Man", sky: "Water" },
  { number: 24, glyph: "נ", name: "Nun", from: 6, to: 7, group: "simple", hermeticTitle: "Death", sky: "Scorpio" },
  { number: 25, glyph: "ס", name: "Samekh", from: 6, to: 9, group: "simple", hermeticTitle: "Temperance / Art", sky: "Sagittarius" },
  { number: 26, glyph: "ע", name: "Ayin", from: 6, to: 8, group: "simple", hermeticTitle: "The Devil", sky: "Capricorn" },
  { number: 27, glyph: "פ", name: "Pe", from: 7, to: 8, group: "double", hermeticTitle: "The Tower", sky: "Mars" },
  { number: 28, glyph: "צ", name: "Tzaddi", from: 7, to: 9, group: "simple", hermeticTitle: "The Star", sky: "Aquarius" },
  { number: 29, glyph: "ק", name: "Qoph", from: 7, to: 10, group: "simple", hermeticTitle: "The Moon", sky: "Pisces" },
  { number: 30, glyph: "ר", name: "Resh", from: 8, to: 9, group: "double", hermeticTitle: "The Sun", sky: "Sun" },
  { number: 31, glyph: "ש", name: "Shin", from: 8, to: 10, group: "mother", hermeticTitle: "Judgement / Aeon", sky: "Fire / Spirit" },
  { number: 32, glyph: "ת", name: "Tav", from: 9, to: 10, group: "double", hermeticTitle: "The World / Universe", sky: "Saturn / Earth" },
]

export function sephirahOf(n: number) {
  return sephirot.find((item) => item.number === n) ?? sephirot[0]
}

export function pathOfGlyph(glyph: string) {
  return letterPaths.find((item) => item.glyph === glyph) ?? letterPaths[0]
}

export function pathLabel(path: TreePath) {
  const a = sephirahOf(path.from).name
  const b = sephirahOf(path.to).name
  return `${a} → ${b}`
}

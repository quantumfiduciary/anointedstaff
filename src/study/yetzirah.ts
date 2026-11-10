export type LetterClass = "mother" | "double" | "simple"

export const mothers = ["א", "מ", "ש"] as const
export const doubles = ["ב", "ג", "ד", "כ", "פ", "ר", "ת"] as const
export const simples = ["ה", "ו", "ז", "ח", "ט", "י", "ל", "נ", "ס", "ע", "צ", "ק"] as const

export const letterGroups: { id: LetterClass; label: string; note: string; glyphs: readonly string[] }[] = [
  { id: "mother", label: "Mothers", note: "Alef, Mem, Shin — air, water, fire in Sefer Yetzirah", glyphs: mothers },
  { id: "double", label: "Doubles", note: "Seven letters that can be hard or soft", glyphs: doubles },
  { id: "simple", label: "Simples", note: "Twelve letters beside twelve months and tribes", glyphs: simples },
]

const classByGlyph = new Map<string, LetterClass>([
  ...mothers.map((glyph) => [glyph, "mother"] as const),
  ...doubles.map((glyph) => [glyph, "double"] as const),
  ...simples.map((glyph) => [glyph, "simple"] as const),
])

export function letterClass(glyph: string): LetterClass | null {
  return classByGlyph.get(glyph) ?? null
}

export const tetragrammaton = {
  letters: "יהוה",
  names: ["Yod", "He", "Vav", "He"],
  values: [10, 5, 6, 5],
  total: 26,
  ref: "Exodus 3:15",
  note: "Four letters of the Name. Mispar 10 + 5 + 6 + 5 = 26. A count, not a spell.",
} as const

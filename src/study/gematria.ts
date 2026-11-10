import { letters } from "./hebrew"

export type CountPart = {
  glyph: string
  hebrew: number
  jewish: number
  english: number
  simple: number
}

export type GematriaCount = {
  hebrew: number
  jewish: number
  english: number
  simple: number
  parts: CountPart[]
}

const jewishLatin: Record<string, number> = {
  a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 600,
  k: 10, l: 20, m: 30, n: 40, o: 50, p: 60, q: 70, r: 80, s: 90, t: 100,
  u: 200, v: 700, w: 900, x: 300, y: 400, z: 500,
}

const hebrewValue = new Map(letters.map((letter) => [letter.glyph, letter.value]))
const jewishHebrew = new Map(letters.filter((letter) => !letter.final).map((letter) => [letter.glyph, letter.value]))
for (const letter of letters) {
  if (!letter.final) continue
  const root = letters.find((item) => item.name === letter.name.replace(" sofit", ""))
  if (root) jewishHebrew.set(letter.glyph, root.value)
}

function fold(glyph: string) {
  return glyph.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

export function countGematria(raw: string): GematriaCount {
  const totals = { hebrew: 0, jewish: 0, english: 0, simple: 0 }
  const parts: CountPart[] = []
  for (const glyph of raw.normalize("NFC")) {
    if (/\s/.test(glyph)) {
      if (parts.at(-1)?.glyph !== " ") parts.push({ glyph: " ", hebrew: 0, jewish: 0, english: 0, simple: 0 })
      continue
    }
    const part = { glyph, hebrew: 0, jewish: 0, english: 0, simple: 0 }
    const hebrew = hebrewValue.get(glyph)
    if (hebrew) {
      part.hebrew = hebrew
      part.jewish = jewishHebrew.get(glyph) ?? hebrew
    }
    const latin = fold(glyph)
    if (latin.length === 1 && jewishLatin[latin]) {
      const simple = latin.charCodeAt(0) - 96
      part.jewish += jewishLatin[latin]
      part.simple = simple
      part.english = simple * 6
    }
    if (part.hebrew || part.jewish || part.english || part.simple) {
      totals.hebrew += part.hebrew
      totals.jewish += part.jewish
      totals.english += part.english
      totals.simple += part.simple
      parts.push(part)
    }
  }
  return { ...totals, parts }
}

export type CipherId = "jewish" | "english" | "simple" | "hebrew"

export function countCustom(raw: string, values: Record<string, number>) {
  let total = 0
  for (const glyph of raw.normalize("NFC")) {
    const folded = fold(glyph)
    total += values[glyph] ?? values[folded] ?? 0
  }
  return total
}

export type MatchRow = {
  word: string
  jewish: number
  english: number
  simple: number
  hebrew: number
}

export function matchWords(text: string, target: number, cipher: CipherId, limit = 32): MatchRow[] {
  const seen = new Set<string>()
  const hits: MatchRow[] = []
  for (const word of text.split(/[^\p{L}\p{M}']+/u)) {
    if (word.length < 2) continue
    const key = word.toLowerCase()
    if (seen.has(key)) continue
    const counted = countGematria(word)
    if (counted[cipher] !== target || counted[cipher] === 0) continue
    seen.add(key)
    hits.push({ word, jewish: counted.jewish, english: counted.english, simple: counted.simple, hebrew: counted.hebrew })
    if (hits.length >= limit) break
  }
  return hits
}

export function matchVerses(verses: string[], target: number, cipher: CipherId, limit = 8) {
  return verses.flatMap((text, index) => {
    const counted = countGematria(text)
    if (counted[cipher] !== target || counted[cipher] === 0) return []
    return [{ n: index + 1, text, jewish: counted.jewish, english: counted.english, simple: counted.simple, hebrew: counted.hebrew }]
  }).slice(0, limit)
}

export function scanForValue(text: string, target: number, cipher: CipherId | "custom", custom: Record<string, number> = {}) {
  const seen = new Set<string>()
  const hits: { word: string; value: number }[] = []
  for (const word of text.split(/[^\p{L}\p{M}']+/u)) {
    if (word.length < 2 || seen.has(word.toLowerCase())) continue
    const value = cipher === "custom" ? countCustom(word, custom) : countGematria(word)[cipher]
    if (value !== target || value === 0) continue
    seen.add(word.toLowerCase())
    hits.push({ word, value })
    if (hits.length >= 24) break
  }
  return hits
}

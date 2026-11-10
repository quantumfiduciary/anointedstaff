import { arithmosCiphers, type ArithmosCipher } from "./arithmosData"

export type ArithmosOptions = {
  characters: boolean
  words: boolean
}

export function countArithmos(raw: string, values: Record<string, number>, options: ArithmosOptions = { characters: false, words: false }) {
  let total = 0
  let letters = 0
  for (const glyph of raw.normalize("NFC")) {
    total += values[glyph] ?? 0
    if (/\p{L}/u.test(glyph)) letters += 1
  }
  if (options.characters) total += letters
  if (options.words) total += raw.trim() ? raw.trim().split(/\s+/).length : 0
  return total
}

export function scanArithmos(text: string, target: number, values: Record<string, number>) {
  const seen = new Set<string>()
  const hits: { word: string; value: number }[] = []
  for (const word of text.split(/[^\p{L}\p{M}']+/u)) {
    if (word.length < 2 || seen.has(word.toLowerCase())) continue
    const value = countArithmos(word, values)
    if (value !== target || value === 0) continue
    seen.add(word.toLowerCase())
    hits.push({ word, value })
    if (hits.length >= 24) break
  }
  return hits
}

export function arithmosById(id: string): ArithmosCipher | undefined {
  return arithmosCiphers.find((cipher) => cipher.id === id)
}

export { arithmosCiphers }

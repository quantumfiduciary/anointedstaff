export type StrongEntry = {
  id: string
  lemma: string
  transliteration: string
  pronunciation: string
  entry: string
}

export type StrongsLibrary = {
  lex: Record<string, [string, string, string, string]>
  verses: string[][][]
}

export type StrongPart = { text: string; strong?: string }

const token = /\{(\(?)([HG]\d+)\)?\}/g

export function parseStrongText(text: string): StrongPart[] {
  const parts: StrongPart[] = []
  let pending = ""
  let last = 0
  token.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = token.exec(text))) {
    pending += text.slice(last, match.index)
    last = match.index + match[0].length
    const morphology = match[1] === "("
    if (morphology) continue
    const word = pending.match(/^(.*?)(\S+)\s*$/)
    if (!word) continue
    if (word[1]) parts.push({ text: word[1] })
    parts.push({ text: word[2], strong: match[2] })
    pending = ""
  }
  pending += text.slice(last)
  if (pending) parts.push({ text: pending })
  return parts
}

export function stripStrongMarkup(text: string) {
  return text.replace(/\{\(?[HG]\d+\)?\}/g, "").replace(/\s+/g, " ").trim()
}

export function normalizeStrong(raw: string): string | null {
  const match = raw.trim().match(/^([hg])?\s*0*(\d{1,5})$/i)
  if (!match) return null
  return `${(match[1] || "G").toUpperCase()}${Number(match[2])}`
}

export function readEntry(library: StrongsLibrary, id: string): StrongEntry | null {
  const row = library.lex[id]
  if (!row) return null
  return { id, lemma: row[0], transliteration: row[1], pronunciation: row[2], entry: row[3] }
}

function plain(value: string) {
  return value.normalize("NFC").replace(/[\u0591-\u05C7]/g, "")
}

export function verseStrongIds(library: StrongsLibrary, book: number, chapter: number, verse: number | null) {
  if (verse == null) return []
  const raw = library.verses[book]?.[chapter]?.[verse]
  if (!raw) return []
  const ids: string[] = []
  for (const part of parseStrongText(raw)) {
    if (part.strong && !ids.includes(part.strong)) ids.push(part.strong)
  }
  return ids
}

export function searchLexicon(library: StrongsLibrary, query: string, limit = 40): StrongEntry[] {
  const letter = plain(query.trim())
  if (/^[\u05D0-\u05EA]$/.test(letter)) {
    const hits: StrongEntry[] = []
    for (const id of Object.keys(library.lex)) {
      if (!id.startsWith("H")) continue
      const entry = readEntry(library, id)
      if (!entry) continue
      if (plain(entry.lemma).startsWith(letter)) hits.push(entry)
      if (hits.length >= limit) break
    }
    return hits
  }
  const number = normalizeStrong(query)
  if (number) {
    const exact = readEntry(library, number)
    if (/^[hg]/i.test(query.trim())) return exact ? [exact] : []
    const other = readEntry(library, `${number.startsWith("H") ? "G" : "H"}${number.slice(1)}`)
    return [exact, other].filter((item): item is StrongEntry => Boolean(item))
  }
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return []
  const hits: StrongEntry[] = []
  for (const id of Object.keys(library.lex)) {
    const entry = readEntry(library, id)
    if (!entry) continue
    const hay = `${entry.lemma} ${entry.transliteration} ${entry.pronunciation} ${entry.entry}`.toLowerCase()
    if (hay.includes(needle)) hits.push(entry)
    if (hits.length >= limit) break
  }
  return hits
}

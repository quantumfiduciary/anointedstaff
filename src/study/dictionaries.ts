export type DictEntry = { lemma: string; gloss: string; key: string }

export type DictionaryFile = {
  id: string
  title: string
  credit: string
  entries: DictEntry[]
}

export type DictionaryCatalog = {
  dictionaries: { id: string; title: string; credit: string; file: string; count: number }[]
}

export function searchDictionary(entries: DictEntry[], query: string, limit = 24): DictEntry[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return []
  const exact: DictEntry[] = []
  const prefix: DictEntry[] = []
  const fuzzy: DictEntry[] = []
  for (const entry of entries) {
    const key = entry.key || entry.lemma.toLowerCase()
    const lemma = entry.lemma.toLowerCase()
    if (key === needle || lemma === needle) exact.push(entry)
    else if (key.startsWith(needle) || lemma.startsWith(needle)) prefix.push(entry)
    else if (key.includes(needle) || lemma.includes(needle) || entry.gloss.toLowerCase().includes(needle)) fuzzy.push(entry)
    if (exact.length + prefix.length + fuzzy.length >= limit * 3) break
  }
  return [...exact, ...prefix, ...fuzzy].slice(0, limit)
}

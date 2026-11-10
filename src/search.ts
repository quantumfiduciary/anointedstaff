export type SearchRow = {
  book: number
  chapter: number
  verse: number
  text: string
  lower: string
}

export function buildIndex(text: string[][][]) {
  const rows: SearchRow[] = []
  text.forEach((book, bookIndex) => {
    book.forEach((chapter, chapterIndex) => {
      chapter.forEach((verse, verseIndex) => {
        rows.push({
          book: bookIndex,
          chapter: chapterIndex,
          verse: verseIndex,
          text: verse,
          lower: verse.toLowerCase(),
        })
      })
    })
  })
  return rows
}

const skipWords = new Set(["which", "their", "there", "shall", "would", "could", "about", "after", "before", "these", "those", "them", "with", "from", "that", "this", "have", "were", "been", "into", "your", "they"])

export function relatedRows(rows: SearchRow[], verseText: string, excludeKey: string, limit = 5) {
  const words = [
    ...new Set(
      verseText
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter((word) => word.length >= 5 && !skipWords.has(word)),
    ),
  ]
  if (words.length === 0) return [] as SearchRow[]
  const scored: { row: SearchRow; score: number }[] = []
  for (const row of rows) {
    if (`${row.book}:${row.chapter}:${row.verse}` === excludeKey) continue
    let score = 0
    for (const word of words) {
      if (row.lower.includes(word)) score += 1
    }
    if (score >= 2) scored.push({ row, score })
  }
  scored.sort((a, b) => b.score - a.score || a.row.book - b.row.book)
  return scored.slice(0, limit).map((item) => item.row)
}

export function searchRows(rows: SearchRow[], query: string, limit = 40) {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return { hits: [] as SearchRow[], total: 0 }
  const hits: SearchRow[] = []
  let total = 0
  for (const row of rows) {
    if (!row.lower.includes(needle)) continue
    total += 1
    if (hits.length < limit) hits.push(row)
  }
  return { hits, total }
}

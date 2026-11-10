export type OriginalTexts = {
  wlcCredit: string
  trCredit: string
  wlc: string[][][]
  tr: string[][][]
}

export function originalVerse(texts: OriginalTexts | null, book: number, chapter: number, verse: number) {
  if (!texts) return null
  if (book < 39) return texts.wlc[book]?.[chapter]?.[verse] || null
  if (book < 66) return texts.tr[book - 39]?.[chapter]?.[verse] || null
  return null
}

export function originalCredit(texts: OriginalTexts | null, book: number) {
  if (!texts) return null
  if (book < 39) return texts.wlcCredit
  if (book < 66) return texts.trCredit
  return null
}

export function originalChapter(texts: OriginalTexts | null, book: number, chapter: number) {
  if (!texts) return ""
  const verses = book < 39 ? texts.wlc[book]?.[chapter] : book < 66 ? texts.tr[book - 39]?.[chapter] : null
  return verses?.filter((line): line is string => Boolean(line)).join(" ") ?? ""
}

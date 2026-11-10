import { isTranslationId, type Highlight, type Mark, type Place, type TranslationId } from "./types"

const storageKey = "anointed-staff.study"

export type StudyState = {
  place: Place
  translation: TranslationId
  compare: boolean
  scale: number
  marks: Record<string, Mark>
}

export function markKey(book: number, chapter: number, verse: number) {
  return `${book}:${chapter}:${verse}`
}

export function loadStudy(): StudyState | null {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<StudyState>
    if (!data.place || typeof data.place.book !== "number" || typeof data.place.chapter !== "number") {
      return null
    }
    return {
      place: {
        book: data.place.book,
        chapter: data.place.chapter,
        verse: typeof data.place.verse === "number" ? data.place.verse : null,
      },
      translation: isTranslationId(data.translation) ? data.translation : "kjv",
      compare: Boolean(data.compare),
      scale: typeof data.scale === "number" ? data.scale : 1,
      marks: data.marks && typeof data.marks === "object" ? data.marks : {},
    }
  } catch {
    return null
  }
}

export function saveStudy(state: StudyState) {
  localStorage.setItem(storageKey, JSON.stringify(state))
}

export function withMark(
  marks: Record<string, Mark>,
  key: string,
  patch: Partial<Mark>,
): Record<string, Mark> {
  const next: Mark = { ...marks[key], ...patch }
  if (!next.note?.trim()) delete next.note
  if (!next.color) delete next.color
  if (!next.bookmark) delete next.bookmark
  const copy = { ...marks }
  if (!next.note && !next.color && !next.bookmark) delete copy[key]
  else copy[key] = next
  return copy
}

export function isHighlight(value: string | undefined): value is Highlight {
  return value === "amber" || value === "olive" || value === "rose" || value === "ink"
}

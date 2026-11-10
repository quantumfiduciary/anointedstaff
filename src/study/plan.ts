import { dayOfYear } from "./content"

export type ChapterSlot = {
  book: number
  chapter: number
  verses: number
}

export type DayPlan = {
  day: number
  days: number
  chapters: ChapterSlot[]
  verse: { book: number; chapter: number; verse: number }
}

/** Chapters that actually contain text, including the Apocrypha. */
export function chapterList(text: string[][][]): ChapterSlot[] {
  const list: ChapterSlot[] = []
  text.forEach((book, bookIndex) => {
    book.forEach((chapter, chapterIndex) => {
      const verses = chapter.filter((line) => line.trim()).length
      if (verses) list.push({ book: bookIndex, chapter: chapterIndex, verses: chapter.length })
    })
  })
  return list
}

/** Spread every chapter across the year. A day may hold more than one chapter. */
export function planForDate(list: ChapterSlot[], date = new Date()): DayPlan {
  const day = dayOfYear(date)
  const days = 365
  if (!list.length) {
    return { day, days, chapters: [], verse: { book: 0, chapter: 0, verse: 0 } }
  }
  const perDay = Math.max(1, Math.ceil(list.length / days))
  const start = ((day - 1) * perDay) % list.length
  const chapters = Array.from({ length: perDay }, (_, index) => list[(start + index) % list.length])
  const first = chapters[0]
  const verse = first.verses > 0 ? (day - 1) % first.verses : 0
  return { day, days, chapters, verse: { book: first.book, chapter: first.chapter, verse } }
}

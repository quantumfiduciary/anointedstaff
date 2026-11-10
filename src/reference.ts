import { books } from "./catalog"
import type { Passage } from "./types"

const aliases: { book: number; key: string }[] = []
const seen = new Set<string>()

function addAlias(book: number, alias: string) {
  const key = alias.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (!key || seen.has(key)) return
  seen.add(key)
  aliases.push({ book, key })
}

books.forEach((book, index) => {
  addAlias(index, book.name)
  addAlias(index, book.abbrev)
  book.aliases.forEach((alias) => addAlias(index, alias))
})

aliases.sort((a, b) => b.key.length - a.key.length)

export function parseReference(raw: string): Passage | null {
  const spaced = raw
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/^first\s+/, "1 ")
    .replace(/^second\s+/, "2 ")
    .replace(/^third\s+/, "3 ")
    .replace(/^iii\b/, "3")
    .replace(/^ii\b/, "2")
    .replace(/^i\b/, "1")
    .replace(/\s+/g, " ")

  if (!spaced) return null
  const compact = spaced.replace(/[^a-z0-9:]/g, "")

  for (const alias of aliases) {
    if (!compact.startsWith(alias.key)) continue
    const rest = compact.slice(alias.key.length)
    if (rest === "") {
      if (alias.key.length < 3) continue
      if (spaced.replace(/[^a-z0-9]/g, "") !== alias.key) continue
      return { book: alias.book, chapter: 1, verse: null }
    }
    const match = rest.match(/^(\d+)(?::(\d+))?$/)
    if (!match) continue
    return {
      book: alias.book,
      chapter: Number(match[1]),
      verse: match[2] ? Number(match[2]) : null,
    }
  }
  return null
}

export function passageLabel(book: number, chapter: number, verse: number | null) {
  const name = books[book]?.name ?? "Scripture"
  return verse == null ? `${name} ${chapter}` : `${name} ${chapter}:${verse}`
}

export function toHash(book: number, chapter: number, verse: number | null) {
  const slug = (books[book]?.name ?? "genesis").toLowerCase().replace(/\s+/g, "-")
  const path = verse == null ? `${slug}/${chapter}` : `${slug}/${chapter}/${verse}`
  return `#/${path}`
}

export function parseHash(hash: string): Passage | null {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean)
  if (parts.length < 2) return null
  const book = books.findIndex(
    (item) => item.name.toLowerCase().replace(/\s+/g, "-") === decodeURIComponent(parts[0]).toLowerCase(),
  )
  const chapter = Number(parts[1])
  const verse = parts[2] == null ? null : Number(parts[2])
  if (book < 0 || !Number.isInteger(chapter) || chapter < 1) return null
  if (verse != null && (!Number.isInteger(verse) || verse < 1)) return null
  return { book, chapter, verse }
}

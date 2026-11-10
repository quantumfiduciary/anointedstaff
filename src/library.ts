export type WritingShelf =
  | "enoch"
  | "sophia"
  | "gospels"
  | "fathers"
  | "hebrew"
  | "targum"
  | "witnesses"
  | "hermetic"
  | "egyptian"
  | "world"
  | "other"
  | "talmud"

export type WritingSection = { title: string; paragraphs: string[] }
export type Writing = { id: string; title: string; credit: string; shelf?: WritingShelf; sections: WritingSection[] }
export type WritingsLibrary = { works: Writing[] }
export type LibraryEntry = { id: string; title: string; credit: string; shelf: WritingShelf; file: string }

export const writingShelves: { id: WritingShelf | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "enoch", label: "Enoch" },
  { id: "sophia", label: "Sophia" },
  { id: "gospels", label: "Gospels.net" },
  { id: "fathers", label: "Fathers" },
  { id: "hebrew", label: "Hebrew" },
  { id: "targum", label: "Targum" },
  { id: "witnesses", label: "Witnesses" },
  { id: "hermetic", label: "Hermetic" },
  { id: "egyptian", label: "Egyptian" },
  { id: "world", label: "World" },
  { id: "talmud", label: "Talmud" },
  { id: "other", label: "Other canons" },
]

const gospelsNet = new Set([
  "poxy-5575",
  "thomas",
  "mary",
  "judas",
  "philip",
  "peter",
  "egerton",
  "quelle",
  "james",
  "infancy-james",
  "infancy-thomas",
  "stranger",
  "secret-mark",
])

const fathersIds = new Set([
  "hermas",
  "barnabas",
  "laodiceans",
  "paul-thecla",
  "apocalypse-peter",
  "apocalypse-paul",
  "epistula-apostolorum",
  "acts-peter-twelve",
  "acts-thomas",
  "nicodemus",
  "ebionites",
])

const hermeticIds = new Set([
  "kybalion",
  "kabbalah-unveiled",
  "greater-key-solomon",
  "lesser-key-goetia",
  "sixth-seventh-moses",
  "emerald-tablet",
  "kabala-numbers",
  "raphael-astrology",
  "secret-teachings",
])

const worldIds = new Set([
  "bhagavad-gita",
  "upanishads",
  "tao-te-ching",
  "prose-edda",
  "myths-china",
  "myths-celtic",
  "golden-bough",
  "ramayana",
  "avesta",
])

export function shelfOf(id: string, shelf?: WritingShelf): WritingShelf {
  if (shelf) return shelf
  if (
    id === "enoch" ||
    id === "jubilees" ||
    id === "baruch" ||
    id === "enoch-readings" ||
    id === "odes-solomon" ||
    id === "sibylline" ||
    id === "3-maccabees" ||
    id === "4-maccabees"
  )
    return "enoch"
  if (
    id === "pistis" ||
    id === "truth" ||
    id === "apocryphon-john" ||
    id === "sophia-jesus" ||
    id === "origin-world" ||
    id === "thunder" ||
    id === "archons"
  )
    return "sophia"
  if (id === "jasher" || id === "yetzirah" || id === "bensiira" || id === "adam-eve") return "hebrew"
  if (id.startsWith("targum")) return "targum"
  if (id === "daemonologie" || id === "scott-demonology") return "witnesses"
  if (id === "dead" || id === "beginnings") return "egyptian"
  if (id === "talmud") return "talmud"
  if (id === "mormon") return "other"
  if (id === "bartholomew") return "gospels"
  if (fathersIds.has(id)) return "fathers"
  if (hermeticIds.has(id)) return "hermetic"
  if (worldIds.has(id)) return "world"
  if (gospelsNet.has(id)) return "gospels"
  return "gospels"
}

export function searchWritings(library: WritingsLibrary | null, query: string, limit = 8) {
  const needle = query.trim().toLowerCase()
  if (!library || needle.length < 3) return []
  const found: { work: string; title: string; text: string; workId: string; section: number }[] = []
  for (const item of library.works) {
    item.sections.forEach((part, index) => {
      const text = part.paragraphs.find((paragraph) => paragraph.toLowerCase().includes(needle))
      if (text) found.push({ work: item.title, title: part.title, text, workId: item.id, section: index })
    })
    if (found.length >= limit) break
  }
  return found.slice(0, limit)
}

export function catalogMatch(catalog: LibraryEntry[], query: string) {
  const needle = query.trim().toLowerCase()
  if (needle.length < 3) return undefined
  return catalog.find(
    (item) =>
      item.id === needle ||
      item.title.toLowerCase().includes(needle) ||
      item.id.replace(/-/g, " ").includes(needle) ||
      needle.includes(item.id.replace(/-/g, " ")),
  )
}

import { parseReference, passageLabel } from "../reference"
import { extractScriptureRefs } from "../chatCite"
import { normalizeStrong, readEntry, verseStrongIds, type StrongsLibrary } from "../strongs"
import { linksFor } from "./content"
import { searchDictionary, type DictEntry, type DictionaryFile } from "./dictionaries"
import { originalCredit, originalVerse, type OriginalTexts } from "./originals"
import type { Place, Scripture, TranslationId } from "../types"

export type StudyPacketReceipt = {
  labels: string[]
}

export type StudyPacketResult = {
  text: string
  receipt: StudyPacketReceipt
}

export type StudyPacketInput = {
  command: string
  place: Place
  scripture: Scripture
  translation: TranslationId
  numbersOn: boolean
  strongs: StrongsLibrary | null
  originals: OriginalTexts | null
  compareLine?: string | null
  compareLabel?: string | null
  notebookBrief?: string
  trailLabels?: string[]
  /** Extra-canon section body already attached by the caller. */
  attachedText?: string | null
  attachedLabel?: string | null
  dictionary?: DictionaryFile | null
}

const MAX_CROSS = 6
const MAX_NAMED = 5
const MAX_DICT = 2
const MAX_GLOSS = 8
const MAX_ATTACH = 2200

let eastonCache: DictionaryFile | null | undefined

/** Lazy-load Easton for capped dictionary hits in the study packet. */
export async function loadEastonDictionary(): Promise<DictionaryFile | null> {
  if (eastonCache !== undefined) return eastonCache
  try {
    const response = await fetch("/dictionaries/easton.json")
    if (!response.ok) {
      eastonCache = null
      return null
    }
    eastonCache = (await response.json()) as DictionaryFile
    return eastonCache
  } catch {
    eastonCache = null
    return null
  }
}

function verseText(scripture: Scripture, translation: TranslationId, book: number, chapter: number, verse: number) {
  return scripture.text[translation]?.[book]?.[chapter]?.[verse] ?? null
}

function openPassageSlice(scripture: Scripture, translation: TranslationId, place: Place) {
  const where = passageLabel(place.book, place.chapter + 1, place.verse == null ? null : place.verse + 1)
  const lines = scripture.text[translation]?.[place.book]?.[place.chapter] ?? []
  const start = place.verse == null ? 0 : Math.max(0, place.verse - 2)
  const end = place.verse == null ? Math.min(lines.length, 16) : Math.min(lines.length, place.verse + 3)
  const around =
    lines
      .slice(start, end)
      .map((line, index) => {
        const number = start + index + 1
        const mark = place.verse != null && number === place.verse + 1 ? "*" : " "
        return `${mark}${number} ${line}`
      })
      .join("\n") + (place.verse == null && lines.length > 16 ? "\n…" : "")
  const line = place.verse == null ? lines[0] ?? "" : lines[place.verse] ?? ""
  return { where, around, line }
}

function glossesFor(library: StrongsLibrary | null, command: string, verseIds: string[]) {
  if (!library) return []
  const ids = new Set(verseIds)
  for (const match of command.matchAll(/\b[HG]\d{1,5}\b/gi)) {
    const id = normalizeStrong(match[0])
    if (id) ids.add(id)
  }
  return [...ids]
    .slice(0, MAX_GLOSS)
    .map((id) => readEntry(library, id))
    .filter((entry) => entry != null)
    .map((entry) => ({ id: entry.id, lemma: entry.lemma || entry.transliteration, entry: entry.entry.slice(0, 240) }))
}

function namedVersesOutsideOpen(
  command: string,
  scripture: Scripture,
  translation: TranslationId,
  place: Place,
  openWhere: string,
): { label: string; text: string }[] {
  const openKey = `${place.book}:${place.chapter}:${place.verse ?? ""}`
  const found: { label: string; text: string }[] = []
  const seen = new Set<string>()
  for (const raw of extractScriptureRefs(command, 12)) {
    const parsed = parseReference(raw)
    if (!parsed || parsed.verse == null) continue
    const key = `${parsed.book}:${parsed.chapter - 1}:${parsed.verse - 1}`
    if (key === openKey || seen.has(key)) continue
    const text = verseText(scripture, translation, parsed.book, parsed.chapter - 1, parsed.verse - 1)
    if (!text) continue
    seen.add(key)
    const label = passageLabel(parsed.book, parsed.chapter, parsed.verse)
    if (label === openWhere) continue
    found.push({ label, text })
    if (found.length >= MAX_NAMED) break
  }
  return found
}

function dictionaryHits(command: string, dictionary: DictionaryFile | null | undefined): DictEntry[] {
  if (!dictionary?.entries?.length) return []
  // Only the ask line — ignore Attached extra-canon / long paste bodies.
  const head = command.split(/\nAttached |\nOpen passage/i)[0]?.slice(0, 280) ?? command.slice(0, 280)
  const wants =
    /\b(what (?:is|does)|who (?:is|was)|define|meaning of|easton)\b/i.test(head) ||
    /\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/.test(head)
  if (!wants) return []
  const stop = new Set([
    "the",
    "and",
    "what",
    "does",
    "mean",
    "this",
    "verse",
    "lord",
    "god",
    "jesus",
    "christ",
    "holy",
    "spirit",
    "bible",
    "study",
    "open",
    "passage",
    "compare",
    "strong",
    "how",
    "why",
    "when",
    "where",
    "who",
    "which",
    "that",
    "with",
    "from",
    "into",
    "about",
    "beside",
    "scripture",
    "teach",
    "treat",
    "canonical",
  ])
  const words = head
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !stop.has(word.toLowerCase()))
  const hits: DictEntry[] = []
  const seen = new Set<string>()
  for (const word of words.slice(0, 6)) {
    for (const entry of searchDictionary(dictionary.entries, word, 2)) {
      if (seen.has(entry.key)) continue
      seen.add(entry.key)
      hits.push(entry)
      if (hits.length >= MAX_DICT) return hits
    }
  }
  return hits
}

/** Build the text study packet plus a short receipt of what was included. */
export function buildStudyPacket(input: StudyPacketInput): StudyPacketResult {
  const reading = openPassageSlice(input.scripture, input.translation, input.place)
  const labels: string[] = ["Open passage"]
  const parts = [input.command, "", `Open passage (${reading.where}):`, reading.around]

  if (input.compareLine) {
    parts.push("", `Compare (${input.compareLabel ?? "witness"}): ${input.compareLine}`)
    labels.push("Compare line")
  }

  if (input.place.verse != null) {
    const original = originalVerse(input.originals, input.place.book, input.place.chapter, input.place.verse)
    if (original) {
      const credit = originalCredit(input.originals, input.place.book) ?? "Original"
      parts.push("", `Original (${credit}, ${reading.where}): ${original}`)
      labels.push("Original text")
    }
  }

  if (input.place.verse != null) {
    const cross = linksFor(input.place.book, input.place.chapter + 1, input.place.verse + 1).slice(0, MAX_CROSS)
    if (cross.length) {
      const lines: string[] = []
      for (const ref of cross) {
        const parsed = parseReference(ref)
        if (!parsed || parsed.verse == null) {
          lines.push(`- ${ref}`)
          continue
        }
        const text = verseText(input.scripture, input.translation, parsed.book, parsed.chapter - 1, parsed.verse - 1)
        lines.push(text ? `- ${ref}: ${text}` : `- ${ref}`)
      }
      parts.push("", "Cross-references (Open Bible):", ...lines)
      labels.push(`${cross.length} cross-ref${cross.length === 1 ? "" : "s"}`)
    }
  }

  const named = namedVersesOutsideOpen(input.command, input.scripture, input.translation, input.place, reading.where)
  if (named.length) {
    parts.push("", "Named verses in the question:", ...named.map((item) => `${item.label}: ${item.text}`))
    labels.push(`${named.length} named verse${named.length === 1 ? "" : "s"}`)
  }

  const glossIds =
    input.translation === "kjv" && input.numbersOn && input.strongs
      ? verseStrongIds(input.strongs, input.place.book, input.place.chapter, input.place.verse)
      : []
  const glosses = glossesFor(input.strongs, input.command, glossIds)
  if (glosses.length) {
    parts.push("", "Strong's glosses:", ...glosses.map((item) => `${item.id} ${item.lemma}: ${item.entry}`))
    labels.push(`${glosses.length} Strong's`)
  }

  const dictHits = dictionaryHits(input.command, input.dictionary)
  if (dictHits.length) {
    parts.push(
      "",
      `Dictionary (${input.dictionary?.title ?? "Easton"}):`,
      ...dictHits.map((entry) => `${entry.lemma}: ${entry.gloss.slice(0, 280)}`),
    )
    labels.push("Dictionary")
  }

  if (input.attachedText?.trim()) {
    const body = input.attachedText.trim().slice(0, MAX_ATTACH)
    const label = input.attachedLabel?.trim() || "Attached text"
    parts.push("", `${label}:`, body + (input.attachedText.trim().length > MAX_ATTACH ? "\n…" : ""))
    labels.push(label.length > 28 ? "Attached text" : label)
  } else if (/Attached extra-canon \(/i.test(input.command)) {
    labels.push("Extra-canon section")
  }

  if (input.notebookBrief?.trim()) {
    parts.push(input.notebookBrief.trim())
    labels.push("Notebook")
  }

  const recent = (input.trailLabels ?? []).filter((label) => label !== reading.where).slice(0, 5)
  if (recent.length) {
    parts.push("", "Recent reading (desk trail):", recent.join("; "))
    labels.push("Reading trail")
  }

  return { text: parts.join("\n"), receipt: { labels } }
}

export function formatReceipt(labels: string[]): string {
  return labels.length ? labels.join(" · ") : "Open passage"
}

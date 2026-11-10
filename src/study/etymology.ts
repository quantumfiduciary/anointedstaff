import { collectStrongs, englishTree, type EtyNode } from "./englishEty"
import { countGematria } from "./gematria"
import { findHitchcock, hitchcockForGloss, type NameEty } from "./hitchcock"
import { lessonOf } from "./letterStudy"
import { normalizeStrong, readEntry, searchLexicon, type StrongEntry, type StrongsLibrary } from "../strongs"

export type OriginKind = "primitive" | "derived" | "corresponding" | "foreign" | "hebrew" | "compound"

export type RootLinkKind = "from" | "same" | "corresponding" | "compare" | "hebrew" | "compound"

export type RootLink = { id: string; kind: RootLinkKind }

export type RootStep = {
  id: string
  lemma: string
  transliteration: string
  gloss: string
  origin: OriginKind
}

export type LetterStep = {
  glyph: string
  name: string
  picture: string
  meaning: string
  value: number
}

export type KindredWord = {
  id: string
  lemma: string
  transliteration: string
  gloss: string
  link: RootLinkKind
}

export type RootStudy = {
  id: string
  lemma: string
  transliteration: string
  pronunciation: string
  entry: string
  gloss: string
  origin: OriginKind
  originNote: string
  chain: RootStep[]
  kindred: KindredWord[]
  letters: LetterStep[]
  counts: { jewish: number; hebrew: number; english: number; simple: number }
  names: NameEty[]
  english: EtyNode | null
}

export type RootLookup = {
  query: string
  study: RootStudy | null
  names: NameEty[]
  english: EtyNode | null
  hits: StrongEntry[]
}

const linkToken = /[HG]\d{1,5}/gi

const fromPattern =
  /\b(?:from(?:\s+the\s+same\s+as)?|contracted\s+from|shortened\s+from|denominative\s+(?:from|of)|intensive\s+(?:from|of)|causative\s+(?:from|of)|participle\s+of|infinitive\s+of|a\s+form\s+of|or)\s+([HG]\d{1,5})/gi
const samePattern = /\b(?:the\s+same\s+as|from\s+the\s+same\s+as)\s+([HG]\d{1,5})/gi
const correspondingPattern = /\bcorresponding\s+to\s+([HG]\d{1,5})/gi
const comparePattern = /\bcompare(?:\s+[A-Za-z]+)?\s+([HG]\d{1,5})/gi
const hebrewPattern = /\bof\s+Hebrew\s+origin(?:\s*[\(\[]|\s+)?([HG]\d{1,5})/gi
const compoundPattern = /\band\s+([HG]\d{1,5})/gi

const indexes = new WeakMap<StrongsLibrary, Map<string, RootLink[]>>()

function shortGloss(entry: string) {
  const after = entry.includes(":") ? (entry.split(":").pop() ?? entry) : entry
  const words = after
    .replace(/[^A-Za-z'\- ]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length >= 3)
  return words.slice(0, 6).join(" ")
}

function classifyOrigin(entry: string): { kind: OriginKind; note: string } {
  const text = entry.toLowerCase()
  if (/\bof foreign origin\b/.test(text)) return { kind: "foreign", note: "Strong's marks this as a foreign word, not a Hebrew or Greek root." }
  if (/\bof hebrew origin\b/.test(text)) return { kind: "hebrew", note: "A Greek word Strong's traces to a Hebrew source." }
  if (/\bcorresponding to\b/.test(text)) return { kind: "corresponding", note: "The Aramaic or Greek match of another Strong's number." }
  if (/\band [hg]\d/.test(text) && /\bfrom [hg]\d/.test(text)) return { kind: "compound", note: "Built from more than one Strong's number." }
  if (/\ba primitive (?:root|word)\b/.test(text)) return { kind: "primitive", note: "Strong's calls this a primitive root or word. The chain stops here." }
  if (/\bfrom\b/.test(text) || /\bthe same as\b/.test(text)) return { kind: "derived", note: "Drawn from an earlier Strong's number." }
  return { kind: "derived", note: "Read the 1890 gloss for the derivation Strong's wrote." }
}

function pushLink(links: RootLink[], raw: string, kind: RootLinkKind) {
  const id = normalizeStrong(raw)
  if (!id || links.some((item) => item.id === id && item.kind === kind)) return
  links.push({ id, kind })
}

export function parseLinks(entry: string): RootLink[] {
  const links: RootLink[] = []
  for (const [pattern, kind] of [
    [fromPattern, "from"],
    [samePattern, "same"],
    [correspondingPattern, "corresponding"],
    [hebrewPattern, "hebrew"],
    [comparePattern, "compare"],
    [compoundPattern, "compound"],
  ] as const) {
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(entry))) pushLink(links, match[1], kind)
  }
  linkToken.lastIndex = 0
  if (!links.length) {
    const first = linkToken.exec(entry)
    if (first) pushLink(links, first[0], "from")
  }
  return links
}

function parentLinks(entry: string) {
  return parseLinks(entry).filter((item) => item.kind !== "compare")
}

function childIndex(library: StrongsLibrary) {
  const cached = indexes.get(library)
  if (cached) return cached
  const map = new Map<string, RootLink[]>()
  for (const id of Object.keys(library.lex)) {
    const entry = readEntry(library, id)
    if (!entry) continue
    for (const link of parseLinks(entry.entry)) {
      const kids = map.get(link.id) ?? []
      if (!kids.some((item) => item.id === id)) kids.push({ id, kind: link.kind })
      map.set(link.id, kids)
    }
  }
  indexes.set(library, map)
  return map
}

function asStep(library: StrongsLibrary, id: string): RootStep | null {
  const entry = readEntry(library, id)
  if (!entry) return null
  return {
    id: entry.id,
    lemma: entry.lemma,
    transliteration: entry.transliteration,
    gloss: shortGloss(entry.entry),
    origin: classifyOrigin(entry.entry).kind,
  }
}

function walkChain(library: StrongsLibrary, start: string) {
  const chain: RootStep[] = []
  const seen = new Set<string>()
  let current = start
  for (let depth = 0; depth < 8; depth += 1) {
    if (seen.has(current)) break
    seen.add(current)
    const step = asStep(library, current)
    if (!step) break
    chain.unshift(step)
    const entry = readEntry(library, current)
    if (!entry) break
    const next = parentLinks(entry.entry).find((item) => item.kind !== "compound")
    if (!next || next.id === current) break
    if (classifyOrigin(entry.entry).kind === "primitive") break
    current = next.id
  }
  return chain
}

function letterWalk(lemma: string): LetterStep[] {
  const steps: LetterStep[] = []
  const seen = new Set<string>()
  for (const glyph of lemma.normalize("NFC").replace(/[\u0591-\u05C7]/g, "")) {
    if (!/[\u05D0-\u05EA]/.test(glyph) || seen.has(glyph)) continue
    seen.add(glyph)
    const lesson = lessonOf(glyph)
    if (lesson.glyph !== glyph) continue
    steps.push({
      glyph: lesson.glyph,
      name: lesson.name,
      picture: lesson.picture,
      meaning: lesson.meaning,
      value: lesson.value,
    })
  }
  return steps
}

function kindredOf(library: StrongsLibrary, studyId: string, chain: RootStep[]) {
  const index = childIndex(library)
  const root = chain[0]?.id ?? studyId
  const seen = new Set<string>([studyId])
  const rows: KindredWord[] = []
  for (const id of [studyId, root]) {
    for (const kid of index.get(id) ?? []) {
      if (seen.has(kid.id)) continue
      seen.add(kid.id)
      const entry = readEntry(library, kid.id)
      if (!entry) continue
      rows.push({
        id: entry.id,
        lemma: entry.lemma,
        transliteration: entry.transliteration,
        gloss: shortGloss(entry.entry),
        link: kid.kind,
      })
      if (rows.length >= 36) return rows
    }
  }
  return rows
}

export function studyRoot(library: StrongsLibrary, raw: string): RootStudy | null {
  const id = normalizeStrong(raw) ?? raw.trim().toUpperCase()
  const entry = /^[HG]\d+$/.test(id) ? readEntry(library, id) : searchLexicon(library, raw, 1)[0]
  if (!entry) return null
  const origin = classifyOrigin(entry.entry)
  const chain = walkChain(library, entry.id)
  const counted = countGematria(entry.lemma || entry.transliteration)
  const names = hitchcockForGloss(`${entry.entry} ${entry.transliteration} ${entry.lemma}`)
  const english = englishTree(shortGloss(entry.entry)) ?? englishTree(entry.transliteration)
  return {
    id: entry.id,
    lemma: entry.lemma,
    transliteration: entry.transliteration,
    pronunciation: entry.pronunciation,
    entry: entry.entry,
    gloss: shortGloss(entry.entry),
    origin: origin.kind,
    originNote: origin.note,
    chain,
    kindred: kindredOf(library, entry.id, chain),
    letters: letterWalk(entry.lemma),
    counts: {
      jewish: counted.jewish,
      hebrew: counted.hebrew,
      english: counted.english,
      simple: counted.simple,
    },
    names,
    english,
  }
}

export function searchRoots(library: StrongsLibrary, query: string, limit = 24): StrongEntry[] {
  return searchLexicon(library, query, limit)
}

export function lookupRoots(library: StrongsLibrary | null, query: string): RootLookup {
  const needle = query.trim()
  const names = findHitchcock(needle)
  const english = englishTree(needle)
  const pinned = names[0]?.strong || (english ? collectStrongs(english)[0] : undefined)
  const hits = library && needle ? searchRoots(library, pinned || needle) : []
  const fromEnglish = library && english ? collectStrongs(english).map((id) => readEntry(library, id)).filter((item): item is StrongEntry => item != null) : []
  const study = library && (pinned || needle) ? studyRoot(library, pinned || needle) : null
  return {
    query: needle,
    study,
    names: names.length ? names : study?.names ?? [],
    english: english ?? study?.english ?? null,
    hits: hits.length ? hits : fromEnglish,
  }
}

export function rootsReport(study: RootStudy) {
  const chain = study.chain.map((step) => `${step.id} ${step.lemma || step.transliteration} · ${step.gloss}`).join(" → ")
  const letters = study.letters.map((letter) => `${letter.glyph} ${letter.name} (${letter.picture})`).join(" · ")
  const kin = study.kindred
    .slice(0, 8)
    .map((item) => `- ${item.id} ${item.lemma || item.transliteration}: ${item.gloss}`)
    .join("\n")
  return [
    `${study.id} ${study.lemma || study.transliteration}`,
    study.gloss,
    "",
    study.originNote,
    chain ? `Chain: ${chain}` : "",
    letters ? `Letters: ${letters}` : "",
    `Count · Jewish ${study.counts.jewish}, Hebrew ${study.counts.hebrew}, English ${study.counts.english}, Simple ${study.counts.simple}`,
    "",
    kin ? `Kindred\n${kin}` : "No kindred numbers share this parent in Strong's.",
    study.names.length ? `\nHitchcock\n${study.names.map((item) => `- ${item.name}: ${item.meaning}`).join("\n")}` : "",
    study.english ? `\nEnglish · ${study.english.word} (${study.english.lang}): ${study.english.note}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

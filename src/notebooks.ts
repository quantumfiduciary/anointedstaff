import type { Highlight } from "./types"
import { extractWikiLinks } from "./wikiMarkdown"

export type NoteCard = {
  id: string
  book: number
  chapter: number
  verse: number
  label: string
  text: string
  color?: Highlight
  annotation: string
  tags: string[]
  x?: number
  y?: number
  pinned?: boolean
  lane?: string
  kind?: "verse" | "note"
}

export type NoteLink = { from: string; to: string; label?: string }

export type NoteLane = { id: string; title: string }

/** A named region on the study board. Cards whose centre sits inside it travel with it. */
export type NoteFrame = { id: string; title: string; x: number; y: number; w: number; h: number }

/** Durable markdown study page inside a notebook (Joplin-style; AI may maintain). */
export type WikiPage = {
  id: string
  title: string
  slug: string
  body: string
  tags: string[]
  updatedAt: string
  kind?: "page" | "index" | "log"
}

/** Persisted Excalidraw scene (elements + light appState + binary files). */
export type NotebookDrawing = {
  elements: unknown[]
  appState?: Record<string, unknown>
  files?: Record<string, unknown>
}

export type Notebook = {
  id: string
  title: string
  /** Freeform study journal for this notebook. */
  journal: string
  cards: NoteCard[]
  links: NoteLink[]
  lanes: NoteLane[]
  frames: NoteFrame[]
  pages: WikiPage[]
  /** Excalidraw Draw board scene for this notebook. */
  drawing?: NotebookDrawing
}

export const STUDY_PACK_VERSION = 1
export const MAX_WIKI_PAGES = 80
/** Cap imported / restored notebook cards so a hostile pack cannot unbounded-grow localStorage. */
export const MAX_CARDS = 400
export const MAX_CARD_TEXT = 8_000
export const MAX_CARD_ANNOTATION = 4_000
export const MAX_JOURNAL = 40_000
/** Cap study-pack import size before JSON.parse so a hostile file cannot freeze the tab. */
export const MAX_STUDY_PACK_BYTES = 2 * 1024 * 1024
/** Cap Excalidraw binary files so notebooks / workspaces cannot unbounded-grow localStorage. */
export const MAX_DRAWING_FILES_BYTES = 2 * 1024 * 1024

function drawingFileBytes(entry: unknown): number {
  if (!entry || typeof entry !== "object") return 0
  const row = entry as { dataURL?: unknown; data?: unknown }
  const payload = typeof row.dataURL === "string" ? row.dataURL : typeof row.data === "string" ? row.data : ""
  return payload.length
}

/** Keep largest-fitting binary files under the byte budget; drop the rest. */
export function capDrawingFiles(files: Record<string, unknown> | undefined | null): {
  files: Record<string, unknown>
  trimmed: boolean
} {
  if (!files || typeof files !== "object") return { files: {}, trimmed: false }
  const entries = Object.entries(files)
  if (!entries.length) return { files: {}, trimmed: false }
  const ranked = entries
    .map(([id, value]) => ({ id, value, bytes: drawingFileBytes(value) }))
    .sort((a, b) => a.bytes - b.bytes)
  const next: Record<string, unknown> = {}
  let used = 0
  let trimmed = false
  for (const item of ranked) {
    if (used + item.bytes > MAX_DRAWING_FILES_BYTES) {
      trimmed = true
      continue
    }
    next[item.id] = item.value
    used += item.bytes
  }
  if (Object.keys(next).length !== entries.length) trimmed = true
  return { files: next, trimmed }
}

export type StudyPack = {
  format: "anointed-staff.wiki"
  version: number
  exportedAt: string
  notebook: Notebook
}

export function defaultLanes(): NoteLane[] {
  return [
    { id: "study", title: "To study" },
    { id: "studying", title: "Studying" },
    { id: "insight", title: "Insight" },
    { id: "applied", title: "Applied" },
  ]
}

function asLanes(value: unknown): NoteLane[] {
  if (!Array.isArray(value)) return defaultLanes()
  const seen = new Set<string>()
  const lanes = value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const lane = item as Partial<NoteLane>
    if (typeof lane.id !== "string" || seen.has(lane.id)) return []
    seen.add(lane.id)
    return [{ id: lane.id, title: typeof lane.title === "string" && lane.title.trim() ? lane.title.slice(0, 40) : "Lane" }]
  })
  return lanes.length ? lanes.slice(0, 8) : defaultLanes()
}

/** A card belongs to the lane it names, or to the first lane when that lane is gone. */
export function laneOf(card: NoteCard, lanes: NoteLane[]) {
  return lanes.some((lane) => lane.id === card.lane) ? card.lane! : (lanes[0]?.id ?? "study")
}

export function parseTags(value: string): string[] {
  const tags = value
    .split(/[,;]/)
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0 && tag.length <= 24)
  return [...new Set(tags)].slice(0, 6)
}

export function slugifyTitle(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug.slice(0, 64) || "page"
}

export function blankWikiPage(title: string, kind: WikiPage["kind"] = "page", body = ""): WikiPage {
  const clean = title.trim().slice(0, 80) || "Untitled"
  return {
    id: crypto.randomUUID(),
    title: clean,
    slug: slugifyTitle(clean),
    body,
    tags: [],
    updatedAt: new Date().toISOString(),
    kind,
  }
}

export function seedWikiPages(): WikiPage[] {
  return [
    blankWikiPage(
      "Index",
      "index",
      "# Index\n\nPages in this study wiki. Add `[[links]]` between pages and to verses such as `[[John 3:16]]`.\n",
    ),
    blankWikiPage(
      "Log",
      "log",
      "# Log\n\nA short ledger of what was ingested or revised. The AI appends here when you ask it to ingest a passage.\n",
    ),
  ]
}

export function blankNotebook(title = "Notebook"): Notebook {
  return { id: crypto.randomUUID(), title, journal: "", cards: [], links: [], lanes: defaultLanes(), frames: [], pages: seedWikiPages() }
}

/** Sample notebook + wiki for first-run and “Add example notebook”. John = book index 42. */
export function demoNotebook(): Notebook {
  const lanes = defaultLanes()
  const now = new Date().toISOString()
  const card = (
    book: number,
    chapter: number,
    verse: number,
    label: string,
    text: string,
    annotation: string,
    tags: string[],
    lane: string,
    color?: Highlight,
  ): NoteCard => ({
    id: crypto.randomUUID(),
    book,
    chapter,
    verse,
    label,
    text,
    annotation,
    tags,
    lane,
    color,
    kind: "verse",
    pinned: verse === 15,
  })

  const john = 42
  const cards: NoteCard[] = [
    { ...card(john, 2, 2, "John 3:3", "Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.", "Nicodemus comes by night. Jesus answers with new birth, not with a title of honor.", ["new birth", "nicodemus"], "studying", "amber"), x: 56, y: 64 },
    { ...card(john, 2, 4, "John 3:5", "Jesus answered, Verily, verily, I say unto thee, Except a man be born of water and of the Spirit, he cannot enter into the kingdom of God.", "Water and Spirit together. Keep the card next to 3:3 when you outline the talk.", ["spirit", "kingdom"], "insight", "olive"), x: 280, y: 64 },
    { ...card(john, 2, 15, "John 3:16", "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", "Love → gift → belief → life. Pin this as the hinge of the chapter.", ["love", "belief", "life"], "insight", "rose"), x: 56, y: 200 },
    {
      id: crypto.randomUUID(),
      book: john,
      chapter: 2,
      verse: 15,
      label: "Study note",
      text: "Compare the Geneva line under 3:16 when you open Compare.",
      annotation: "Example sticky: use Kanban or the Board to park freeform notes beside verse cards.",
      tags: ["example"],
      lane: "study",
      kind: "note",
      x: 520,
      y: 80,
    },
  ]

  const idA = cards[0].id
  const idB = cards[2].id
  const pages: WikiPage[] = [
    {
      id: crypto.randomUUID(),
      title: "Index",
      slug: "index",
      kind: "index",
      tags: [],
      updatedAt: now,
      body: `# Index

Example wiki for a study of John 3. Replace these pages with your own, or keep them as a pattern.

- [[New birth]]
- [[Nicodemus]]
- [[Everlasting life]]
- [[How to use this wiki]]

Verse shortcuts: [[John 3:3]], [[John 3:5]], [[John 3:16]].
`,
    },
    {
      id: crypto.randomUUID(),
      title: "Log",
      slug: "log",
      kind: "log",
      tags: [],
      updatedAt: now,
      body: `# Log

- Demo seed: Example notebook created with sample cards and wiki pages for John 3.
`,
    },
    {
      id: crypto.randomUUID(),
      title: "How to use this wiki",
      slug: "how-to-use-this-wiki",
      kind: "page",
      tags: ["guide"],
      updatedAt: now,
      body: `# How to use this wiki

1. **Write** pages in Edit mode (markdown).
2. Link pages with \`[[Page title]]\` and jump to scripture with \`[[John 3:16]]\`.
3. Ask the AI to **Ingest open passage** — it files a page and appends the Log.
4. **Export study pack** from the Notebook menu to share or back up.

Cards on Kanban / Board stay as your verse shelf; the wiki is for longer synthesis.
`,
    },
    {
      id: crypto.randomUUID(),
      title: "New birth",
      slug: "new-birth",
      kind: "page",
      tags: ["theme"],
      updatedAt: now,
      body: `# New birth

Jesus answers [[Nicodemus]] with birth from above, not with another earthly credential.

- See [[John 3:3]] and [[John 3:5]].
- Thread into [[Everlasting life]] via belief in the Son ([[John 3:16]]).

## Questions

- What does “again / from above” change in how you read the talk?
- Where else in John does water or Spirit language return?
`,
    },
    {
      id: crypto.randomUUID(),
      title: "Nicodemus",
      slug: "nicodemus",
      kind: "page",
      tags: ["people"],
      updatedAt: now,
      body: `# Nicodemus

A ruler of the Jews who comes by night ([[John 3:3]] context). He speaks as a teacher; Jesus speaks of [[New birth]].

Keep this page for later appearances of Nicodemus in the Gospel.
`,
    },
    {
      id: crypto.randomUUID(),
      title: "Everlasting life",
      slug: "everlasting-life",
      kind: "page",
      tags: ["theme"],
      updatedAt: now,
      body: `# Everlasting life

[[John 3:16]] ties the Father’s love, the gift of the Son, and belief to life that does not perish.

Link back to [[New birth]] when you outline how one “sees” or “enters” the kingdom.
`,
    },
  ]

  return {
    id: crypto.randomUUID(),
    title: "Example · John 3",
    journal:
      "Demo journal — John 3\n\nNicodemus comes at night. Jesus will not stay on the surface of praise; he presses into birth and belief.\n\nUse Insert verse on the Write tab while a verse is selected, or keep longer synthesis on the Wiki tab.\n",
    cards,
    links: [{ from: idA, to: idB, label: "birth → life" }],
    lanes,
    frames: [
      {
        id: crypto.randomUUID(),
        title: "Night talk",
        x: 40,
        y: 40,
        w: 420,
        h: 280,
      },
    ],
    pages,
  }
}

export function findWikiPage(notebook: Notebook, titleOrSlug: string) {
  const needle = titleOrSlug.trim().toLowerCase()
  const slug = slugifyTitle(titleOrSlug)
  return notebook.pages.find(
    (page) => page.title.toLowerCase() === needle || page.slug === slug || page.slug === needle,
  )
}

export function wikiBacklinks(notebook: Notebook, page: WikiPage) {
  return notebook.pages.filter((other) => {
    if (other.id === page.id) return false
    return extractWikiLinks(other.body).some((target) => {
      const hit = findWikiPage(notebook, target)
      return hit?.id === page.id
    })
  })
}

export function upsertWikiPage(notebook: Notebook, title: string, body: string, kind: WikiPage["kind"] = "page") {
  const existing = findWikiPage(notebook, title)
  const now = new Date().toISOString()
  if (existing) {
    return {
      ...notebook,
      pages: notebook.pages.map((page) =>
        page.id === existing.id ? { ...page, body, updatedAt: now, kind: kind ?? page.kind } : page,
      ),
    }
  }
  if (notebook.pages.length >= MAX_WIKI_PAGES) return notebook
  const page = blankWikiPage(title, kind, body)
  return { ...notebook, pages: [...notebook.pages, page] }
}

export function appendWikiLog(notebook: Notebook, entry: string) {
  const line = `- ${new Date().toLocaleString()}: ${entry.trim()}`
  const log = notebook.pages.find((page) => page.kind === "log") ?? findWikiPage(notebook, "Log")
  if (!log) {
    return upsertWikiPage(notebook, "Log", `# Log\n\n${line}\n`, "log")
  }
  const body = log.body.trim() ? `${log.body.trim()}\n${line}\n` : `# Log\n\n${line}\n`
  return {
    ...notebook,
    pages: notebook.pages.map((page) =>
      page.id === log.id ? { ...page, body, updatedAt: new Date().toISOString(), kind: "log" as const } : page,
    ),
  }
}

export function refreshWikiIndex(notebook: Notebook) {
  const ordinary = notebook.pages.filter((page) => page.kind !== "index" && page.kind !== "log")
  const lines = ordinary.length
    ? ordinary.map((page) => `- [[${page.title}]]${page.tags.length ? ` · ${page.tags.join(", ")}` : ""}`)
    : ["- _(No topic pages yet. Create one, or ask the AI to ingest the open passage.)_"]
  const body = `# Index\n\n${lines.join("\n")}\n`
  return upsertWikiPage(notebook, "Index", body, "index")
}

export function notebookMarkdownDocument(notebook: Notebook) {
  const pages = [...notebook.pages].sort((a, b) => {
    const rank = (page: WikiPage) => (page.kind === "index" ? 0 : page.kind === "log" ? 2 : 1)
    return rank(a) - rank(b) || a.title.localeCompare(b.title)
  })
  const pageBlocks = pages.map((page) => `# ${page.title}\n\n${page.body.trim()}`).join("\n\n---\n\n")
  const dump = notebookDump(notebook)
  return [`# ${notebook.title}`, "", pageBlocks, "", "## Cards and journal", "", dump].join("\n").trim()
}

export function toStudyPack(notebook: Notebook): StudyPack {
  return {
    format: "anointed-staff.wiki",
    version: STUDY_PACK_VERSION,
    exportedAt: new Date().toISOString(),
    notebook: {
      ...notebook,
      pages: notebook.pages ?? [],
    },
  }
}

export function parseStudyPack(raw: unknown): StudyPack | null {
  if (!raw || typeof raw !== "object") return null
  const pack = raw as Partial<StudyPack>
  if (pack.format !== "anointed-staff.wiki") return null
  if (typeof pack.version !== "number") return null
  const notebooks = normalizeNotebooks(pack.notebook ? [pack.notebook] : [])
  const notebook = notebooks[0]
  if (!notebook) return null
  return {
    format: "anointed-staff.wiki",
    version: pack.version,
    exportedAt: typeof pack.exportedAt === "string" ? pack.exportedAt : new Date().toISOString(),
    notebook: { ...notebook, id: crypto.randomUUID() },
  }
}

/** Merge imported pages into a notebook by slug. */
export function mergeWikiPages(target: Notebook, incoming: WikiPage[], mode: "skip" | "rename" | "replace") {
  let pages = [...(target.pages ?? [])]
  for (const page of incoming) {
    const hit = pages.find((item) => item.slug === page.slug || item.title.toLowerCase() === page.title.toLowerCase())
    if (!hit) {
      if (pages.length >= MAX_WIKI_PAGES) break
      pages.push({ ...page, id: crypto.randomUUID() })
      continue
    }
    if (mode === "skip") continue
    if (mode === "replace") {
      pages = pages.map((item) => (item.id === hit.id ? { ...page, id: hit.id } : item))
      continue
    }
    if (pages.length >= MAX_WIKI_PAGES) break
    const title = `${page.title} (import)`
    pages.push({ ...page, id: crypto.randomUUID(), title, slug: slugifyTitle(title) })
  }
  return { ...target, pages }
}

export function cardSpot(card: NoteCard, index: number) {
  if (typeof card.x === "number" && typeof card.y === "number") return { x: card.x, y: card.y }
  return { x: 48 + (index % 3) * 240, y: 48 + Math.floor(index / 3) * 168 }
}

export function insideFrame(frame: NoteFrame, x: number, y: number) {
  return x >= frame.x && x <= frame.x + frame.w && y >= frame.y && y <= frame.y + frame.h
}

/** Cards in a frame, then leftover cards, each by place on the board. */
export function pageOrder(notebook: Notebook) {
  const leftover = new Set(notebook.cards.map((card) => card.id))
  const groups = [...(notebook.frames ?? [])]
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((frame) => {
      const cards = notebook.cards.filter((card, index) => {
        const spot = cardSpot(card, index)
        const hit = insideFrame(frame, spot.x + 110, spot.y + 40)
        if (hit) leftover.delete(card.id)
        return hit
      })
      return { frame, cards }
    })
  return {
    groups,
    loose: notebook.cards.filter((card) => leftover.has(card.id)),
  }
}

function cardLine(card: NoteCard, lanes: NoteLane[]) {
  const lane = lanes.find((item) => item.id === laneOf(card, lanes))?.title
  const tags = card.tags.length ? ` · ${card.tags.join(", ")}` : ""
  const note = card.annotation.trim()
  const body = note || card.text.trim()
  return `- ${card.label}${lane ? ` (${lane})` : ""}${tags}: ${body}`
}

/** The notebook as a study page: wiki pages, frames, leftover cards, then links. */
export function notebookDump(notebook: Notebook) {
  const { groups, loose } = pageOrder(notebook)
  const scenes = groups.flatMap(({ frame, cards }) => (cards.length ? [`## ${frame.title}`, ...cards.map((card) => cardLine(card, notebook.lanes)), ""] : []))
  const rest = loose.length ? ["## Beside the frames", ...loose.map((card) => cardLine(card, notebook.lanes)), ""] : []
  const links = notebook.links.flatMap((link) => {
    const from = notebook.cards.find((card) => card.id === link.from)
    const to = notebook.cards.find((card) => card.id === link.to)
    return from && to ? [`- ${from.label} — ${to.label}`] : []
  })
  const journal = notebook.journal.trim()
  const pages = (notebook.pages ?? []).filter((page) => page.kind !== "index")
  const wiki = pages.length
    ? [
        "## Wiki",
        ...pages.flatMap((page) => {
          const excerpt = page.body.trim().slice(0, 400)
          return [`### ${page.title}`, excerpt || "_(empty)_", ""]
        }),
      ]
    : []
  return [
    notebook.title,
    `${notebook.cards.length} cards${notebook.pages?.length ? ` · ${notebook.pages.length} wiki pages` : ""}${notebook.frames?.length ? ` · ${notebook.frames.length} scenes` : ""}${notebook.drawing?.elements?.length ? " · drawing" : ""}`,
    "",
    ...(notebook.drawing?.elements?.length ? ["## Drawing", "_(Excalidraw sketch saved on the Board → Draw tab.)_", ""] : []),
    ...wiki,
    ...(journal ? ["## Journal", journal, ""] : []),
    ...scenes,
    ...rest,
    ...(links.length ? ["## Linked", ...links] : []),
  ]
    .join("\n")
    .trim()
}

export function notebookBrief(notebook: Notebook, limit = 1600) {
  if (!notebook.cards.length && !(notebook.pages ?? []).some((page) => page.body.trim() && page.kind !== "index")) return ""
  const dump = notebookDump(notebook)
  return dump.length <= limit ? dump : `${dump.slice(0, limit).trim()}…`
}

export function parseAnnotationLines(text: string) {
  return text.split(/\n/).flatMap((raw) => {
    const line = raw.replace(/^\s*[-*]\s*/, "").trim()
    if (!line) return []
    const parts = line.split("|")
    if (parts.length < 2) return []
    const label = parts[0].trim()
    const annotation = parts.slice(1).join("|").trim()
    if (!label || !annotation) return []
    return [{ label, annotation: annotation.slice(0, 800) }]
  })
}

/** Fill card annotations from model lines. Empty cards only, unless every card is already written. */
export function applyAnnotations(notebook: Notebook, lines: { label: string; annotation: string }[], onlyEmpty = true) {
  const key = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim()
  return {
    ...notebook,
    cards: notebook.cards.map((card) => {
      if (onlyEmpty && card.annotation.trim()) return card
      const hit = lines.find((line) => {
        const want = key(line.label)
        const have = key(card.label)
        return want === have || (want.length >= 4 && (have.startsWith(want) || want.startsWith(have)))
      })
      return hit ? { ...card, annotation: hit.annotation } : card
    }),
  }
}

function placeOf(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : undefined
}

function asFrames(value: unknown): NoteFrame[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const frame = item as Partial<NoteFrame>
    if (typeof frame.id !== "string" || typeof frame.title !== "string") return []
    const x = typeof frame.x === "number" ? frame.x : 0
    const y = typeof frame.y === "number" ? frame.y : 0
    const w = typeof frame.w === "number" ? Math.max(160, frame.w) : 360
    const h = typeof frame.h === "number" ? Math.max(140, frame.h) : 240
    return [{ id: frame.id, title: frame.title.slice(0, 48) || "Frame", x, y, w, h }]
  }).slice(0, 24)
}

function asLinks(value: unknown, ids: Set<string>): NoteLink[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const link = item as Partial<NoteLink>
    if (typeof link.from !== "string" || typeof link.to !== "string") return []
    if (link.from === link.to || !ids.has(link.from) || !ids.has(link.to)) return []
    const key = [link.from, link.to].sort().join(":")
    if (seen.has(key)) return []
    seen.add(key)
    return [{ from: link.from, to: link.to, label: typeof link.label === "string" ? link.label.slice(0, 48) : undefined }]
  })
}

function asCard(value: unknown): NoteCard | null {
  if (!value || typeof value !== "object") return null
  const card = value as Partial<NoteCard>
  if (typeof card.book !== "number" || typeof card.chapter !== "number" || typeof card.verse !== "number") return null
  if (typeof card.label !== "string" || typeof card.text !== "string") return null
  const color = card.color === "amber" || card.color === "olive" || card.color === "rose" || card.color === "ink" ? card.color : undefined
  return {
    id: typeof card.id === "string" ? card.id : crypto.randomUUID(),
    book: card.book,
    chapter: card.chapter,
    verse: card.verse,
    label: card.label.slice(0, 160),
    text: card.text.slice(0, MAX_CARD_TEXT),
    color,
    annotation: typeof card.annotation === "string" ? card.annotation.slice(0, MAX_CARD_ANNOTATION) : "",
    tags: Array.isArray(card.tags) ? parseTags(card.tags.filter((tag) => typeof tag === "string").join(",")) : [],
    x: placeOf(card.x),
    y: placeOf(card.y),
    pinned: card.pinned === true,
    lane: typeof card.lane === "string" ? card.lane : undefined,
    kind: card.kind === "note" ? "note" : "verse",
  }
}

function asWikiPages(value: unknown): WikiPage[] {
  if (!Array.isArray(value) || value.length === 0) return seedWikiPages()
  const seen = new Set<string>()
  const pages = value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const page = item as Partial<WikiPage>
    if (typeof page.title !== "string" || !page.title.trim()) return []
    const title = page.title.trim().slice(0, 80)
    const slug = typeof page.slug === "string" && page.slug.trim() ? slugifyTitle(page.slug) : slugifyTitle(title)
    const key = slug
    if (seen.has(key)) return []
    seen.add(key)
    const kind = page.kind === "index" || page.kind === "log" || page.kind === "page" ? page.kind : "page"
    return [
      {
        id: typeof page.id === "string" ? page.id : crypto.randomUUID(),
        title,
        slug,
        body: typeof page.body === "string" ? page.body.slice(0, 40_000) : "",
        tags: Array.isArray(page.tags) ? parseTags(page.tags.filter((tag) => typeof tag === "string").join(",")) : [],
        updatedAt: typeof page.updatedAt === "string" ? page.updatedAt : new Date().toISOString(),
        kind,
      },
    ]
  })
  const next: WikiPage[] = pages.slice(0, MAX_WIKI_PAGES)
  const seeds = seedWikiPages()
  if (!next.some((page) => page.kind === "index")) {
    const index = seeds.find((page) => page.kind === "index")
    if (index) next.unshift(index)
  }
  if (!next.some((page) => page.kind === "log")) {
    const log = seeds.find((page) => page.kind === "log")
    if (log) next.push(log)
  }
  return next.slice(0, MAX_WIKI_PAGES)
}

export function normalizeNotebooks(value: unknown): Notebook[] {
  if (!Array.isArray(value)) return [blankNotebook()]
  const notebooks = value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const row = item as Partial<Notebook>
    const cards = Array.isArray(row.cards)
      ? row.cards
          .flatMap((card) => {
            const next = asCard(card)
            return next ? [next] : []
          })
          .slice(0, MAX_CARDS)
      : []
    return [{
      id: typeof row.id === "string" ? row.id : crypto.randomUUID(),
      title: typeof row.title === "string" && row.title.trim() ? row.title.slice(0, 120) : "Notebook",
      journal: typeof row.journal === "string" ? row.journal.slice(0, MAX_JOURNAL) : "",
      cards,
      links: asLinks(row.links, new Set(cards.map((card) => card.id))),
      lanes: asLanes(row.lanes),
      frames: asFrames(row.frames),
      pages: asWikiPages(row.pages),
      drawing: asDrawing(row.drawing),
    }]
  })
  return notebooks.length ? notebooks : [blankNotebook()]
}

function asDrawing(value: unknown): NotebookDrawing | undefined {
  if (!value || typeof value !== "object") return undefined
  const row = value as Partial<NotebookDrawing>
  if (!Array.isArray(row.elements)) return undefined
  const files =
    row.files && typeof row.files === "object"
      ? capDrawingFiles(row.files as Record<string, unknown>).files
      : undefined
  return {
    elements: row.elements.slice(0, 8_000),
    appState: row.appState && typeof row.appState === "object" ? (row.appState as Record<string, unknown>) : undefined,
    files,
  }
}

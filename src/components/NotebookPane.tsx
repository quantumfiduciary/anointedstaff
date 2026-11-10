import { useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Eraser,
  FileDown,
  FileText,
  FileUp,
  KanbanSquare,
  LayoutGrid,
  Library,
  MoreHorizontal,
  NotebookPen,
  PenLine,
  Pin,
  Plus,
  Quote,
  Share2,
  Sparkles,
  Table2,
  Trash2,
  Waypoints,
  X,
} from "lucide-react"
import { highlights, type Highlight } from "../types"
import { laneOf, pageOrder, parseTags, type NoteCard, type NoteLane, type Notebook } from "../notebooks"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Menu, MenuItem, MenuLabel, MenuSeparator, SubMenu } from "./ui/menu"
import { Tip } from "./ui/tip"
import { NoteBoard } from "./NoteBoard"
import { SketchBoard } from "./SketchBoard"
import { WikiPane } from "./WikiPane"

type BoardMode = "cards" | "draw"
const boardModeKey = "anointed-staff.boardmode"

function readBoardMode(): BoardMode {
  return localStorage.getItem(boardModeKey) === "draw" ? "draw" : "cards"
}

type View = "write" | "wiki" | "kanban" | "cards" | "table" | "canvas" | "page"

type NotebookPaneProps = {
  notebooks: Notebook[]
  activeId: string
  verseLabel: string | null
  verseText: string | null
  onPick: (id: string) => void
  onNew: () => void
  onAddExample?: () => void
  onTrash: () => void
  onSaveVerse: (tags: string[]) => void
  onAddNote: (text: string, lane: string, at?: { x: number; y: number }) => void
  onChange: (update: (notebook: Notebook) => Notebook) => void
  onColor: (cardId: string, color: Highlight | undefined) => void
  onOpen: (book: number, chapter: number, verse: number) => void
  onOpenScripture?: (book: number, chapter: number, verse: number | null) => void
  onGather: () => void
  onAsk: (command: string) => void
  onExportPdf: () => void
  onExportPack: () => void
  onImportPack: (file: File) => void
  onCopyMarkdown: () => void
  wikiFocusId?: string | null
  /** Force Notes view (e.g. write from Practice journal). */
  notesViewRequest?: string | null
  onNotesViewHandled?: () => void
}

const viewKey = "anointed-staff.noteview"
const views: { id: View; label: string; icon: typeof KanbanSquare; tip: string }[] = [
  { id: "write", label: "Write", icon: PenLine, tip: "A study journal for this notebook, with card notes underneath." },
  { id: "wiki", label: "Wiki", icon: Library, tip: "Markdown study pages with [[links]] to pages and verses." },
  { id: "page", label: "Page", icon: FileText, tip: "Read the notebook as a study: frames first, then loose cards." },
  { id: "kanban", label: "Kanban", icon: KanbanSquare, tip: "Lanes from To study to Applied. Drag cards between them. Click a card to edit its note." },
  { id: "cards", label: "Cards", icon: LayoutGrid, tip: "Every card with its topics, color, and annotation" },
  { id: "table", label: "Table", icon: Table2, tip: "One row per card. Edit the note in place." },
  { id: "canvas", label: "Board", icon: Waypoints, tip: "Cards board for stickies, or Draw for freehand sketching." },
]

function readView(): View {
  const saved = localStorage.getItem(viewKey)
  if (saved === "cards" || saved === "table" || saved === "canvas" || saved === "page" || saved === "write" || saved === "kanban" || saved === "wiki") return saved
  return "write"
}

function edit(cards: NoteCard[], id: string, patch: Partial<NoteCard>) {
  return cards.map((card) => (card.id === id ? { ...card, ...patch } : card))
}

export function NotebookPane({
  notebooks,
  activeId,
  verseLabel,
  verseText,
  onPick,
  onNew,
  onAddExample,
  onTrash,
  onSaveVerse,
  onAddNote,
  onChange,
  onColor,
  onOpen,
  onOpenScripture,
  onGather,
  onAsk,
  onExportPdf,
  onExportPack,
  onImportPack,
  onCopyMarkdown,
  wikiFocusId,
  notesViewRequest,
  onNotesViewHandled,
}: NotebookPaneProps) {
  const [draft, setDraft] = useState("")
  const [view, setView] = useState<View>(readView)
  const [boardMode, setBoardMode] = useState<BoardMode>(readBoardMode)
  const [topic, setTopic] = useState("all")
  const [search, setSearch] = useState("")
  const importField = useRef<HTMLInputElement>(null)
  const notebook = notebooks.find((item) => item.id === activeId) ?? notebooks[0]

  useEffect(() => localStorage.setItem(viewKey, view), [view])
  useEffect(() => localStorage.setItem(boardModeKey, boardMode), [boardMode])
  useEffect(() => {
    if (wikiFocusId) setView("wiki")
  }, [wikiFocusId])
  useEffect(() => {
    if (!notesViewRequest) return
    if (
      notesViewRequest === "write" ||
      notesViewRequest === "wiki" ||
      notesViewRequest === "kanban" ||
      notesViewRequest === "cards" ||
      notesViewRequest === "table" ||
      notesViewRequest === "canvas" ||
      notesViewRequest === "page"
    ) {
      setView(notesViewRequest)
    }
    onNotesViewHandled?.()
  }, [notesViewRequest, onNotesViewHandled])

  const needle = search.trim().toLowerCase()
  const shown = useMemo(() => {
    if (!notebook) return []
    return notebook.cards.filter(
      (card) =>
        (topic === "all" || card.tags.includes(topic)) &&
        (!needle ||
          `${card.label} ${card.text} ${card.annotation} ${card.tags.join(" ")} ${notebook.journal} ${(notebook.pages ?? []).map((page) => page.title).join(" ")}`
            .toLowerCase()
            .includes(needle)),
    )
  }, [notebook, topic, needle])
  if (!notebook) return null
  const topics = [...new Set(notebook.cards.flatMap((card) => card.tags))].sort()
  const listed = [...shown].sort((left, right) => Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)))
  const hasContent = Boolean(
    notebook.cards.length ||
      notebook.journal.trim() ||
      (notebook.pages ?? []).some((page) => page.body.trim()) ||
      (notebook.drawing?.elements?.length ?? 0) > 0,
  )

  const setTags = (id: string, tags: string[]) => onChange((page) => ({ ...page, cards: edit(page.cards, id, { tags }) }))
  const setNote = (id: string, annotation: string) => onChange((page) => ({ ...page, cards: edit(page.cards, id, { annotation }) }))
  const setJournal = (journal: string) => onChange((page) => ({ ...page, journal }))
  const togglePin = (id: string) => onChange((page) => ({ ...page, cards: page.cards.map((card) => (card.id === id ? { ...card, pinned: !card.pinned } : card)) }))
  const moveTo = (id: string, lane: string) => onChange((page) => ({ ...page, cards: edit(page.cards, id, { lane }) }))
  const remove = (id: string) =>
    onChange((page) => ({
      ...page,
      cards: page.cards.filter((card) => card.id !== id),
      links: page.links.filter((link) => link.from !== id && link.to !== id),
    }))

  function appendVerseToJournal() {
    if (!verseLabel || !verseText) return
    const block = `${verseLabel}\n${verseText}`
    setJournal(notebook.journal.trim() ? `${notebook.journal.trim()}\n\n${block}` : block)
  }

  return (
    <div className="notebook">
      <div className="notebook-bar">
        <label className="sr" htmlFor="notebook-pick">
          Notebook
        </label>
        <select id="notebook-pick" aria-label="Notebook" value={notebook.id} onChange={(event) => onPick(event.target.value)}>
          {notebooks.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} · {item.cards.length}
              {(item.pages?.length ?? 0) > 0 ? ` · ${item.pages!.length}p` : ""}
            </option>
          ))}
        </select>
        <Input aria-label="Notebook title" value={notebook.title} onChange={(event) => onChange((page) => ({ ...page, title: event.target.value }))} />
        <input
          ref={importField}
          type="file"
          accept="application/json,.json,.aswiki.json"
          className="sr"
          aria-label="Import study pack"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onImportPack(file)
            event.target.value = ""
          }}
        />
        <Menu label="Notebook" ariaLabel="Notebook menu" align="end" className="soft-menu">
          <MenuItem icon={<Plus size={14} />} onSelect={onNew}>
            New notebook
          </MenuItem>
          {onAddExample ? (
            <MenuItem icon={<Sparkles size={14} />} onSelect={onAddExample}>
              Add example notebook
            </MenuItem>
          ) : null}
          <MenuItem icon={<FileDown size={14} />} onSelect={onExportPdf} disabled={!hasContent}>
            Export as PDF
          </MenuItem>
          <MenuItem icon={<Share2 size={14} />} onSelect={onExportPack} disabled={!hasContent}>
            Export study pack
          </MenuItem>
          <MenuItem icon={<Copy size={14} />} onSelect={onCopyMarkdown} disabled={!hasContent}>
            Copy as markdown
          </MenuItem>
          <MenuItem icon={<FileUp size={14} />} onSelect={() => importField.current?.click()}>
            Import study pack
          </MenuItem>
          <MenuLabel>Work with the AI</MenuLabel>
          <MenuItem icon={<Sparkles size={14} />} onSelect={() => onAsk("Read my notebook cards beside this verse and say what they add.")} disabled={!notebook.cards.length && !(notebook.pages ?? []).length}>
            Study this notebook
          </MenuItem>
          <MenuItem icon={<Library size={14} />} onSelect={() => onAsk("ingest wiki")} disabled={!verseLabel}>
            Ingest open passage into wiki
          </MenuItem>
          <MenuItem icon={<Library size={14} />} onSelect={() => onAsk("Ask from my wiki pages what matters for this verse.")} disabled={!(notebook.pages ?? []).some((page) => page.body.trim())}>
            Ask the wiki
          </MenuItem>
          <MenuItem icon={<PenLine size={14} />} onSelect={() => onAsk("expand notes")} disabled={!notebook.cards.length}>
            Fill empty notes
          </MenuItem>
          <MenuItem icon={<Share2 size={14} />} onSelect={onGather} disabled={!hasContent}>
            Gather into the study
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash2 size={14} />} onSelect={onTrash} disabled={notebooks.length < 2}>
            Delete this notebook
          </MenuItem>
        </Menu>
      </div>
      {view === "canvas" || view === "wiki" ? null : (
        <div className="notebook-save">
          <b title={verseText ?? undefined}>{verseLabel ?? "No verse selected"}</b>
          <Input aria-label="Topics for this verse" value={draft} placeholder="Topics, separated by commas" onChange={(event) => setDraft(event.target.value)} />
          <Button
            type="button"
            onClick={() => {
              onSaveVerse(parseTags(draft))
              setDraft("")
            }}
            disabled={!verseText}
          >
            <NotebookPen />
            Save this verse
          </Button>
        </div>
      )}
      <div className="note-views">
        <div className="segmented" role="tablist" aria-label="Notebook view">
          {views.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              title={item.tip}
              aria-selected={view === item.id}
              onClick={() => setView(item.id)}
            >
              <item.icon size={15} />
              {item.label}
            </button>
          ))}
        </div>
        {view === "write" || view === "wiki" ? null : (
          <Input className="note-search" aria-label="Search the cards" value={search} placeholder="Search cards" onChange={(event) => setSearch(event.target.value)} />
        )}
      </div>
      {topics.length && view !== "write" && view !== "wiki" ? (
        <div className="topic-picks" aria-label="Topics">
          <button type="button" aria-pressed={topic === "all"} onClick={() => setTopic("all")}>
            All {notebook.cards.length}
          </button>
          {topics.map((item) => (
            <button key={item} type="button" aria-pressed={topic === item} onClick={() => setTopic(item)}>
              {item}
            </button>
          ))}
        </div>
      ) : null}
      {view === "write" ? (
        <NoteJournal
          notebook={notebook}
          cards={listed}
          verseReady={Boolean(verseLabel && verseText)}
          onJournal={setJournal}
          onAppendVerse={appendVerseToJournal}
          onNote={setNote}
          onOpen={onOpen}
        />
      ) : view === "wiki" ? (
        <WikiPane
          notebook={notebook}
          onChange={onChange}
          focusPageId={wikiFocusId}
          onOpenScripture={(book, chapter, verse) => {
            if (onOpenScripture) onOpenScripture(book, chapter, verse)
            else if (verse != null) onOpen(book, chapter, verse)
            else onOpen(book, chapter, 1)
          }}
        />
      ) : view === "kanban" ? (
        <Kanban
          notebook={notebook}
          cards={shown}
          onChange={onChange}
          onOpen={onOpen}
          onAddNote={onAddNote}
          onPin={togglePin}
          onRemove={remove}
          onNote={setNote}
          onColor={onColor}
          onTags={setTags}
        />
      ) : view === "page" ? (
        <NotePage notebook={notebook} cards={shown} onOpen={onOpen} onNote={setNote} />
      ) : view === "canvas" ? (
        <div className="board-shell">
          <div className="board-modes segmented" role="tablist" aria-label="Board mode">
            <button type="button" role="tab" aria-selected={boardMode === "cards"} onClick={() => setBoardMode("cards")}>
              Cards
            </button>
            <button type="button" role="tab" aria-selected={boardMode === "draw"} onClick={() => setBoardMode("draw")}>
              Draw
            </button>
          </div>
          {boardMode === "draw" ? (
            <SketchBoard notebook={notebook} onChange={onChange} />
          ) : (
            <NoteBoard
              notebook={notebook}
              cards={shown}
              onChange={onChange}
              onOpen={onOpen}
              onAddSticky={(x, y) => onAddNote("Write here", notebook.lanes[0]?.id ?? "study", { x, y })}
              onPin={togglePin}
              onRemove={remove}
            />
          )}
        </div>
      ) : notebook.cards.length === 0 ? (
        <div className="brand-empty-block">
          <img className="brand-empty" src="/brand/empty-notebook.png" alt="" width={160} height={160} />
          <p className="quiet">This notebook is empty. Save a verse, open Write for the journal, or add a note card on Kanban.</p>
          <div className="empty-actions">
            {onAddExample ? (
              <Button type="button" size="sm" onClick={onAddExample}>
                Add John 3 example
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="outline" onClick={() => setView("write")}>
              Write journal
            </Button>
          </div>
        </div>
      ) : shown.length === 0 ? (
        <p className="quiet">No card matches that topic or search.</p>
      ) : view === "table" ? (
        <table className="note-table">
          <thead>
            <tr>
              <th>Verse</th>
              <th>Lane</th>
              <th>Topics</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {listed.map((card) => (
              <tr key={card.id}>
                <td>
                  <button type="button" onClick={() => onOpen(card.book, card.chapter, card.verse)}>
                    {card.label}
                  </button>
                </td>
                <td>{notebook.lanes.find((lane) => lane.id === laneOf(card, notebook.lanes))?.title}</td>
                <td>{card.tags.join(", ") || "—"}</td>
                <td>
                  <textarea
                    value={card.annotation}
                    placeholder="Write a note"
                    aria-label={`Note for ${card.label}`}
                    onChange={(event) => setNote(card.id, event.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="note-canvas">
          {listed.map((card) => (
            <article key={card.id} className="note-card" data-color={card.color ?? "none"} data-pinned={card.pinned ? "true" : "false"}>
              <header>
                <button type="button" onClick={() => onOpen(card.book, card.chapter, card.verse)}>
                  {card.label}
                </button>
                <CardMenu card={card} lanes={notebook.lanes} onMove={moveTo} onPin={togglePin} onRemove={remove} />
              </header>
              <blockquote>{card.text}</blockquote>
              <div className="note-tags">
                {card.tags.map((tag) => (
                  <button key={tag} type="button" onClick={() => setTags(card.id, card.tags.filter((item) => item !== tag))} aria-label={`Remove topic ${tag}`}>
                    {tag} <X size={10} aria-hidden="true" />
                  </button>
                ))}
                <input
                  aria-label={`Add a topic to ${card.label}`}
                  placeholder="Add a topic"
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return
                    event.preventDefault()
                    setTags(card.id, parseTags(`${card.tags.join(",")},${event.currentTarget.value}`))
                    event.currentTarget.value = ""
                  }}
                />
              </div>
              <div className="swatches" role="group" aria-label={`Highlight ${card.label}`}>
                {highlights.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`swatch swatch-${item.id}`}
                    aria-label={`Highlight ${item.label}`}
                    aria-pressed={card.color === item.id}
                    onClick={() => onColor(card.id, card.color === item.id ? undefined : item.id)}
                  />
                ))}
              </div>
              <label>
                Annotation
                <textarea value={card.annotation} placeholder="Write beside this verse" aria-label={`Annotation for ${card.label}`} onChange={(event) => setNote(card.id, event.target.value)} />
              </label>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function NoteJournal({
  notebook,
  cards,
  verseReady,
  onJournal,
  onAppendVerse,
  onNote,
  onOpen,
}: {
  notebook: Notebook
  cards: NoteCard[]
  verseReady: boolean
  onJournal: (value: string) => void
  onAppendVerse: () => void
  onNote: (id: string, annotation: string) => void
  onOpen: (book: number, chapter: number, verse: number) => void
}) {
  const words = notebook.journal.trim() ? notebook.journal.trim().split(/\s+/).length : 0
  return (
    <div className="note-journal">
      <div className="note-journal-tools">
        <Tip content="Add the open verse into the journal">
          <Button type="button" size="sm" variant="outline" disabled={!verseReady} onClick={onAppendVerse}>
            <Quote size={14} /> Insert verse
          </Button>
        </Tip>
        <Tip content="Copy the journal">
          <Button type="button" size="sm" variant="outline" disabled={!notebook.journal.trim()} onClick={() => void navigator.clipboard?.writeText(notebook.journal)}>
            <Copy size={14} /> Copy
          </Button>
        </Tip>
        <Tip content="Clear the journal">
          <Button type="button" size="sm" variant="outline" disabled={!notebook.journal.trim()} onClick={() => onJournal("")}>
            <Eraser size={14} /> Clear
          </Button>
        </Tip>
        <span>
          {words} word{words === 1 ? "" : "s"}
        </span>
      </div>
      <div className="note-journal-editor-wrap">
        <p className="note-journal-label">
          <span>Journal</span>
          <span>Fills the space above card notes</span>
        </p>
        <textarea
          className="note-journal-editor"
          aria-label={`Journal for ${notebook.title}`}
          value={notebook.journal}
          placeholder="Write the study here. Save verses to cards below, or keep a freeform journal for this notebook."
          onChange={(event) => onJournal(event.target.value)}
        />
      </div>
      {cards.length ? (
        <div className="note-journal-cards" aria-label="Card notes">
          <p className="note-journal-label">
            <span>Card notes</span>
            <span>Scroll here · drag a note corner to expand it</span>
          </p>
          {cards.slice(0, 12).map((card) => (
            <article key={card.id}>
              <button type="button" onClick={() => onOpen(card.book, card.chapter, card.verse)}>
                {card.label}
              </button>
              <textarea
                value={card.annotation}
                placeholder="Card note"
                aria-label={`Note for ${card.label}`}
                onChange={(event) => onNote(card.id, event.target.value)}
              />
            </article>
          ))}
        </div>
      ) : (
        <p className="quiet note-journal-hint">Save a verse to keep card notes under the journal.</p>
      )}
    </div>
  )
}

function CardMenu({
  card,
  lanes,
  onMove,
  onPin,
  onRemove,
}: {
  card: NoteCard
  lanes: NoteLane[]
  onMove: (id: string, lane: string) => void
  onPin: (id: string) => void
  onRemove: (id: string) => void
}) {
  const here = laneOf(card, lanes)
  return (
    <Menu label={<MoreHorizontal size={15} />} caret={false} ariaLabel={`${card.label} options`} align="end" className="card-menu">
      <SubMenu label="Move to lane" icon={<ArrowRight size={14} />}>
        {lanes.map((lane) => (
          <MenuItem key={lane.id} disabled={lane.id === here} onSelect={() => onMove(card.id, lane.id)}>
            {lane.title}
          </MenuItem>
        ))}
      </SubMenu>
      <MenuItem icon={<Pin size={14} />} onSelect={() => onPin(card.id)}>
        {card.pinned ? "Unpin" : "Pin to the top"}
      </MenuItem>
      <MenuSeparator />
      <MenuItem icon={<Trash2 size={14} />} onSelect={() => onRemove(card.id)}>
        Remove card
      </MenuItem>
    </Menu>
  )
}

type KanbanProps = {
  notebook: Notebook
  cards: NoteCard[]
  onChange: (update: (notebook: Notebook) => Notebook) => void
  onOpen: (book: number, chapter: number, verse: number) => void
  onAddNote: (text: string, lane: string, at?: { x: number; y: number }) => void
  onPin: (id: string) => void
  onRemove: (id: string) => void
  onNote: (id: string, annotation: string) => void
  onColor: (cardId: string, color: Highlight | undefined) => void
  onTags: (id: string, tags: string[]) => void
}

type Columns = Record<string, string[]>

function columnsOf(cards: NoteCard[], lanes: NoteLane[]): Columns {
  const columns: Columns = Object.fromEntries(lanes.map((lane) => [lane.id, [] as string[]]))
  for (const card of cards) columns[laneOf(card, lanes)].push(card.id)
  return columns
}

function Kanban({ notebook, cards, onChange, onOpen, onAddNote, onPin, onRemove, onNote, onColor, onTags }: KanbanProps) {
  const lanes = notebook.lanes
  const base = useMemo(() => columnsOf(cards, lanes), [cards, lanes])
  const [columns, setColumns] = useState<Columns | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const live = columns ?? base
  const byId = useMemo(() => new Map(notebook.cards.map((card) => [card.id, card])), [notebook.cards])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  function laneFor(id: string, from: Columns) {
    if (id.startsWith("lane:")) return id.slice(5)
    return Object.keys(from).find((lane) => from[lane].includes(id)) ?? null
  }

  function commit(next: Columns) {
    onChange((page) => {
      const placed = new Map<string, string>()
      const order: string[] = []
      for (const lane of page.lanes) {
        for (const id of next[lane.id] ?? []) {
          placed.set(id, lane.id)
          order.push(id)
        }
      }
      const moved = order.flatMap((id) => {
        const card = page.cards.find((item) => item.id === id)
        return card ? [{ ...card, lane: placed.get(id) }] : []
      })
      return { ...page, cards: [...moved, ...page.cards.filter((card) => !placed.has(card.id))] }
    })
  }

  function onDragStart(event: DragStartEvent) {
    setActive(String(event.active.id))
    setColumns(base)
  }

  function onDragOver(event: DragOverEvent) {
    const over = event.over ? String(event.over.id) : null
    if (!over) return
    const id = String(event.active.id)
    setColumns((current) => {
      const from = current ?? base
      const source = laneFor(id, from)
      const target = laneFor(over, from)
      if (!source || !target || source === target) return current
      const next = { ...from, [source]: from[source].filter((item) => item !== id) }
      const list = [...from[target]]
      const at = over.startsWith("lane:") ? list.length : Math.max(0, list.indexOf(over))
      list.splice(at, 0, id)
      next[target] = list
      return next
    })
  }

  function onDragEnd(event: DragEndEvent) {
    const id = String(event.active.id)
    const over = event.over ? String(event.over.id) : null
    const from = columns ?? base
    setActive(null)
    setColumns(null)
    if (!over) return
    const lane = laneFor(id, from)
    if (!lane) return
    let list = from[lane]
    if (!over.startsWith("lane:") && list.includes(over)) list = arrayMove(list, list.indexOf(id), list.indexOf(over))
    commit({ ...from, [lane]: list })
  }

  function renameLane(id: string, title: string) {
    onChange((page) => ({ ...page, lanes: page.lanes.map((lane) => (lane.id === id ? { ...lane, title: title.slice(0, 40) } : lane)) }))
  }

  function shiftLane(id: string, step: -1 | 1) {
    onChange((page) => {
      const at = page.lanes.findIndex((lane) => lane.id === id)
      const to = at + step
      if (at < 0 || to < 0 || to >= page.lanes.length) return page
      return { ...page, lanes: arrayMove(page.lanes, at, to) }
    })
  }

  function dropLane(id: string) {
    onChange((page) => {
      if (page.lanes.length < 2) return page
      const rest = page.lanes.filter((lane) => lane.id !== id)
      return { ...page, lanes: rest, cards: page.cards.map((card) => (card.lane === id ? { ...card, lane: rest[0].id } : card)) }
    })
  }

  function addLane() {
    onChange((page) => (page.lanes.length >= 8 ? page : { ...page, lanes: [...page.lanes, { id: crypto.randomUUID().slice(0, 8), title: "New lane" }] }))
  }

  const dragged = active ? byId.get(active) : undefined

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => { setActive(null); setColumns(null) }}>
      <div className="kanban">
        {lanes.map((lane, index) => (
          <Lane
            key={lane.id}
            lane={lane}
            ids={live[lane.id] ?? []}
            byId={byId}
            first={index === 0}
            last={index === lanes.length - 1}
            single={lanes.length < 2}
            openId={openId}
            onOpenCard={setOpenId}
            onRename={renameLane}
            onShift={shiftLane}
            onDrop={dropLane}
            onOpen={onOpen}
            onAddNote={onAddNote}
            onPin={onPin}
            onRemove={onRemove}
            onNote={onNote}
            onColor={onColor}
            onTags={onTags}
            lanes={lanes}
            onMove={(cardId, laneId) => onChange((page) => ({ ...page, cards: edit(page.cards, cardId, { lane: laneId }) }))}
          />
        ))}
        {lanes.length < 8 ? (
          <button type="button" className="lane-add" onClick={addLane}>
            <Plus size={16} /> Add a lane
          </button>
        ) : null}
      </div>
      <DragOverlay dropAnimation={{ duration: 160, easing: "ease-out" }}>{dragged ? <KanbanCardFace card={dragged} lifted /> : null}</DragOverlay>
    </DndContext>
  )
}

type LaneProps = {
  lane: NoteLane
  lanes: NoteLane[]
  ids: string[]
  byId: Map<string, NoteCard>
  first: boolean
  last: boolean
  single: boolean
  openId: string | null
  onOpenCard: (id: string | null) => void
  onRename: (id: string, title: string) => void
  onShift: (id: string, step: -1 | 1) => void
  onDrop: (id: string) => void
  onOpen: (book: number, chapter: number, verse: number) => void
  onAddNote: (text: string, lane: string, at?: { x: number; y: number }) => void
  onPin: (id: string) => void
  onRemove: (id: string) => void
  onNote: (id: string, annotation: string) => void
  onColor: (cardId: string, color: Highlight | undefined) => void
  onTags: (id: string, tags: string[]) => void
  onMove: (cardId: string, laneId: string) => void
}

function Lane({
  lane,
  lanes,
  ids,
  byId,
  first,
  last,
  single,
  openId,
  onOpenCard,
  onRename,
  onShift,
  onDrop,
  onOpen,
  onAddNote,
  onPin,
  onRemove,
  onNote,
  onColor,
  onTags,
  onMove,
}: LaneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `lane:${lane.id}` })
  const [note, setNoteDraft] = useState("")
  return (
    <section className="lane" data-over={isOver ? "true" : "false"} aria-label={lane.title}>
      <header>
        <input className="lane-title" aria-label="Lane title" value={lane.title} onChange={(event) => onRename(lane.id, event.target.value)} />
        <span className="lane-count">{ids.length}</span>
        <Menu label={<MoreHorizontal size={15} />} caret={false} ariaLabel={`${lane.title} lane options`} align="end" className="card-menu">
          <MenuItem icon={<ArrowLeft size={14} />} disabled={first} onSelect={() => onShift(lane.id, -1)}>
            Move left
          </MenuItem>
          <MenuItem icon={<ArrowRight size={14} />} disabled={last} onSelect={() => onShift(lane.id, 1)}>
            Move right
          </MenuItem>
          <MenuSeparator />
          <MenuLabel>Its cards go to the first lane</MenuLabel>
          <MenuItem icon={<Trash2 size={14} />} disabled={single} onSelect={() => onDrop(lane.id)}>
            Delete lane
          </MenuItem>
        </Menu>
      </header>
      <SortableContext id={lane.id} items={ids} strategy={verticalListSortingStrategy}>
        <div className="lane-body" ref={setNodeRef}>
          {ids.map((id) => {
            const card = byId.get(id)
            return card ? (
              <KanbanCard
                key={id}
                card={card}
                lanes={lanes}
                open={openId === id}
                onToggle={() => onOpenCard(openId === id ? null : id)}
                onOpen={onOpen}
                onPin={onPin}
                onRemove={onRemove}
                onMove={onMove}
                onNote={onNote}
                onColor={onColor}
                onTags={onTags}
              />
            ) : null
          })}
          {ids.length === 0 ? <p className="lane-empty">Drop a card here · or open Write to add a note</p> : null}
        </div>
      </SortableContext>
      <form
        className="lane-note"
        onSubmit={(event) => {
          event.preventDefault()
          const text = note.trim()
          if (!text) return
          onAddNote(text, lane.id)
          setNoteDraft("")
        }}
      >
        <input value={note} aria-label={`Add a note to ${lane.title}`} placeholder="Add a note card" onChange={(event) => setNoteDraft(event.target.value)} />
      </form>
    </section>
  )
}

function KanbanCardFace({ card, lifted = false }: { card: NoteCard; lifted?: boolean }) {
  return (
    <div className="kanban-face" data-lifted={lifted ? "true" : "false"} data-color={card.color ?? "none"}>
      <b>{card.label}</b>
      <p>{card.annotation || card.text}</p>
      {card.tags.length ? (
        <span className="kanban-tags">
          {card.tags.map((tag) => (
            <i key={tag}>{tag}</i>
          ))}
        </span>
      ) : null}
    </div>
  )
}

function KanbanCard({
  card,
  lanes,
  open,
  onToggle,
  onOpen,
  onPin,
  onRemove,
  onMove,
  onNote,
  onColor,
  onTags,
}: {
  card: NoteCard
  lanes: NoteLane[]
  open: boolean
  onToggle: () => void
  onOpen: (book: number, chapter: number, verse: number) => void
  onPin: (id: string) => void
  onRemove: (id: string) => void
  onMove: (cardId: string, laneId: string) => void
  onNote: (id: string, annotation: string) => void
  onColor: (cardId: string, color: Highlight | undefined) => void
  onTags: (id: string, tags: string[]) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id, disabled: open })
  return (
    <article
      ref={setNodeRef}
      className="kanban-card"
      data-pinned={card.pinned ? "true" : "false"}
      data-dragging={isDragging ? "true" : "false"}
      data-color={card.color ?? "none"}
      data-open={open ? "true" : "false"}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...(open ? {} : listeners)}
    >
      <header>
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onOpen(card.book, card.chapter, card.verse)}>
          {card.label}
        </button>
        {card.pinned ? <Pin size={12} aria-label="Pinned" /> : null}
        <span onPointerDown={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
          <CardMenu card={card} lanes={lanes} onMove={onMove} onPin={onPin} onRemove={onRemove} />
        </span>
      </header>
      {open ? (
        <div className="card-editor" onPointerDown={(event) => event.stopPropagation()}>
          {card.kind !== "note" && card.text ? <blockquote>{card.text}</blockquote> : null}
          <textarea
            value={card.annotation}
            placeholder="Write a note on this card"
            aria-label={`Note for ${card.label}`}
            autoFocus
            onChange={(event) => onNote(card.id, event.target.value)}
          />
          <div className="note-tags">
            {card.tags.map((tag) => (
              <button key={tag} type="button" onClick={() => onTags(card.id, card.tags.filter((item) => item !== tag))} aria-label={`Remove topic ${tag}`}>
                {tag} <X size={10} aria-hidden="true" />
              </button>
            ))}
            <input
              aria-label={`Add a topic to ${card.label}`}
              placeholder="Add a topic"
              onKeyDown={(event) => {
                if (event.key !== "Enter") return
                event.preventDefault()
                onTags(card.id, parseTags(`${card.tags.join(",")},${event.currentTarget.value}`))
                event.currentTarget.value = ""
              }}
            />
          </div>
          <div className="swatches" role="group" aria-label={`Highlight ${card.label}`}>
            {highlights.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`swatch swatch-${item.id}`}
                aria-label={`Highlight ${item.label}`}
                aria-pressed={card.color === item.id}
                onClick={() => onColor(card.id, card.color === item.id ? undefined : item.id)}
              />
            ))}
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onToggle}>
            Done
          </Button>
        </div>
      ) : (
        <button type="button" className="kanban-open" onPointerDown={(event) => event.stopPropagation()} onClick={onToggle}>
          <p>{card.annotation || card.text || "Click to write a note"}</p>
          {card.tags.length ? (
            <span className="kanban-tags">
              {card.tags.map((tag) => (
                <i key={tag}>{tag}</i>
              ))}
            </span>
          ) : null}
        </button>
      )}
    </article>
  )
}

function NotePage({
  notebook,
  cards,
  onOpen,
  onNote,
}: {
  notebook: Notebook
  cards: NoteCard[]
  onOpen: (book: number, chapter: number, verse: number) => void
  onNote: (id: string, annotation: string) => void
}) {
  const shown = new Set(cards.map((card) => card.id))
  const { groups, loose } = pageOrder({ ...notebook, cards: notebook.cards.filter((card) => shown.has(card.id)) })
  if (!cards.length && !notebook.journal.trim()) return <p className="quiet">Save a verse or write in the journal, then read it here as a study.</p>
  return (
    <article className="note-page">
      <header>
        <h2>{notebook.title}</h2>
        <p>The same cards as the board, in reading order: each frame, then cards that sit outside a frame.</p>
      </header>
      {notebook.journal.trim() ? (
        <section className="page-journal">
          <h3>Journal</h3>
          <pre>{notebook.journal}</pre>
        </section>
      ) : null}
      {groups.map(({ frame, cards: inFrame }) =>
        inFrame.length ? (
          <section key={frame.id}>
            <h3>{frame.title}</h3>
            {inFrame.map((card) => (
              <PageCard key={card.id} card={card} onOpen={onOpen} onNote={onNote} />
            ))}
          </section>
        ) : null,
      )}
      {loose.length ? (
        <section>
          {groups.some((group) => group.cards.length) ? <h3>Beside the frames</h3> : null}
          {loose.map((card) => (
            <PageCard key={card.id} card={card} onOpen={onOpen} onNote={onNote} />
          ))}
        </section>
      ) : null}
    </article>
  )
}

function PageCard({
  card,
  onOpen,
  onNote,
}: {
  card: NoteCard
  onOpen: (book: number, chapter: number, verse: number) => void
  onNote: (id: string, annotation: string) => void
}) {
  return (
    <div className="page-card" data-kind={card.kind ?? "verse"}>
      <button type="button" onClick={() => (card.kind === "note" ? undefined : onOpen(card.book, card.chapter, card.verse))}>
        {card.label}
      </button>
      {card.kind !== "note" ? <blockquote>{card.text}</blockquote> : null}
      <textarea value={card.annotation} placeholder="Write beside this verse" aria-label={`Annotation for ${card.label}`} onChange={(event) => onNote(card.id, event.target.value)} />
    </div>
  )
}

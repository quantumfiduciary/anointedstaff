import { useEffect, useMemo, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Bot, ChevronLeft, ChevronRight, Copy, FileDown, Hash, NotebookPen } from "lucide-react"
import { PracticeBedToggle } from "./PracticeBedToggle"
import { motionDuration, motionTokens } from "../lib/motionTokens"
import {
  searchWritings,
  shelfOf,
  writingShelves,
  type LibraryEntry,
  type Writing,
  type WritingSection,
  type WritingsLibrary,
} from "../library"
import { findPower, powersInText } from "../study/powers"
import { exportPdf, fileSafe } from "../pdf"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Menu, MenuItem, MenuSeparator } from "./ui/menu"
import { Tip } from "./ui/tip"

export { searchWritings }
export type { Writing, WritingSection, WritingsLibrary }

type WritingsPaneProps = {
  library: WritingsLibrary | null
  catalog?: LibraryEntry[]
  loadingId?: string | null
  query: string
  focus: { workId: string; section: number } | null
  verseLabel: string | null
  verseText: string | null
  onQuery: (value: string) => void
  onNeedWork?: (id: string) => void
  onAsk?: (prompt: string) => void
  onCopy?: (text: string) => void
  onSave?: (label: string, text: string, tags: string[]) => void
  onLookUp?: (query: string) => void
  onOpenRef?: (ref: string) => void
}

const placeKey = "anointed-staff.writings-place"

const shelves = writingShelves

function verseNeedle(text: string | null) {
  const words = [...new Set((text ?? "").toLowerCase().match(/[a-z]{6,}/g) ?? [])]
  return words[0] ?? ""
}

function readPlace(): { workId: string; section: number; size: number } {
  try {
    const saved = JSON.parse(localStorage.getItem(placeKey) ?? "{}") as Record<string, unknown>
    return {
      workId: typeof saved.workId === "string" ? saved.workId : "enoch",
      section: typeof saved.section === "number" ? saved.section : 0,
      size: typeof saved.size === "number" ? Math.min(1.5, Math.max(0.85, saved.size)) : 1,
    }
  } catch {
    return { workId: "enoch", section: 0, size: 1 }
  }
}

function Marked({ text, needle }: { text: string; needle: string }) {
  if (needle.length < 3) return <>{text}</>
  const lower = text.toLowerCase()
  const parts: ReactNode[] = []
  let from = 0
  let at = lower.indexOf(needle)
  while (at !== -1) {
    parts.push(text.slice(from, at), <mark key={at}>{text.slice(at, at + needle.length)}</mark>)
    from = at + needle.length
    at = lower.indexOf(needle, from)
  }
  parts.push(text.slice(from))
  return <>{parts}</>
}

export function WritingsPane({
  library,
  catalog = [],
  loadingId,
  query,
  focus,
  verseLabel,
  verseText,
  onQuery,
  onNeedWork,
  onAsk,
  onCopy,
  onSave,
  onLookUp,
  onOpenRef,
}: WritingsPaneProps) {
  const [saved] = useState(readPlace)
  const [workId, setWorkId] = useState(saved.workId)
  const [section, setSection] = useState(saved.section)
  const [size, setSize] = useState(saved.size)
  const [lastHit, setLastHit] = useState("")
  const [trail, setTrail] = useState<{ work: string; title: string; text: string; workId: string; section: number }[]>([])
  const [trailAt, setTrailAt] = useState(0)
  const [shelf, setShelf] = useState<(typeof shelves)[number]["id"]>("all")
  const reduce = useReducedMotion()
  const listed = (library?.works ?? []).filter((item) => shelf === "all" || shelfOf(item.id, item.shelf) === shelf)
  const pending = catalog.filter(
    (item) => (shelf === "all" || item.shelf === shelf) && !(library?.works ?? []).some((work) => work.id === item.id),
  )
  const namedPowers = findPower(query).slice(0, 4)
  const versePowers = powersInText(verseText ?? "")
  /** Stay inside the active shelf — do not fall back to another shelf's open book. */
  const work = listed.find((item) => item.id === workId) ?? listed[0]
  const current = work?.sections[Math.min(section, (work?.sections.length ?? 1) - 1)]
  const hits = useMemo(() => searchWritings(library, query, 12), [library, query])
  const needle = (query.trim() || lastHit).toLowerCase()
  const beside = verseNeedle(verseText)
  const selectId = work?.id ?? (pending.some((item) => item.id === workId) ? workId : pending[0]?.id ?? "")
  const shelfEmpty = listed.length === 0 && pending.length === 0

  useEffect(() => {
    if (!focus) return
    setWorkId(focus.workId)
    setSection(focus.section)
    setShelf(shelfOf(focus.workId, library?.works.find((item) => item.id === focus.workId)?.shelf))
  }, [focus])

  useEffect(() => {
    localStorage.setItem(placeKey, JSON.stringify({ workId, section, size }))
  }, [workId, section, size])

  useEffect(() => {
    const onListed = listed.some((item) => item.id === workId)
    const onPending = pending.some((item) => item.id === workId)
    if (onListed) return
    if (onPending) {
      onNeedWork?.(workId)
      return
    }
    const next = listed[0] ?? pending[0]
    if (!next) return
    setWorkId(next.id)
    setSection(0)
    if (pending.some((item) => item.id === next.id)) onNeedWork?.(next.id)
  }, [shelf, listed, pending, workId, onNeedWork])

  function openShelf(next: (typeof shelves)[number]["id"]) {
    setShelf(next)
    const nextListed = (library?.works ?? []).filter((item) => next === "all" || shelfOf(item.id, item.shelf) === next)
    const nextPending = catalog.filter(
      (item) => (next === "all" || item.shelf === next) && !(library?.works ?? []).some((work) => work.id === item.id),
    )
    const keep = nextListed.some((item) => item.id === workId) || nextPending.some((item) => item.id === workId)
    if (keep) {
      if (nextPending.some((item) => item.id === workId)) onNeedWork?.(workId)
      return
    }
    const pick = nextListed[0] ?? nextPending[0]
    if (!pick) return
    setWorkId(pick.id)
    setSection(0)
    if (nextPending.some((item) => item.id === pick.id)) onNeedWork?.(pick.id)
  }

  function exportSection() {
    if (!work || !current) return
    exportPdf(
      {
        title: current.title,
        subtitle: `${work.title} · extra-canonical`,
        sections: current.paragraphs.map((body) => ({ body })),
        footer: work.credit,
      },
      `${fileSafe(`${work.title}-${current.title}`)}.pdf`,
    )
  }

  function openHit(hit: (typeof hits)[number], list = hits, at = hits.findIndex((item) => item.workId === hit.workId && item.section === hit.section)) {
    setWorkId(hit.workId)
    setSection(hit.section)
    setShelf(shelfOf(hit.workId, library?.works.find((item) => item.id === hit.workId)?.shelf))
    setLastHit(query.trim() || lastHit)
    setTrail(list)
    setTrailAt(Math.max(0, at))
    onQuery("")
  }

  function stepHit(by: -1 | 1) {
    const next = trail[trailAt + by]
    if (!next) return
    setWorkId(next.workId)
    setSection(next.section)
    setShelf(shelfOf(next.workId, library?.works.find((item) => item.id === next.workId)?.shelf))
    setTrailAt(trailAt + by)
  }

  return (
    <div className="writings">
      <header className="lex-head">
        <p className="eyebrow">Extra-canon</p>
        <h2>Outside the Protestant canon</h2>
        <p className="quiet">
          Public-domain books beside Scripture: Enoch, Sophia, Gospels.net, Jasher, Yetzirah notes, Targum, Daemonologie, a Talmud map, and other canons. They are not the sixty-six. The Apocrypha already lives in the Bible window.
        </p>
        <div className="practice-voice-bar writings-bed-bar">
          <PracticeBedToggle
            kind="read"
            tipOn="Mute quiet music · soft instrumental under Extra-canon · local only"
            tipOff="Soft instrumental under Extra-canon · local only"
          />
          <small className="quiet">Optional quiet music under Extra-canon — local only.</small>
        </div>
      </header>
      <div className="work-shelves" role="tablist" aria-label="Shelf">
        {shelves.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={shelf === item.id} onClick={() => openShelf(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <label className="sr" htmlFor="writing-work">
        Extra-canonical work
      </label>
      <select
        id="writing-work"
        aria-label="Extra-canonical work"
        value={selectId}
        disabled={shelfEmpty}
        onChange={(event) => {
          const id = event.target.value
          setWorkId(id)
          setSection(0)
          onNeedWork?.(id)
        }}
      >
        {shelfEmpty ? <option value="">No books on this shelf</option> : null}
        {listed.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
        {pending.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title} (open)
          </option>
        ))}
      </select>
      <label className="sr" htmlFor="writings-search">
        Search extra-canonical books
      </label>
      <Input
        id="writings-search"
        className="my-3"
        value={query}
        placeholder="Search Enoch, Jasher, Yetzirah, Targum, or Thomas"
        onChange={(event) => onQuery(event.target.value)}
      />
      <div className="gem-actions writing-tools">
        {beside ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onQuery(beside)}>
            Beside {verseLabel ?? "this verse"}
          </Button>
        ) : null}
        {query.trim().length >= 3 && onLookUp ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onLookUp(query.trim())}>
            <Hash />
            Strong's
          </Button>
        ) : null}
      </div>
      {!library ? <p className="quiet">Opening the extra-canonical library…</p> : null}
      {loadingId ? <p className="quiet">Opening {catalog.find((item) => item.id === loadingId)?.title ?? loadingId}…</p> : null}
      {versePowers.length ? (
        <div className="strong-verse" role="group" aria-label="Names in this verse">
          <span className="strong-label">Names</span>
          {versePowers.map((item) => (
            <button key={item.id} type="button" className="chip" onClick={() => onQuery(item.name)}>
              {item.name}
            </button>
          ))}
        </div>
      ) : null}
      {namedPowers.length ? (
        <ul className="strong-hits">
          {namedPowers.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => (item.strong && onLookUp ? onLookUp(item.strong) : onQuery(item.name))}>
                <b>{item.name}</b>
                <span>{item.refs[0]}</span>
                <small>{item.note}</small>
              </button>
              {onOpenRef ? (
                <button type="button" className="link-btn" onClick={() => onOpenRef(item.refs[0])}>
                  {item.refs[0]}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {hits.length > 0 ? (
        <ul className="strong-hits">
          {hits.map((hit) => (
            <li key={`${hit.workId}-${hit.section}`}>
              <button type="button" onClick={() => openHit(hit)}>
                <b>{hit.work}</b>
                <span>{hit.title}</span>
                <small>
                  <Marked text={hit.text} needle={needle} />
                </small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {work && current ? (
        <article className="writing-sheet">
          <div className="writing-nav" role="navigation" aria-label="Section">
            <Button type="button" variant="outline" className="writing-nav-btn" disabled={section === 0} onClick={() => setSection((value) => value - 1)}>
              <ChevronLeft size={18} />
              Previous
            </Button>
            <select className="writing-nav-select" aria-label="Section" value={section} onChange={(event) => setSection(Number(event.target.value))}>
              {work.sections.map((item, index) => (
                <option key={item.title} value={index}>
                  {item.title}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              className="writing-nav-btn"
              disabled={section >= work.sections.length - 1}
              onClick={() => setSection((value) => value + 1)}
            >
              Next
              <ChevronRight size={18} />
            </Button>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${work.id}-${section}`}
              className="writing-turn"
              initial={{ opacity: 0, y: reduce ? 0 : motionTokens.distance.sm }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -motionTokens.distance.sm }}
              transition={{ duration: motionDuration("fast", !!reduce), ease: motionTokens.easing.smooth }}
            >
          <div className="writing-head">
            <h2>{current.title}</h2>
            <span className="writing-count">
              {section + 1} of {work.sections.length}
              {trail.length > 1 ? ` · hit ${trailAt + 1} of ${trail.length}` : ""}
            </span>
          </div>
          <div className="gem-actions writing-tools">
            {onAsk ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const body = current.paragraphs.join("\n\n").slice(0, 2200)
                  const more = current.paragraphs.join("\n\n").length > 2200 ? "\n…" : ""
                  onAsk(
                    [
                      `What does "${current.title}" in ${work.title} teach, and how does it sit beside Scripture${verseLabel ? ` and ${verseLabel}` : ""}? Treat this as extra-canonical, not as the sixty-six.`,
                      "",
                      `Attached extra-canon (${work.title} · ${current.title}):`,
                      body + more,
                    ].join("\n"),
                  )
                }}
              >
                <Bot />
                Ask about this
              </Button>
            ) : null}
            {onSave ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onSave(
                    `${work.title} · ${current.title}`,
                    `${work.title} · ${current.title}\n\n${current.paragraphs.join("\n\n")}${verseLabel ? `\n\nRead beside ${verseLabel}` : ""}`,
                    ["extra-canon", shelfOf(work.id, work.shelf)],
                  )
                }
              >
                <NotebookPen />
                Save to notes
              </Button>
            ) : null}
            <Menu label="Section" ariaLabel="Section actions">
              {onCopy ? (
                <MenuItem icon={<Copy size={14} />} onSelect={() => onCopy(`${work.title} · ${current.title}\n\n${current.paragraphs.join("\n\n")}`)}>
                  Copy the section
                </MenuItem>
              ) : null}
              <MenuItem icon={<FileDown size={14} />} onSelect={exportSection}>
                Export as PDF
              </MenuItem>
              {trail.length > 1 ? (
                <>
                  <MenuSeparator />
                  <MenuItem disabled={trailAt === 0} onSelect={() => stepHit(-1)}>
                    Previous hit
                  </MenuItem>
                  <MenuItem disabled={trailAt >= trail.length - 1} onSelect={() => stepHit(1)}>
                    Next hit
                  </MenuItem>
                </>
              ) : null}
              {lastHit ? (
                <>
                  <MenuSeparator />
                  <MenuItem
                    onSelect={() => {
                      setLastHit("")
                      setTrail([])
                    }}
                  >
                    Clear the highlight
                  </MenuItem>
                </>
              ) : null}
            </Menu>
            <Tip content="Smaller text">
              <button type="button" className="icon-btn" aria-label="Smaller text" disabled={size <= 0.85} onClick={() => setSize((value) => Math.max(0.85, +(value - 0.1).toFixed(2)))}>
                A−
              </button>
            </Tip>
            <span className="scale-value" aria-live="polite">
              {Math.round(size * 100)}%
            </span>
            <Tip content="Larger text">
              <button type="button" className="icon-btn" aria-label="Larger text" disabled={size >= 1.5} onClick={() => setSize((value) => Math.min(1.5, +(value + 0.1).toFixed(2)))}>
                A+
              </button>
            </Tip>
          </div>
          <div className="writing-body" style={{ ["--reader-scale" as string]: String(size) }}>
            {current.paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 32)}`}>
                <Marked text={paragraph} needle={needle} />
              </p>
            ))}
          </div>
          <p className="rights">{work.credit}</p>
            </motion.div>
          </AnimatePresence>
        </article>
      ) : shelfEmpty ? (
        <p className="quiet">No books on this shelf yet.</p>
      ) : pending[0] ? (
        <div className="writing-sheet brand-empty-block">
          <p className="quiet m-0">
            {loadingId === (workId || pending[0].id)
              ? `Opening ${catalog.find((item) => item.id === loadingId)?.title ?? loadingId}…`
              : `${pending.find((item) => item.id === workId)?.title ?? pending[0].title} opens from the shelf catalog.`}
          </p>
          <Button
            type="button"
            onClick={() => {
              const id = workId && pending.some((item) => item.id === workId) ? workId : pending[0].id
              setWorkId(id)
              setSection(0)
              onNeedWork?.(id)
            }}
            disabled={Boolean(loadingId)}
          >
            Open {pending.find((item) => item.id === workId)?.title ?? pending[0].title}
          </Button>
        </div>
      ) : null}
      <p className="rights">
        Extra-canonical public-domain editions and original desk notes. 1 Enoch is Charles 1913. Hurtak, Howard, Brill, Laitman, and the 1990 Book of Mormon edition are not shipped. Search from here, from Strong's, or from the study chat.
      </p>
    </div>
  )
}

import { Fragment, useEffect, useRef, useState } from "react"
import { Bookmark, BookmarkCheck, Bot, Calculator, ChevronDown, Copy, GitBranch, Hash, Link2, NotebookPen, Plus, ScrollText, StickyNote } from "lucide-react"
import { parseStrongText } from "../strongs"
import { highlights, type Highlight } from "../types"
import { Menu, MenuItem, MenuLabel } from "./ui/menu"
import { Pop, PopClose, Tip } from "./ui/tip"

export type ReaderVerse = {
  n: number
  primary: string
  compare?: string
  compareLabel?: string
  color?: Highlight
  bookmarked: boolean
  noted: boolean
  selected: boolean
  heading?: string
  markup?: string
  original?: string | null
}

export type VerseActions = {
  note: string
  onColor: (color: Highlight | undefined) => void
  onBookmark: () => void
  onNote: (note: string) => void
  onCopy: () => void
  onSave: () => void
  onAsk: () => void
  onCount: () => void
  onStrongs?: () => void
  onRoots?: () => void
  onOutside?: () => void
}

type ReaderProps = {
  bookName: string
  blurb: string
  chapterNumber: number
  chapterCount: number
  verses: ReaderVerse[]
  scale: number
  previousLabel: string | null
  nextLabel: string | null
  status: string | null
  /** True while scripture.json is still downloading. */
  libraryLoading?: boolean
  onRetryLibrary?: () => void
  layoutKey: string
  showStrongs?: boolean
  onChapter: (chapterIndex: number) => void
  onVerse: (verseIndex: number) => void
  onStrong?: (id: string) => void
  onPrevious: () => void
  onNext: () => void
  onBack?: () => void
  canGoBack?: boolean
  onScale: (direction: -1 | 1) => void
  links?: readonly string[]
  onOpenLink?: (reference: string) => void
  alternates?: { id: string; label: string }[]
  onAlternate?: (id: string) => void
  todayLabel?: string | null
  onOpenToday?: () => void
  recent?: string[]
  onOpenRecent?: (reference: string) => void
  bookmarks?: string[]
  onOpenBookmark?: (reference: string) => void
  originalNote?: string | null
  actions?: VerseActions
}

function NoteEditor({ note, onNote }: { note: string; onNote: (note: string) => void }) {
  const [draft, setDraft] = useState(note)
  useEffect(() => setDraft(note), [note])
  return (
    <div className="verse-note">
      <label htmlFor="verse-note-text">Note on this verse</label>
      <textarea id="verse-note-text" value={draft} autoFocus placeholder="Write what you see here" onChange={(event) => setDraft(event.target.value)} />
      <div>
        <PopClose asChild>
          <button type="button" onClick={() => onNote(draft)}>
            Keep the note
          </button>
        </PopClose>
        {note ? (
          <PopClose asChild>
            <button type="button" className="quiet-btn" onClick={() => onNote("")}>
              Clear
            </button>
          </PopClose>
        ) : null}
      </div>
    </div>
  )
}

export function Reader({
  bookName,
  blurb,
  chapterNumber,
  chapterCount,
  verses,
  scale,
  previousLabel,
  nextLabel,
  status,
  libraryLoading = false,
  onRetryLibrary,
  layoutKey,
  showStrongs = false,
  onChapter,
  onVerse,
  onStrong,
  onPrevious,
  onNext,
  onBack,
  canGoBack = false,
  onScale,
  links = [],
  onOpenLink,
  alternates = [],
  onAlternate,
  todayLabel,
  onOpenToday,
  recent = [],
  onOpenRecent,
  bookmarks = [],
  onOpenBookmark,
  originalNote,
  actions,
}: ReaderProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [chaptersOpen, setChaptersOpen] = useState(false)
  const selected = verses.find((verse) => verse.selected)?.n ?? 0
  const selectedVerse = verses.find((verse) => verse.selected)

  useEffect(() => {
    const root = scroller.current
    if (!root) return
    const measure = () => {
      const room = root.scrollHeight - root.clientHeight
      setProgress(room > 0 ? Math.min(1, root.scrollTop / room) : 0)
    }
    measure()
    root.addEventListener("scroll", measure, { passive: true })
    return () => root.removeEventListener("scroll", measure)
  }, [bookName, chapterNumber, verses.length])

  useEffect(() => {
    const root = scroller.current
    if (!root) return
    let frame = 0
    let tries = 0
    const align = () => {
      const selectedVerse = root.querySelector<HTMLElement>("[data-selected='true']")
      if (root.clientHeight === 0 || !selectedVerse) {
        if (!selectedVerse && root.clientHeight > 0 && tries === 0) root.scrollTop = 0
        if (tries++ < 10) frame = requestAnimationFrame(align)
        return
      }
      const current = root.querySelector<HTMLElement>("[data-selected='true']")
      if (!current) return
      const verseBox = current.getBoundingClientRect()
      const frameBox = root.getBoundingClientRect()
      if (verseBox.height === 0 && tries++ < 10) {
        frame = requestAnimationFrame(align)
        return
      }
      if (verseBox.top < frameBox.top + 72 || verseBox.bottom > frameBox.bottom - 12) {
        const delta = verseBox.top - frameBox.top
        root.scrollTop = root.scrollTop + delta - root.clientHeight / 2 + current.clientHeight / 2
      }
    }
    frame = requestAnimationFrame(align)
    return () => cancelAnimationFrame(frame)
  }, [bookName, chapterNumber, selected, layoutKey])

  return (
    <div className="reader" ref={scroller}>
      <div className="reader-tools">
        <div className="chapter-nav">
          <Tip content="Back to the last place" keys="Alt ←">
            <button type="button" className="nav-back" onClick={onBack} disabled={!canGoBack}>
              Back
            </button>
          </Tip>
          <Tip content="Previous chapter" keys="←">
            <button type="button" onClick={onPrevious} disabled={!previousLabel}>
              {previousLabel ? `‹ ${previousLabel}` : "Previous"}
            </button>
          </Tip>
          <Pop
            open={chaptersOpen}
            onOpenChange={setChaptersOpen}
            className="chapter-pop"
            trigger={
              <button type="button" className="chapter-pick" aria-label={`Choose a chapter of ${bookName}`} disabled={chapterCount === 0}>
                {bookName} {chapterNumber}
                <ChevronDown size={14} aria-hidden="true" />
              </button>
            }
          >
            <b>{bookName}</b>
            <div className="chapters" role="navigation" aria-label={`${bookName} chapters`}>
              {Array.from({ length: chapterCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-current={index + 1 === chapterNumber ? "page" : undefined}
                  onClick={() => {
                    onChapter(index)
                    setChaptersOpen(false)
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </Pop>
          <Tip content="Next chapter" keys="→">
            <button type="button" onClick={onNext} disabled={!nextLabel}>
              {nextLabel ? `${nextLabel} ›` : "Next"}
            </button>
          </Tip>
          <div className="scale" aria-label="Text size">
            <Tip content="Smaller text">
              <button type="button" onClick={() => onScale(-1)} aria-label="Smaller text" disabled={scale <= 0.85}>
                A−
              </button>
            </Tip>
            <span className="scale-value" aria-live="polite">
              {Math.round(scale * 100)}%
            </span>
            <Tip content="Larger text">
              <button type="button" onClick={() => onScale(1)} aria-label="Larger text" disabled={scale >= 1.4}>
                A+
              </button>
            </Tip>
          </div>
          {todayLabel && onOpenToday ? (
            <Tip content="Today's passage from the year plan">
              <button type="button" className="nav-today" onClick={onOpenToday}>
                Today
              </button>
            </Tip>
          ) : null}
          {bookmarks.length && onOpenBookmark ? (
            <Menu
              label={
                <>
                  <BookmarkCheck size={14} /> Kept
                </>
              }
              ariaLabel="Bookmarked verses"
              align="end"
              className="soft-menu"
            >
              <MenuLabel>Bookmarks</MenuLabel>
              {bookmarks.map((ref) => (
                <MenuItem key={ref} onSelect={() => onOpenBookmark(ref)}>
                  {ref}
                </MenuItem>
              ))}
            </Menu>
          ) : null}
        </div>
        {recent.length && onOpenRecent ? (
          <div className="reader-recent" aria-label="Recent reading">
            <span>Recent</span>
            {recent.map((ref) => (
              <button key={ref} type="button" onClick={() => onOpenRecent(ref)}>
                {ref}
              </button>
            ))}
          </div>
        ) : null}
        <div className="read-progress" aria-hidden="true">
          <i style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
      <article className="passage-wrap" style={{ ["--reader-scale" as string]: String(scale) }}>
        <header className="passage-head">
          <p>{bookName}</p>
          <h1>Chapter {chapterNumber}</h1>
          {blurb ? <p className="blurb">{blurb}</p> : null}
          {originalNote ? <p className="original-note">{originalNote}</p> : null}
          {selectedVerse ? null : <p className="reader-hint">Select a verse to highlight it, write a note, save it to a notebook, or ask the AI.</p>}
        </header>
        {verses.length === 0 ? (
          <div className="empty" data-state={status ? "error" : libraryLoading ? "loading" : "empty"}>
            {libraryLoading && !status ? (
              <>
                <p className="library-loading-title">Opening the Scripture library</p>
                <p className="quiet">About 25 MB downloads once per visit — the chapter appears when it is ready.</p>
                <div className="library-progress" aria-hidden="true">
                  <i />
                </div>
              </>
            ) : (
              <p>{status ?? "This chapter is empty."}</p>
            )}
            {status && onRetryLibrary ? (
              <div className="empty-actions">
                <button type="button" onClick={onRetryLibrary}>
                  Retry library
                </button>
              </div>
            ) : null}
            {alternates.length ? (
              <div className="empty-actions">
                {alternates.map((item) => (
                  <button key={item.id} type="button" onClick={() => onAlternate?.(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="passage">
            {verses.map((verse, index) => (
              <Fragment key={verse.n}>
                {verse.heading ? <h2 className="pericope">{verse.heading}</h2> : null}
                <div
                  role="button"
                  tabIndex={0}
                  id={`verse-${verse.n}`}
                  className="verse"
                  data-selected={verse.selected ? "true" : "false"}
                  data-color={verse.color ?? "none"}
                  onClick={() => onVerse(index)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      onVerse(index)
                    }
                  }}
                >
                  <span className="verse-no">
                    {verse.bookmarked ? <i className="ribbon" aria-hidden="true" /> : null}
                    {verse.noted && !verse.bookmarked ? <i className="note-dot" aria-hidden="true" /> : null}
                    {verse.n}
                  </span>
                  <span className="verse-body">
                    <span>
                      {showStrongs && verse.markup
                        ? parseStrongText(verse.markup).map((part, partIndex) =>
                            part.strong ? (
                              <span key={`${verse.n}-${partIndex}`}>
                                {part.text}
                                <button
                                  type="button"
                                  className="strong-num"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    onVerse(index)
                                    onStrong?.(part.strong!)
                                  }}
                                >
                                  {part.strong}
                                </button>
                              </span>
                            ) : (
                              <span key={`${verse.n}-${partIndex}`}>{part.text}</span>
                            ),
                          )
                        : verse.primary}
                    </span>
                    {verse.original ? <span className="original">{verse.original}</span> : null}
                    {verse.compare ? (
                      <span className="compare">
                        <b>{verse.compareLabel}</b>
                        {verse.compare}
                      </span>
                    ) : null}
                  </span>
                </div>
                {verse.selected && actions ? (
                  <div className="verse-bar" role="toolbar" aria-label={`Verse ${verse.n} actions`}>
                    <span className="verse-swatches" role="group" aria-label="Highlight">
                      {highlights.map((item) => (
                        <Tip key={item.id} content={verse.color === item.id ? `Clear ${item.label}` : `Highlight ${item.label}`}>
                          <button
                            type="button"
                            className={`swatch swatch-${item.id}`}
                            aria-label={`Highlight ${item.label}`}
                            aria-pressed={verse.color === item.id}
                            onClick={() => actions.onColor(verse.color === item.id ? undefined : item.id)}
                          />
                        </Tip>
                      ))}
                    </span>
                    <Tip content={verse.bookmarked ? "Remove the bookmark" : "Bookmark this verse"}>
                      <button type="button" aria-pressed={verse.bookmarked} aria-label="Bookmark" onClick={actions.onBookmark}>
                        {verse.bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                      </button>
                    </Tip>
                    <Pop
                      align="start"
                      className="note-pop"
                      trigger={
                        <button type="button" aria-label="Note" data-on={actions.note ? "true" : "false"}>
                          <StickyNote size={15} />
                          <span>Note</span>
                        </button>
                      }
                    >
                      <NoteEditor note={actions.note} onNote={actions.onNote} />
                    </Pop>
                    <Tip content="Put this card in the open notebook">
                      <button type="button" onClick={actions.onSave}>
                        <NotebookPen size={15} />
                        <span>Save</span>
                      </button>
                    </Tip>
                    <Tip content="Ask the AI about this verse">
                      <button type="button" onClick={actions.onAsk}>
                        <Bot size={15} />
                        <span>Ask</span>
                      </button>
                    </Tip>
                    <Menu label={<><Link2 size={15} /> <span>Links {links.length ? links.length : ""}</span></>} ariaLabel="Cross-references" disabled={!links.length}>
                      <MenuLabel>Open Bible cross-references</MenuLabel>
                      {links.map((link) => (
                        <MenuItem key={link} onSelect={() => onOpenLink?.(link)}>
                          {link}
                        </MenuItem>
                      ))}
                    </Menu>
                    <Menu label={<Plus size={15} />} caret={false} ariaLabel="More verse actions" align="end">
                      <MenuItem icon={<Copy size={14} />} onSelect={actions.onCopy}>
                        Copy with reference
                      </MenuItem>
                      <MenuItem icon={<Calculator size={14} />} onSelect={actions.onCount}>
                        Count in Gematria
                      </MenuItem>
                      {actions.onStrongs ? (
                        <MenuItem icon={<Hash size={14} />} onSelect={actions.onStrongs}>
                          Strong's numbers
                        </MenuItem>
                      ) : null}
                      {actions.onRoots ? (
                        <MenuItem icon={<GitBranch size={14} />} onSelect={actions.onRoots}>
                          Roots of this verse
                        </MenuItem>
                      ) : null}
                      {actions.onOutside ? (
                        <MenuItem icon={<ScrollText size={14} />} onSelect={actions.onOutside}>
                          Extra-canon
                        </MenuItem>
                      ) : null}
                    </Menu>
                  </div>
                ) : null}
              </Fragment>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}

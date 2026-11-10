import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Bot } from "lucide-react"
import { books } from "../catalog"
import { guideSections } from "../guide"
import { parseReference, passageLabel } from "../reference"
import {
  harmony,
  linksFor,
  messiahThread,
  purposeFor,
  topics,
  type HarmonyScene,
} from "../study/content"
import { letters, paleoLetters, readHebrew } from "../study/hebrew"
import { lessonOf } from "../study/letterStudy"
import { AnthropologyPanel } from "./AnthropologyPanel"
import { MazzarothHistoryPanel } from "./MazzarothHistoryPanel"
import { HebrewCrossingCard } from "./HebrewCrossingCard"
import { ShemNamesPanel } from "./ShemNamesPanel"
import { TreeOfLifePanel } from "./TreeOfLifePanel"
import { anthropologyById } from "../study/biblicalAnthropology"
import { lostBookStatusLabel, lostBooks } from "../study/lostBooks"
import { NotebookPane } from "./NotebookPane"
import type { Notebook } from "../notebooks"
import type { Highlight } from "../types"

type DeskTab = "notes" | "guide" | "links" | "lens" | "today" | "topics" | "harmony" | "letters"
type LensId = "beginner" | "devotional" | "historical" | "scholar"

const studyTabs: { id: DeskTab; label: string }[] = [
  { id: "notes", label: "Notes" },
  { id: "guide", label: "Guide" },
  { id: "today", label: "Today" },
]

const exploreTabs: { id: DeskTab; label: string }[] = [
  { id: "links", label: "Links" },
  { id: "lens", label: "Lens" },
  { id: "topics", label: "Topics" },
  { id: "harmony", label: "Harmony" },
  { id: "letters", label: "Letters" },
]

const tabs = [...studyTabs, ...exploreTabs]
const exploreIds = new Set(exploreTabs.map((item) => item.id))

const lenses: { id: LensId; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "devotional", label: "Devotional" },
  { id: "historical", label: "Historical" },
  { id: "scholar", label: "Scholar" },
]

type StudyDeskProps = {
  bookIndex: number
  chapter: number
  verse: number | null
  label: string | null
  text: string | null
  rights: string
  todayLabel: string | null
  todayText: string | null
  todayRef: string
  readings?: string[]
  onOpen: (book: number, chapter: number, verse: number) => void
  onOpenRef: (ref: string) => void
  onOpenOutside?: (query: string) => void
  notebooks: Notebook[]
  notebookId: string
  onPickNotebook: (id: string) => void
  onNewNotebook: () => void
  onAddExampleNotebook?: () => void
  onTrashNotebook: () => void
  onSaveVerse: (tags: string[]) => void
  onAddNote: (text: string, lane: string, at?: { x: number; y: number }) => void
  onNotebook: (update: (notebook: Notebook) => Notebook) => void
  onCardColor: (cardId: string, color: Highlight | undefined) => void
  onGather: () => void
  onExportNotebook: () => void
  onExportPack: () => void
  onImportPack: (file: File) => void
  onCopyMarkdown: () => void
  onAsk: (question: string) => void
  onStrong?: (id: string) => void
  wikiFocusId?: string | null
  notesViewRequest?: string | null
  onNotesViewHandled?: () => void
  tabRequest?: string | null
  onTabRequestHandled?: () => void
}

const tabKey = "anointed-staff.desktab"

function readTab(): DeskTab {
  const saved = localStorage.getItem(tabKey)
  return tabs.some((item) => item.id === saved) ? (saved as DeskTab) : "notes"
}

function AskList({ prompts, onAsk }: { prompts: string[]; onAsk: (question: string) => void }): ReactNode {
  return (
    <ul className="prompts ask-prompts">
      {prompts.map((prompt) => (
        <li key={prompt}>
          <span>{prompt}</span>
          <button type="button" onClick={() => onAsk(prompt)} aria-label={`Ask the AI: ${prompt}`}>
            <Bot size={14} /> Ask
          </button>
        </li>
      ))}
    </ul>
  )
}

function sceneHere(book: number, chapter: number, verse: number | null) {
  let best: { scene: HarmonyScene; distance: number } | null = null
  for (const scene of harmony) {
    for (const place of scene.places) {
      const parsed = parseReference(place.ref)
      if (!parsed || parsed.book !== book || parsed.chapter !== chapter) continue
      const start = parsed.verse ?? 1
      const here = verse ?? start
      if (start > here) continue
      const distance = here - start
      if (distance > 24) continue
      if (!best || distance < best.distance) best = { scene, distance }
    }
  }
  return best?.scene ?? null
}

export function StudyDesk({
  bookIndex,
  chapter,
  verse,
  label,
  text,
  rights,
  todayLabel,
  todayText,
  todayRef,
  readings = [],
  onOpen,
  onOpenRef,
  onOpenOutside,
  notebooks,
  notebookId,
  onPickNotebook,
  onNewNotebook,
  onAddExampleNotebook,
  onTrashNotebook,
  onSaveVerse,
  onAddNote,
  onNotebook,
  onCardColor,
  onGather,
  onExportNotebook,
  onExportPack,
  onImportPack,
  onCopyMarkdown,
  onAsk,
  onStrong,
  wikiFocusId,
  notesViewRequest,
  onNotesViewHandled,
  tabRequest,
  onTabRequestHandled,
}: StudyDeskProps) {
  const [tab, setTab] = useState<DeskTab>(readTab)
  const [exploreOpen, setExploreOpen] = useState(() => exploreIds.has(readTab()))
  useEffect(() => localStorage.setItem(tabKey, tab), [tab])
  useEffect(() => {
    if (!tabRequest) return
    if (tabs.some((item) => item.id === tabRequest)) {
      const next = tabRequest as DeskTab
      setTab(next)
      if (exploreIds.has(next)) setExploreOpen(true)
      setFilter("")
    }
    onTabRequestHandled?.()
  }, [tabRequest, onTabRequestHandled])
  const [lens, setLens] = useState<LensId>("beginner")
  const [filter, setFilter] = useState("")
  const [letterGlyph, setLetterGlyph] = useState("א")
  const letterLesson = lessonOf(letterGlyph)
  const [hebrew, setHebrew] = useState("")
  const book = books[bookIndex]
  const blurb = purposeFor(bookIndex)
  const related = verse == null ? [] : linksFor(bookIndex, chapter, verse)
  const currentScene = sceneHere(bookIndex, chapter, verse)
  const counted = useMemo(() => readHebrew(hebrew), [hebrew])
  const needle = filter.trim().toLowerCase()
  const shownTopics = topics.filter(
    (topic) => !needle || topic.name.toLowerCase().includes(needle) || topic.note.toLowerCase().includes(needle),
  )
  const shownHarmony = harmony.filter(
    (scene) =>
      !needle ||
      scene.title.toLowerCase().includes(needle) ||
      scene.places.some((place) => place.label.toLowerCase().includes(needle)),
  )

  return (
    <aside className="study" aria-label="Study">
      <div className="desk-tabs" role="tablist" aria-label="Study desk">
        {studyTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => {
              setTab(item.id)
              setFilter("")
            }}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className="desk-tabs-more"
          aria-expanded={exploreOpen}
          aria-pressed={exploreIds.has(tab)}
          onClick={() => setExploreOpen((open) => !open)}
        >
          Explore
        </button>
      </div>
      {exploreOpen ? (
        <div className="desk-tabs desk-tabs-explore" role="tablist" aria-label="Explore">
          {exploreTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => {
                setTab(item.id)
                setFilter("")
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {tab === "notes" ? (
        <NotebookPane
          notebooks={notebooks}
          activeId={notebookId}
          verseLabel={label}
          verseText={text}
          onPick={onPickNotebook}
          onNew={onNewNotebook}
          onAddExample={onAddExampleNotebook}
          onTrash={onTrashNotebook}
          onSaveVerse={onSaveVerse}
          onAddNote={onAddNote}
          onChange={onNotebook}
          onColor={onCardColor}
          onOpen={onOpen}
          onOpenScripture={(book, chapter, verse) => {
            onOpenRef(passageLabel(book, chapter, verse))
          }}
          onGather={onGather}
          onAsk={onAsk}
          onExportPdf={onExportNotebook}
          onExportPack={onExportPack}
          onImportPack={onImportPack}
          onCopyMarkdown={onCopyMarkdown}
          wikiFocusId={wikiFocusId}
          notesViewRequest={notesViewRequest}
          onNotesViewHandled={onNotesViewHandled}
        />
      ) : null}

      {tab === "guide" ? (
        <div className="study-body guide-pane">
          <p className="eyebrow">Desk guide</p>
          <h2>How the desk works</h2>
          <p className="quiet">
            A short map of Scripture, Notes, the study wiki, AI, and tools. Use Help in the top bar for shortcuts and the first-run tour.
          </p>
          <div className="guide-toc" aria-label="Guide sections">
            {guideSections.map((section) => (
              <a key={section.id} href={`#guide-${section.id}`}>
                {section.title}
              </a>
            ))}
          </div>
          {guideSections.map((section) => (
            <section key={section.id} id={`guide-${section.id}`} className="guide-section">
              <h3>{section.title}</h3>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.tips?.length ? (
                <ul className="guide-tips">
                  {section.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
          {onAddExampleNotebook ? (
            <div className="study-actions">
              <button type="button" onClick={onAddExampleNotebook}>
                Add the Example · John 3 notebook
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "links" ? (
        <div className="study-body">
          <p className="eyebrow">Cross-references</p>
          <h2>{label ?? book?.name ?? "Scripture"}</h2>
          <nav className="links-toc" aria-label="Links sections">
            <a href="#links-xrefs">Cross-refs</a>
            <a href="#links-named">Named in Scripture</a>
            <a href="#links-mazzaroth">Mazzaroth history</a>
            <a href="#links-peoples">Peoples and night names</a>
            <a href="#links-shem">Seventy-two names</a>
          </nav>
          <div id="links-xrefs">
          {related.length === 0 ? (
            <p className="quiet">This verse has no cross-reference in the Open Bible list.</p>
          ) : (
            <ul className="ref-list">
              {related.map((ref) => (
                <li key={ref}>
                  <button type="button" onClick={() => onOpenRef(ref)}>
                    {ref}
                  </button>
                </li>
              ))}
            </ul>
          )}
          </div>
          <p className="eyebrow" id="links-named" style={{ marginTop: 16 }}>
            Named in Scripture
          </p>
          <p className="quiet">
            Works the Bible names that are not part of the sixty-six. Most originals are lost. Tap a verse; open Extra-canon
            when shipped; Ask for study prompts.
          </p>
          <ul className="lost-books">
            {lostBooks.map((book) => (
              <li key={book.title}>
                <div className="lost-book-head">
                  {book.libraryId && onOpenOutside ? (
                    <button type="button" className="link-btn" onClick={() => onOpenOutside(book.libraryId!)}>
                      {book.title}
                    </button>
                  ) : (
                    <strong>{book.title}</strong>
                  )}
                  <span className={`lost-status lost-status-${book.status}`}>{lostBookStatusLabel[book.status]}</span>
                  <span className="ref-chips">
                    {book.refs.map((ref) => (
                      <button key={ref} type="button" onClick={() => onOpenRef(ref)}>
                        {ref}
                      </button>
                    ))}
                  </span>
                </div>
                <p className="quiet">{book.note}</p>
                <div className="anth-actions">
                  {book.libraryId && onOpenOutside ? (
                    <button type="button" className="chip" onClick={() => onOpenOutside(book.libraryId!)}>
                      Extra-canon
                    </button>
                  ) : null}
                  <button type="button" className="chip" onClick={() => onAsk(book.askPrompt)}>
                    Ask
                  </button>
                  {book.furtherReading?.map((item) => (
                    <a key={item.url} className="chip" href={item.url} target="_blank" rel="noopener noreferrer">
                      Further reading
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <p className="rights">Cited in Scripture · most originals lost · shipped texts labeled · not Brill DDD.</p>
          <div id="links-mazzaroth">
            <MazzarothHistoryPanel onOpenRef={onOpenRef} onAsk={onAsk} onOpenOutside={onOpenOutside} />
          </div>
          <div id="links-peoples">
          <AnthropologyPanel
            onOpenRef={onOpenRef}
            onStrong={onStrong}
            onAsk={onAsk}
            onOpenOutside={onOpenOutside}
            onOpenLetters={(focus) => {
              setTab("letters")
              setExploreOpen(true)
              if (focus === "emet") {
                setLetterGlyph("א")
                setHebrew("אמת")
              } else if (focus === "habiru") {
                setLetterGlyph("ע")
                setHebrew("עבר")
              }
            }}
          />
          </div>
          <div id="links-shem">
          <ShemNamesPanel onOpenRef={onOpenRef} onAsk={onAsk} onOpenOutside={onOpenOutside} />
          </div>
          <p className="rights">
            Cross-references · Open Bible (CC BY). Lost-book, Mazzaroth, anthropology, and Shem notes sit beside Scripture.
          </p>
        </div>
      ) : null}

      {tab === "lens" ? (
        <div className="study-body">
          <p className="eyebrow">Study lens</p>
          <h2>{label ?? book?.name ?? "Scripture"}</h2>
          <div className="lens-row" role="group" aria-label="Lens">
            {lenses.map((item) => (
              <button key={item.id} type="button" aria-pressed={lens === item.id} onClick={() => setLens(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          {text ? <blockquote>{text}</blockquote> : <p className="quiet">Select a verse, then read it through a lens.</p>}
          {lens === "beginner" ? (
            <AskList
              onAsk={onAsk}
              prompts={[
                "Who is speaking, and who is being spoken to?",
                "What happens, or what is promised, in this sentence?",
                "Read the next few verses and say what changes.",
              ]}
            />
          ) : null}
          {lens === "devotional" ? (
            <AskList
              onAsk={onAsk}
              prompts={[
                "Where does this verse meet something you are carrying today?",
                "Turn one line of it into a short prayer, using its own words.",
                "Name one small act that would take the verse seriously before tonight.",
              ]}
            />
          ) : null}
          {lens === "historical" ? (
            <div>
              <p className="quiet">
                {book?.testament === "DC"
                  ? `${book.name} is one of the deuterocanonical books. ${blurb}`
                  : `${book?.name} sits in the ${book?.section.toLowerCase()} of the ${book?.testament === "OT" ? "older" : "newer"} testament. ${blurb}`}
              </p>
              <AskList onAsk={onAsk} prompts={["What did the first hearers already know, and what would this line have cost them?"]} />
            </div>
          ) : null}
          {lens === "scholar" ? (
            <div>
              <p className="quiet">Set the other public-domain translation beside this verse with Compare. Then follow the places that speak to the same matter.</p>
              {related.length === 0 ? (
                <p className="quiet">This verse has no cross-reference in the Open Bible list. The harmony and topic desks cover the wider story.</p>
              ) : (
                <ul className="ref-list">
                  {related.map((ref) => (
                    <li key={ref}>
                      <button type="button" onClick={() => onOpenRef(ref)}>
                        {ref}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "today" ? (
        <div className="study-body">
          <p className="eyebrow">Passage for this day</p>
          <h2>{todayLabel ?? todayRef}</h2>
          {todayText ? <blockquote>{todayText}</blockquote> : <p className="quiet">The day’s passage will appear when the library has loaded.</p>}
          <div className="study-actions">
            <button type="button" onClick={() => onOpenRef(todayRef)} disabled={!todayText}>
              Open in the reading
            </button>
          </div>
          {readings.length ? (
            <ul className="ref-list">
              {readings.map((reading) => (
                <li key={reading}>
                  <button type="button" onClick={() => onOpenRef(reading)}>
                    {reading}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="quiet">The year walks every chapter that has text, including the Apocrypha. Today’s verse is taken from the first chapter of the day.</p>
        </div>
      ) : null}

      {tab === "topics" ? (
        <div className="study-body">
          <p className="eyebrow">Topic index</p>
          <h2>Walk a theme</h2>
          <input
            className="desk-filter"
            value={filter}
            placeholder="Filter topics"
            aria-label="Filter topics"
            onChange={(event) => setFilter(event.target.value)}
          />
          <ul className="topic-list">
            {shownTopics.map((topic) => (
              <li key={topic.name}>
                <strong>{topic.name}</strong>
                <span>{topic.note}</span>
                <span className="chip-row">
                  {topic.refs.map((ref) => (
                    <button key={ref} type="button" onClick={() => onOpenRef(ref)}>
                      {ref}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "harmony" ? (
        <div className="study-body">
          <p className="eyebrow">Gospel harmony</p>
          <h2>The same scene, side by side</h2>
          <input
            className="desk-filter"
            value={filter}
            placeholder="Filter scenes"
            aria-label="Filter gospel scenes"
            onChange={(event) => setFilter(event.target.value)}
          />
          <ul className="topic-list">
            {shownHarmony.map((scene) => (
              <li key={scene.title} data-current={scene === currentScene ? "true" : "false"}>
                <strong>{scene.title}</strong>
                <span className="chip-row">
                  {scene.places.map((place) => (
                    <button key={place.label} type="button" onClick={() => onOpenRef(place.ref)}>
                      {place.label}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <p className="eyebrow thread-label">Messiah thread</p>
          <p className="quiet">A path of promise from the garden to the last page, in the spirit of a Messiah study.</p>
          <ul className="topic-list">
            {messiahThread.map((step) => (
              <li key={step.ref}>
                <strong>{step.title}</strong>
                <span className="chip-row">
                  <button type="button" onClick={() => onOpenRef(step.ref)}>
                    {step.ref}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "letters" ? (
        <div className="study-body">
          <p className="eyebrow">Hebrew letters</p>
          <h2>Count a word</h2>
          <p className="quiet">
            Standard letter values, the same scale the Genesis language uses for Paleo-Hebrew numerals. Vowel points and number marks are ignored. Final forms use their traditional hundreds.
          </p>
          <HebrewCrossingCard
            layout="full"
            onOpenRef={onOpenRef}
            onStrong={onStrong}
            onAsk={onAsk}
            onFillWord={(word) => {
              setHebrew(word)
              setLetterGlyph("ע")
            }}
            onOpenAnthropology={() => {
              setTab("links")
              setExploreOpen(true)
            }}
          />
          <article className="emet-golem" aria-label="Emet and golem">
            <p className="eyebrow">Letter folklore</p>
            <h3>
              <span lang="he" dir="rtl">
                אמת
              </span>{" "}
              Truth · golem
            </h3>
            <p>{anthropologyById("emet-golem")?.summary}</p>
            <div className="anth-actions">
              {onStrong ? (
                <button type="button" className="link-btn" onClick={() => onStrong("H571")}>
                  H571 אמת
                </button>
              ) : null}
              <button
                type="button"
                className="chip"
                onClick={() => {
                  setHebrew("אמת")
                  setLetterGlyph("א")
                }}
              >
                Count אמת
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => {
                  const prompt = anthropologyById("emet-golem")?.askPrompt
                  if (prompt) onAsk(prompt)
                }}
              >
                Ask
              </button>
            </div>
          </article>
          <TreeOfLifePanel
            onOpenRef={onOpenRef}
            onAsk={onAsk}
            onLetter={(glyph) => {
              setLetterGlyph(glyph)
              setHebrew((current) => current + glyph)
            }}
            onOpenYetzirah={onOpenOutside ? () => onOpenOutside("yetzirah") : undefined}
          />
          <label className="note-label" htmlFor="hebrew-word">
            Hebrew word
          </label>
          <input
            id="hebrew-word"
            className="hebrew-input"
            dir="auto"
            lang="he"
            value={hebrew}
            placeholder="אמן"
            onChange={(event) => setHebrew(event.target.value)}
          />
          <div className="study-actions">
            <button type="button" onClick={() => setHebrew("")} disabled={!hebrew}>
              Clear
            </button>
          </div>
          <p className="gematria" aria-live="polite">
            {counted.known.length === 0 ? "—" : counted.total}
            <small>{counted.skipped ? ` ${counted.skipped} skipped` : " total"}</small>
          </p>
          {counted.known.length > 0 ? (
            <ul className="letter-sum">
              {counted.known.map((letter, index) => (
                <li key={`${letter.glyph}-${index}`}>
                  <b>{letter.glyph}</b>
                  {letter.name} · {letter.picture} · {letter.value}
                </li>
              ))}
            </ul>
          ) : null}
          <article className="letter-lesson" aria-live="polite">
            <p className="eyebrow">
              {letterLesson.groupLabel} · {letterLesson.value}
            </p>
            <h3>
              <span lang="he">{letterLesson.glyph}</span> {letterLesson.name}
              <span className="letter-paleo" aria-label={`Paleo ${letterLesson.name}`}>
                {letterLesson.paleo}
              </span>
            </h3>
            <p className="quiet">
              Picture of {letterLesson.picture}. {letterLesson.sound}.
            </p>
            <ul className="learn-meanings" aria-label="Pictograph meanings">
              {letterLesson.meanings.map((gloss) => (
                <li key={gloss}>{gloss}</li>
              ))}
            </ul>
            <p>{letterLesson.line}</p>
            <p className="quiet">
              <button type="button" className="link-btn" onClick={() => onOpenRef(letterLesson.sample.ref)}>
                {letterLesson.sample.ref}
              </button>
              {" · "}
              {letterLesson.sample.gloss}
            </p>
          </article>
          <div className="letter-grid" aria-label="Hebrew alphabet">
            {letters
              .filter((letter) => !letter.final)
              .map((letter) => (
                <button
                  key={letter.glyph}
                  type="button"
                  aria-pressed={letterGlyph === letter.glyph}
                  onClick={() => {
                    setLetterGlyph(letter.glyph)
                    setHebrew((current) => current + letter.glyph)
                  }}
                >
                  <span className="glyph">{letter.glyph}</span>
                  <small>
                    {letter.name} {letter.value}
                  </small>
                </button>
              ))}
          </div>
          <p className="eyebrow">Paleo-Hebrew</p>
          <div className="letter-grid paleo" aria-label="Paleo-Hebrew alphabet">
            {paleoLetters.map((letter) => {
              const square = letters.find((item) => item.value === letter.value && !item.final)
              return (
                <button
                  key={letter.glyph}
                  type="button"
                  aria-pressed={square ? letterGlyph === square.glyph : false}
                  onClick={() => {
                    if (square) setLetterGlyph(square.glyph)
                    setHebrew((current) => current + letter.glyph)
                  }}
                >
                  <span className="glyph">{letter.glyph}</span>
                  <small>
                    {letter.name} {letter.value}
                  </small>
                </button>
              )
            })}
          </div>
          <div className="letter-grid finals" aria-label="Final forms">
            {letters
              .filter((letter) => letter.final)
              .map((letter) => (
                <button key={letter.glyph} type="button" onClick={() => setHebrew((current) => current + letter.glyph)}>
                  <span className="glyph">{letter.glyph}</span>
                  <small>{letter.value}</small>
                </button>
              ))}
          </div>
        </div>
      ) : null}

      <p className="rights">{rights}</p>
    </aside>
  )
}

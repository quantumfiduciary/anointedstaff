import { useEffect, useMemo, useState } from "react"
import { Calculator, ChevronLeft, ChevronRight, Copy, GitBranch, ListTree, NotebookPen, ScrollText, Volume2 } from "lucide-react"
import { books } from "../catalog"
import { passageLabel } from "../reference"
import { hebrewChart } from "../study/hebrewChart"
import { matthewHebrewNote, matthewNames } from "../study/matthewHebrew"
import { findPower, powers } from "../study/powers"
import { readEntry, searchLexicon, stripStrongMarkup, type StrongsLibrary } from "../strongs"
import { speak } from "../voice"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Tip } from "./ui/tip"

type StrongsPaneProps = {
  library: StrongsLibrary | null
  query: string
  verseIds: string[]
  verseLabel: string | null
  bookIndex: number
  onQuery: (value: string) => void
  onAsk?: (id: string) => void
  onOpenVerse?: (book: number, chapter: number, verse: number) => void
  onCopy?: (text: string) => void
  onSave?: (label: string, text: string, tags: string[]) => void
  onSearchOutside?: (query: string) => void
  onCount?: (phrase: string) => void
  onRoots?: (id: string) => void
}

const historyKey = "anointed-staff.strongs-history"

function readHistory(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(historyKey) ?? "[]") as unknown
    return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === "string").slice(0, 10) : []
  } catch {
    return []
  }
}

type Spot = { book: number; chapter: number; verse: number; text: string }

/** Every verse whose King James markup carries this number. */
function occurrences(library: StrongsLibrary, id: string, limit = 400): { found: Spot[]; total: number } {
  const tag = new RegExp(`\\{\\(?${id}\\)?\\}`)
  const found: Spot[] = []
  let total = 0
  library.verses.forEach((chapters, book) =>
    chapters?.forEach((verses, chapter) =>
      verses?.forEach((markup, verse) => {
        if (!markup || !tag.test(markup)) return
        total += 1
        if (found.length < limit) found.push({ book, chapter, verse, text: stripStrongMarkup(markup) })
      }),
    ),
  )
  return { found, total }
}

function step(id: string, by: -1 | 1) {
  const match = id.match(/^([HG])(\d+)$/)
  if (!match) return null
  const next = Number(match[2]) + by
  return next > 0 ? `${match[1]}${next}` : null
}

function glossWord(entry: string) {
  const after = entry.includes(":") ? (entry.split(":").pop() ?? entry) : entry
  return after.replace(/[^A-Za-z]+/g, " ").trim().split(/\s+/).find((item) => item.length >= 4) ?? ""
}

export function StrongsPane({
  library,
  query,
  verseIds,
  verseLabel,
  bookIndex,
  onQuery,
  onAsk,
  onOpenVerse,
  onCopy,
  onSave,
  onSearchOutside,
  onCount,
  onRoots,
}: StrongsPaneProps) {
  const [debounced, setDebounced] = useState(query)
  const [history, setHistory] = useState<string[]>(readHistory)
  const [concordance, setConcordance] = useState<string | null>(null)
  const [scope, setScope] = useState<"all" | "ot" | "nt" | "here">("all")
  const [namesOpen, setNamesOpen] = useState(false)
  const [paleo, setPaleo] = useState<Record<string, { hebrew?: string; notes?: string; root?: string; translit?: string }> | null>(null)
  const [bdb, setBdb] = useState<{ credit: string; lex: Record<string, string> } | null>(null)

  useEffect(() => {
    let cancel = false
    fetch("/paleo-strongs.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { lex?: Record<string, { hebrew?: string; notes?: string; root?: string; translit?: string }> } | null) => {
        if (!cancel && data?.lex) setPaleo(data.lex)
      })
      .catch(() => undefined)
    fetch("/bdb.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { credit?: string; lex?: Record<string, string> } | null) => {
        if (!cancel && data?.lex) setBdb({ credit: data.credit ?? "Brown–Driver–Briggs", lex: data.lex })
      })
      .catch(() => undefined)
    return () => {
      cancel = true
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 80)
    return () => window.clearTimeout(timer)
  }, [query])

  const hits = library && debounced.trim() ? searchLexicon(library, debounced) : []
  const selected = hits[0] ?? (library && normalizeMaybe(library, query))
  const chartLetter = selected ? hebrewChart.find((letter) => selected.lemma.replace(/[\u0591-\u05C7]/g, "").startsWith(letter.glyph)) : undefined
  const kind = selected?.id.startsWith("H") ? "Hebrew" : selected ? "Greek" : null
  const paleoHit = selected && paleo ? paleo[selected.id] : undefined
  const bdbHit = selected?.id.startsWith("H") && bdb ? bdb.lex[selected.id] : undefined

  useEffect(() => {
    if (!selected) return
    const timer = window.setTimeout(() => {
      setHistory((current) => {
        const next = [selected.id, ...current.filter((item) => item !== selected.id)].slice(0, 10)
        localStorage.setItem(historyKey, JSON.stringify(next))
        return next
      })
    }, 900)
    return () => window.clearTimeout(timer)
  }, [selected?.id])

  useEffect(() => {
    setConcordance(null)
    setScope("all")
  }, [selected?.id])

  const places = useMemo(() => (library && concordance ? occurrences(library, concordance) : null), [library, concordance])
  const shown = useMemo(() => {
    if (!places) return null
    const rows = places.found.filter((spot) => {
      if (scope === "here") return spot.book === bookIndex
      if (scope === "ot") return books[spot.book]?.testament === "OT"
      if (scope === "nt") return books[spot.book]?.testament === "NT"
      return true
    })
    return { ...places, rows }
  }, [places, scope, bookIndex])
  const previous = selected ? step(selected.id, -1) : null
  const following = selected ? step(selected.id, 1) : null
  const outsideQuery = selected ? glossWord(selected.entry) || selected.transliteration.replace(/[^A-Za-z]/g, "") : ""
  const named = findPower(debounced).slice(0, 6)
  const verseNames = verseLabel ? powers.filter((item) => item.strong && verseIds.includes(item.strong)) : []
  const matthewOpen = bookIndex === 39

  return (
    <div className="strongs">
      <header className="lex-head">
        <p className="eyebrow">Strong's</p>
        <h2>Hebrew and Greek numbers</h2>
        <p className="quiet">{verseLabel ? `Numbers on ${verseLabel} sit below. Search a number, a gloss, or a Hebrew letter.` : "Select a King James verse, or search a number, a gloss, or a Hebrew letter."}</p>
      </header>
      <label className="sr" htmlFor="strongs-search">
        Look up a Strong's number or English gloss
      </label>
      <Input id="strongs-search" className="mb-3" value={query} placeholder="H7225, love, or א" onChange={(event) => onQuery(event.target.value)} />
      {matthewOpen ? (
        <section className="strong-card matthew-strip" aria-label="Hebrew names in Matthew">
          <p className="eyebrow">Matthew</p>
          <p className="quiet">{matthewHebrewNote}</p>
          <div className="strong-verse" role="group" aria-label="Hebrew names behind Matthew">
            {matthewNames.map((item) => (
              <button key={item.strong} type="button" className="chip" onClick={() => onQuery(item.strong)}>
                {item.label}
                <small>{item.strong}</small>
              </button>
            ))}
            {onSearchOutside ? (
              <button type="button" className="chip" onClick={() => onSearchOutside("thomas")}>
                Thomas
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
      {verseIds.length ? (
        <div className="strong-verse" role="group" aria-label="Strong's numbers in this verse">
          <span className="strong-label">This verse</span>
          {verseIds.map((id) => {
            const entry = library ? readEntry(library, id) : null
            return (
              <Button key={id} type="button" size="sm" variant={query === id ? "default" : "outline"} onClick={() => onQuery(id)}>
                {id}
                {entry?.transliteration ? <small>{entry.transliteration}</small> : null}
              </Button>
            )
          })}
        </div>
      ) : null}
      {history.length ? (
        <div className="strong-verse" role="group" aria-label="Recent lookups">
          <span className="strong-label">Recent</span>
          {history.map((id) => (
            <button key={id} type="button" className="chip" onClick={() => onQuery(id)}>
              {id}
            </button>
          ))}
        </div>
      ) : null}
      {!library ? <p className="quiet">Opening the Strong's glossary…</p> : null}
      {library && !debounced.trim() ? (
        <p className="quiet">Choose a number from this verse, or search a number, an English gloss, or a Hebrew letter from the chart.</p>
      ) : null}
      {selected ? (
        <article className="strong-card">
          <div className="strong-top">
            <Tip content={previous ? `Open ${previous}` : "First number"}>
              <button type="button" className="icon-btn" aria-label="Previous number" disabled={!previous} onClick={() => previous && onQuery(previous)}>
                <ChevronLeft size={16} />
              </button>
            </Tip>
            <p className="strong-id">
              {selected.id}
              {kind ? <i className="strong-kind">{kind}</i> : null}
            </p>
            <Tip content={following ? `Open ${following}` : "Last number"}>
              <button type="button" className="icon-btn" aria-label="Next number" disabled={!following} onClick={() => following && onQuery(following)}>
                <ChevronRight size={16} />
              </button>
            </Tip>
          </div>
          <h2>{selected.lemma || selected.transliteration}</h2>
          <p className="strong-speak">
            {selected.transliteration}
            {selected.pronunciation ? <span> · {selected.pronunciation}</span> : null}
          </p>
          <p>{selected.entry}</p>
          {paleoHit?.notes ? (
            <p className="paleo-note">
              <span className="eyebrow">Paleo Strong&apos;s</span>
              {paleoHit.hebrew ? <b dir="rtl"> {paleoHit.hebrew}</b> : null}
              {paleoHit.translit ? <span> · {paleoHit.translit}</span> : null}
              {paleoHit.root ? <span> · root {paleoHit.root}</span> : null}
              <br />
              {paleoHit.notes}
            </p>
          ) : null}
          {bdbHit ? (
            <p className="bdb-note">
              <span className="eyebrow">BDB</span>
              <br />
              {bdbHit}
            </p>
          ) : null}
          <div className="gem-actions">
            {onAsk ? (
              <Button type="button" size="sm" onClick={() => onAsk(selected.id)}>
                Ask about this word
              </Button>
            ) : null}
            {onSave ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onSave(
                    `${selected.id} ${selected.transliteration || selected.lemma}`,
                    `${selected.id} ${selected.lemma} (${selected.transliteration})\n${selected.entry}${verseLabel ? `\nBeside ${verseLabel}` : ""}`,
                    ["strongs", selected.id.toLowerCase()],
                  )
                }
              >
                <NotebookPen />
                Save to notes
              </Button>
            ) : null}
            {onSearchOutside && outsideQuery ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onSearchOutside(outsideQuery)}>
                <ScrollText />
                Extra-canon
              </Button>
            ) : null}
            {onCount ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onCount(selected.lemma || selected.transliteration)}>
                <Calculator />
                Count
              </Button>
            ) : null}
            {onRoots ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onRoots(selected.id)}>
                <GitBranch />
                Roots
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="outline" onClick={() => setConcordance(concordance ? null : selected.id)}>
              <ListTree />
              {concordance ? "Hide the verses" : "Every verse with it"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => speak(`${selected.id}. ${selected.transliteration}. ${selected.entry}`)}>
              <Volume2 />
              Hear
            </Button>
            {onCopy ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onCopy(`${selected.id} ${selected.lemma} (${selected.transliteration})\n${selected.entry}`)}>
                <Copy />
                Copy
              </Button>
            ) : null}
          </div>
          {chartLetter ? (
            <p className="strong-chart">
              {chartLetter.glyph} {chartLetter.name} · {chartLetter.value} · {chartLetter.picture}. {chartLetter.meaning}
            </p>
          ) : null}
          {shown ? (
            <div className="concordance">
              <p className="eyebrow">
                {shown.total.toLocaleString()} {shown.total === 1 ? "verse" : "verses"} in the King James
                {shown.total > shown.found.length ? ` · the first ${shown.found.length} scanned` : ""}
                {shown.rows.length !== shown.found.length ? ` · ${shown.rows.length} in this filter` : ""}
              </p>
              <div className="strong-verse" role="group" aria-label="Filter the concordance">
                {(
                  [
                    ["all", "All"],
                    ["ot", "Old Testament"],
                    ["nt", "New Testament"],
                    ["here", verseLabel ? books[bookIndex]?.name ?? "This book" : "This book"],
                  ] as const
                ).map(([id, label]) => (
                  <button key={id} type="button" className="chip" aria-pressed={scope === id} onClick={() => setScope(id)}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="concordance-list">
                {shown.rows.map((spot) => (
                  <button key={`${spot.book}:${spot.chapter}:${spot.verse}`} type="button" onClick={() => onOpenVerse?.(spot.book, spot.chapter, spot.verse)}>
                    <b>{passageLabel(spot.book, spot.chapter + 1, spot.verse + 1)}</b>
                    <small>{spot.text}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </article>
      ) : null}
      {hits.length > 1 ? (
        <ul className="strong-hits">
          {hits.slice(1).map((hit) => (
            <li key={hit.id}>
              <button type="button" onClick={() => onQuery(hit.id)}>
                <b>{hit.id}</b>
                <span>{hit.transliteration || hit.lemma}</span>
                <small>{hit.entry}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {library && debounced.trim() && hits.length === 0 ? <p className="quiet">No Strong's entry matches that.</p> : null}
      {named.length || verseNames.length ? (
        <section className="sky-block" aria-label="Names of powers">
          <p className="eyebrow">Names beside the verse</p>
          <p className="quiet">Original short notes. Not the Brill Dictionary of Deities and Demons.</p>
          <ul className="strong-hits">
            {(named.length ? named : verseNames).map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => item.strong && onQuery(item.strong)}>
                  <b>{item.name}</b>
                  <span>{item.strong ?? item.refs[0]}</span>
                  <small>{item.note}</small>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <button type="button" className="link-btn" onClick={() => setNamesOpen((current) => !current)}>
        {namesOpen ? "Hide the names glossary" : "Names of powers"}
      </button>
      {namesOpen ? (
        <ul className="strong-hits">
          {powers.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  if (item.strong) onQuery(item.strong)
                  else onSearchOutside?.(item.name)
                }}
              >
                <b>{item.name}</b>
                <span>{item.refs[0]}</span>
                <small>{item.note}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="rights">Strong's numbers and this 1890 glossary are public domain. The King James wording is public domain outside the United Kingdom. Names of powers are original desk notes.</p>
    </div>
  )
}

function normalizeMaybe(library: StrongsLibrary, query: string) {
  const id = query.trim().toUpperCase()
  return /^[HG]\d+$/.test(id) ? readEntry(library, id) : null
}

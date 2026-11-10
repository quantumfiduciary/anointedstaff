import { useEffect, useMemo, useState } from "react"
import { Calculator, Copy, GraduationCap, Hash, NotebookPen, ScrollText, Volume2 } from "lucide-react"
import { type StrongsLibrary } from "../strongs"
import { englishFeatured, flattenTree, type EtyNode } from "../study/englishEty"
import { findHitchcock, hitchcockFeatured } from "../study/hitchcock"
import { lookupRoots, type OriginKind } from "../study/etymology"
import { searchDictionary, type DictionaryCatalog, type DictionaryFile } from "../study/dictionaries"
import { playNameClip } from "../study/practiceAudio"
import { speak } from "../voice"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Tip } from "./ui/tip"

type RootsPaneProps = {
  library: StrongsLibrary | null
  query: string
  verseIds: string[]
  verseLabel: string | null
  onQuery: (value: string) => void
  onOpenStrong?: (id: string) => void
  onCount?: (phrase: string) => void
  onLearn?: (glyph: string) => void
  onSearchOutside?: (query: string) => void
  onCopy?: (text: string) => void
  onSave?: (label: string, text: string, tags: string[]) => void
}

const historyKey = "anointed-staff.roots-history"

const originLabel: Record<OriginKind, string> = {
  primitive: "Primitive",
  derived: "Derived",
  corresponding: "Corresponding",
  foreign: "Foreign",
  hebrew: "Hebrew origin",
  compound: "Compound",
}

function readHistory(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(historyKey) ?? "[]") as unknown
    return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === "string").slice(0, 10) : []
  } catch {
    return []
  }
}

export function RootsPane({
  library,
  query,
  verseIds,
  verseLabel,
  onQuery,
  onOpenStrong,
  onCount,
  onLearn,
  onSearchOutside,
  onCopy,
  onSave,
}: RootsPaneProps) {
  const [debounced, setDebounced] = useState(query)
  const [history, setHistory] = useState<string[]>(readHistory)
  const [mode, setMode] = useState<"roots" | "dictionary">("roots")
  const [dictCatalog, setDictCatalog] = useState<DictionaryCatalog | null>(null)
  const [dictId, setDictId] = useState("easton")
  const [dictFile, setDictFile] = useState<DictionaryFile | null>(null)
  const [dictQuery, setDictQuery] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 80)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let cancel = false
    fetch("/dictionaries/catalog.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: DictionaryCatalog | null) => {
        if (!cancel && data?.dictionaries?.length) {
          setDictCatalog(data)
          setDictId((current) => (data.dictionaries.some((item) => item.id === current) ? current : data.dictionaries[0].id))
        }
      })
      .catch(() => undefined)
    return () => {
      cancel = true
    }
  }, [])

  useEffect(() => {
    if (mode !== "dictionary" || !dictId) return
    let cancel = false
    setDictFile(null)
    fetch(`/dictionaries/${dictId}.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: DictionaryFile | null) => {
        if (!cancel) setDictFile(data)
      })
      .catch(() => undefined)
    return () => {
      cancel = true
    }
  }, [mode, dictId])

  const looked = lookupRoots(library, debounced.trim() || verseIds[0] || "")
  const selected = looked.study
  const hits = looked.hits
  const names = looked.names
  const english = looked.english
  const dictHits = useMemo(
    () => (dictFile ? searchDictionary(dictFile.entries, dictQuery || query, 20) : []),
    [dictFile, dictQuery, query],
  )

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

  const more = hits.filter((item) => item.id !== selected?.id).slice(0, 8)

  return (
    <div className="roots">
      <header className="lex-head">
        <p className="eyebrow">Roots</p>
        <h2>Where the word comes from</h2>
        <p className="quiet">
          {verseLabel
            ? `The King James numbers on ${verseLabel} open a Strong's chain. Hitchcock names and a short English tree sit beside it.`
            : "Search a number, a name, or an English word. Strong's, Hitchcock (1869), and a public-domain English tree share the card."}
        </p>
      </header>
      <div className="segmented gem-tool-tabs" role="tablist" aria-label="Roots mode">
        <button type="button" role="tab" aria-selected={mode === "roots"} onClick={() => setMode("roots")}>
          Roots
        </button>
        <button type="button" role="tab" aria-selected={mode === "dictionary"} onClick={() => setMode("dictionary")}>
          Dictionary
        </button>
      </div>
      {mode === "dictionary" ? (
        <section className="roots-dictionary" aria-label="Public-domain dictionaries">
          <p className="quiet">Easton and Smith for Bible names and places; Webster for English sense. All public domain.</p>
          <div className="gem-actions">
            <select aria-label="Dictionary" value={dictId} onChange={(event) => setDictId(event.target.value)}>
              {(dictCatalog?.dictionaries ?? [{ id: "easton", title: "Easton's Bible Dictionary" }]).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                  {"count" in item && item.count ? ` · ${item.count}` : ""}
                </option>
              ))}
            </select>
          </div>
          <Input
            aria-label="Search the dictionary"
            value={dictQuery}
            placeholder="Aaron, gospel, Jerusalem…"
            onChange={(event) => setDictQuery(event.target.value)}
          />
          {!dictFile ? <p className="quiet">Loading dictionary…</p> : null}
          {dictFile && (dictQuery.trim() || query.trim()).length < 2 ? (
            <p className="quiet">Type at least two letters to search this dictionary.</p>
          ) : null}
          {dictFile && (dictQuery.trim() || query.trim()).length >= 2 && dictHits.length === 0 ? (
            <p className="quiet">No entry matches that headword.</p>
          ) : null}
          <ul className="dict-hits">
            {dictHits.map((entry) => (
              <li key={entry.key}>
                <b>{entry.lemma}</b>
                <p>{entry.gloss}</p>
              </li>
            ))}
          </ul>
          {dictFile ? <p className="rights">{dictFile.credit}</p> : null}
        </section>
      ) : null}
      {mode === "roots" ? (
        <>
      <label className="sr" htmlFor="roots-search">
        Look up a root, Strong's number, or gloss
      </label>
      <Input id="roots-search" className="mb-3" value={query} placeholder="H1254, beginning, or ברא" onChange={(event) => onQuery(event.target.value)} />
      {verseIds.length ? (
        <div className="strong-verse" role="group" aria-label="Numbers on this verse">
          <span className="strong-label">This verse</span>
          {verseIds.map((id) => (
            <Button key={id} type="button" size="sm" variant={selected?.id === id ? "default" : "outline"} onClick={() => onQuery(id)}>
              {id}
            </Button>
          ))}
        </div>
      ) : null}
      {history.length ? (
        <div className="strong-verse" role="group" aria-label="Recent roots">
          <span className="strong-label">Recent</span>
          {history.map((id) => (
            <button key={id} type="button" className="chip" onClick={() => onQuery(id)}>
              {id}
            </button>
          ))}
        </div>
      ) : null}
      {!library ? <p className="quiet">Opening the Strong's glossary…</p> : null}
      {selected ? (
        <article className="strong-card roots-card">
          <p className="strong-id">
            {selected.id}
            <i className="strong-kind">{originLabel[selected.origin]}</i>
          </p>
          <h2>{selected.lemma || selected.transliteration}</h2>
          <p className="strong-speak">
            {selected.transliteration}
            {selected.pronunciation ? <span> · {selected.pronunciation}</span> : null}
            {selected.gloss ? <span> · {selected.gloss}</span> : null}
          </p>
          <p className="quiet">{selected.originNote}</p>
          {names.length ? <NameList names={names} /> : null}
          {english ? <EnglishTree tree={english} onStrong={onQuery} /> : null}
          {selected.chain.length ? (
            <ol className="roots-chain" aria-label="Derivation chain">
              {selected.chain.map((step, index) => (
                <li key={step.id}>
                  <button type="button" onClick={() => onQuery(step.id)} aria-current={step.id === selected.id}>
                    <b>{step.id}</b>
                    <span>
                      {step.lemma || step.transliteration}
                      {step.gloss ? ` · ${step.gloss}` : ""}
                    </span>
                    <small>
                      {originLabel[step.origin]}
                      {index < selected.chain.length - 1 ? " →" : ""}
                    </small>
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
          {selected.letters.length ? (
            <section className="roots-letters" aria-label="Hebrew letters in this word">
              <p className="eyebrow">Letters</p>
              <div className="chip-row">
                {selected.letters.map((letter) => (
                  <button key={letter.glyph} type="button" className="chip roots-letter" onClick={() => onLearn?.(letter.glyph)}>
                    <b>{letter.glyph}</b>
                    <span>
                      {letter.name} · {letter.value}
                    </span>
                    <small>
                      {letter.picture}. {letter.meaning}
                    </small>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          <p className="roots-count">
            Jewish {selected.counts.jewish}
            <span>Hebrew {selected.counts.hebrew}</span>
            <span>English {selected.counts.english}</span>
            <span>Simple {selected.counts.simple}</span>
          </p>
          {selected.kindred.length ? (
            <section aria-label="Kindred Strong's numbers">
              <p className="eyebrow">Kindred</p>
              <div className="strong-verse">
                {selected.kindred.map((item) => (
                  <button key={item.id} type="button" className="chip" onClick={() => onQuery(item.id)}>
                    {item.id}
                    <small>{item.transliteration || item.lemma}</small>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <p className="quiet">No other Strong's number lists this parent in the 1890 glossary.</p>
          )}
          <p>{selected.entry}</p>
          <div className="gem-actions">
            {onOpenStrong ? (
              <Button type="button" size="sm" onClick={() => onOpenStrong(selected.id)}>
                <Hash />
                Strong's
              </Button>
            ) : null}
            {onCount ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onCount(selected.lemma || selected.transliteration)}>
                <Calculator />
                Count
              </Button>
            ) : null}
            {onSearchOutside && selected.gloss ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onSearchOutside(selected.gloss.split(" ")[0] ?? selected.transliteration)}>
                <ScrollText />
                Extra-canon
              </Button>
            ) : null}
            {onLearn && selected.letters[0] ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onLearn(selected.letters[0].glyph)}>
                <GraduationCap />
                Learn {selected.letters[0].name}
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
                    `${selected.id} ${selected.lemma} (${selected.transliteration})\n${selected.originNote}\n${selected.chain.map((step) => step.id).join(" → ")}\n${selected.entry}`,
                    ["roots", selected.id.toLowerCase()],
                  )
                }
              >
                <NotebookPen />
                Save to notes
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="outline" onClick={() => speak(`${selected.id}. ${selected.transliteration}. ${selected.originNote}. ${selected.gloss}`)}>
              <Volume2 />
              Hear
            </Button>
            {onCopy ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onCopy(`${selected.id} ${selected.lemma} (${selected.transliteration})\n${selected.chain.map((step) => step.id).join(" → ")}\n${selected.entry}`)}
              >
                <Copy />
                Copy
              </Button>
            ) : null}
          </div>
        </article>
      ) : names.length || english ? (
        <article className="strong-card roots-card">
          <h2>{names[0]?.name ?? english?.word}</h2>
          {names.length ? <NameList names={names} /> : null}
          {english ? <EnglishTree tree={english} onStrong={onQuery} /> : null}
        </article>
      ) : library && debounced.trim() ? (
        <p className="quiet">No Strong's, Hitchcock, or English tree matches that. Try a number, a name, or a word like gospel.</p>
      ) : library ? (
        <div className="roots-start">
          <p className="quiet">Choose a number from this verse, or start with a name or an English word. Wiktionary and Etymonline stay off the desk.</p>
          <p className="eyebrow">Names</p>
          <div className="strong-verse">
            {hitchcockFeatured.map((name) => (
              <span key={name} className="roots-name-chip">
                <button type="button" className="chip" onClick={() => onQuery(name)}>
                  {name}
                </button>
                <Tip content="Offline clip when available">
                  <button
                    type="button"
                    className="chip"
                    aria-label={`Hear ${name}`}
                    onClick={() => {
                      void playNameClip(name).then((ok) => {
                        if (!ok) {
                          const hit = findHitchcock(name)[0]
                          speak(hit ? `${hit.name}. Meaning: ${hit.meaning}.` : name)
                        }
                      })
                    }}
                  >
                    <Volume2 size={14} /> Hear
                  </button>
                </Tip>
              </span>
            ))}
          </div>
          <p className="eyebrow">English</p>
          <div className="strong-verse">
            {englishFeatured.map((word) => (
              <button key={word} type="button" className="chip" onClick={() => onQuery(word)}>
                {word}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {hits.length > 1 ? (
        <ul className="strong-hits">
          {hits.slice(selected && hits[0]?.id === selected.id ? 1 : 0, 12).map((hit) => (
            <li key={hit.id}>
              <button type="button" onClick={() => onQuery(hit.id)}>
                <b>{hit.id}</b>
                <span>{hit.transliteration || hit.lemma}</span>
                <small>{hit.entry}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : more.length ? (
        <ul className="strong-hits">
          {more.map((hit) => (
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
      <p className="rights">
        Strong's 1890, Hitchcock's Bible Names 1869, and short English trees after Skeat 1910 and Webster 1913. Letter pictures are the desk's own notes. We do not ship Wiktionary, Etymonline, or share-alike dumps.
      </p>
        </>
      ) : null}
    </div>
  )
}

function NameList({ names }: { names: { name: string; meaning: string }[] }) {
  return (
    <section className="roots-names" aria-label="Hitchcock Bible names">
      <p className="eyebrow">Hitchcock</p>
      <ul>
        {names.map((item) => (
          <li key={item.name}>
            <b>{item.name}</b>
            <span>{item.meaning}</span>
            <Tip content="Offline clip when available">
              <button
                type="button"
                className="chip"
                aria-label={`Hear ${item.name}`}
                onClick={() => {
                  void playNameClip(item.name).then((ok) => {
                    if (!ok) speak(`${item.name}. Meaning: ${item.meaning}.`)
                  })
                }}
              >
                <Volume2 size={14} /> Hear
              </button>
            </Tip>
          </li>
        ))}
      </ul>
    </section>
  )
}

function EnglishTree({ tree, onStrong }: { tree: EtyNode; onStrong: (id: string) => void }) {
  return (
    <section className="roots-english" aria-label="English etymology tree">
      <p className="eyebrow">English tree</p>
      <ol className="ety-tree">
        {flattenTree(tree).map(({ depth, node }) => (
          <li key={`${depth}-${node.word}-${node.lang}`} style={{ paddingInlineStart: depth * 16 }}>
            <b>{node.word}</b>
            <i>{node.lang}</i>
            <span>{node.note}</span>
            {node.strong ? (
              <button type="button" className="chip" onClick={() => onStrong(node.strong!)}>
                {node.strong}
              </button>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  )
}

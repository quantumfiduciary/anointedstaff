import { useEffect, useMemo, useRef, useState } from "react"
import { Bookmark, ChevronLeft, ChevronRight, Copy, GraduationCap, NotebookPen, ScrollText, Shuffle, Sparkles, Volume2, X } from "lucide-react"
import { books } from "../catalog"
import { anagramsOf } from "../study/anagrams"
import { arithmosById, arithmosCiphers, countArithmos, scanArithmos } from "../study/arithmos"
import { hebrewChart } from "../study/hebrewChart"
import { countCustom, countGematria, matchVerses, matchWords, scanForValue, type CipherId } from "../study/gematria"
import { letterLessons, lessonOf, makeLetterQuiz, speakLesson, type LetterQuiz } from "../study/letterStudy"
import { playLetterClip } from "../study/practiceAudio"
import { letterClass, letterGroups, tetragrammaton } from "../study/yetzirah"
import { speak } from "../voice"
import { anthropologyById } from "../study/biblicalAnthropology"
import { HebrewCrossingCard } from "./HebrewCrossingCard"
import { TreeOfLifePanel } from "./TreeOfLifePanel"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Tip } from "./ui/tip"

type GematriaPaneProps = {
  verse: string | null
  verseLabel: string | null
  verses: string[]
  passage: string
  /** Open chapter label, e.g. "John 3". */
  chapterLabel: string
  bookIndex: number
  chapterIndex: number
  /** Chapter counts per book (same order as catalog books). */
  chapterCounts: number[]
  original?: string | null
  onStudy: (phrase: string) => void
  onLetter: (glyph: string) => void
  onCopy?: (text: string) => void
  onSave?: (label: string, text: string, tags: string[]) => void
  onSearchOutside?: (query: string) => void
  onOpen?: (ref: string) => void
  onRoots?: (query: string) => void
  onStrong?: (id: string) => void
  onAsk?: (question: string) => void
  /** Move the desk Bible to a book/chapter (0-based chapter). */
  onPlace: (book: number, chapter: number) => void
}

const cipherKey = "anointed-staff.cipher"
const phrasesKey = "anointed-staff.gematria-phrases"
const knownKey = "anointed-staff.letters-known"
const toolKey = "anointed-staff.gem-tool"

function readPhrases(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(phrasesKey) ?? "[]") as unknown
    return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === "string").slice(0, 24) : []
  } catch {
    return []
  }
}

function readKnown(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(knownKey) ?? "[]") as unknown
    return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

const ciphers = [
  { id: "jewish", label: "Jewish", note: "English letters on the Hebrew number line" },
  { id: "english", label: "English", note: "Each letter six times its place" },
  { id: "simple", label: "Simple", note: "A is 1 through Z is 26" },
  { id: "hebrew", label: "Hebrew", note: "Mispar, with final forms at 500–900" },
] as const

const featuredArithmos = ["standard", "ordinal", "reduced", "sumerian"]
const tools = [
  { id: "learn", label: "Learn letters" },
  { id: "tree", label: "Tree of Life" },
  { id: "anagrams", label: "Anagrams" },
  { id: "chart", label: "Chart" },
  { id: "more", label: "More ciphers" },
  { id: "scan", label: "Scanner" },
  { id: "words", label: "Word art" },
  { id: "ohb", label: "OHB Genesis" },
] as const

type ToolId = (typeof tools)[number]["id"]

function readTool(): ToolId {
  const saved = localStorage.getItem(toolKey)
  return tools.some((item) => item.id === saved) ? (saved as ToolId) : "learn"
}

function verseNeedle(text: string) {
  const first = text.trim().toLowerCase().split(/\s+/)[0]?.replace(/[^a-z]/g, "") ?? ""
  return first.length >= 4 ? first : ""
}

function AnagramList({
  title,
  hits,
  empty,
  onPick,
}: {
  title: string
  hits: { word: string; script: "latin" | "hebrew" }[]
  empty: string
  onPick: (word: string) => void
}) {
  return (
    <div className="anagram-block">
      <p className="eyebrow">{title}</p>
      {hits.length ? (
        <div className="chip-row anagram-chips">
          {hits.map((hit) => (
            <button key={`${title}-${hit.word}`} type="button" className="chip" dir={hit.script === "hebrew" ? "rtl" : "auto"} onClick={() => onPick(hit.word)}>
              {hit.word}
            </button>
          ))}
        </div>
      ) : (
        <p className="quiet">{empty}</p>
      )}
    </div>
  )
}

export function GematriaPane({
  verse,
  verseLabel,
  verses,
  passage,
  chapterLabel,
  bookIndex,
  chapterIndex,
  chapterCounts,
  original,
  onStudy,
  onLetter,
  onCopy,
  onSave,
  onSearchOutside,
  onOpen,
  onRoots,
  onStrong,
  onAsk,
  onPlace,
}: GematriaPaneProps) {
  const [phrase, setPhrase] = useState("")
  const [phrases, setPhrases] = useState<string[]>(readPhrases)
  const [cipher, setCipher] = useState<CipherId>("jewish")
  const [picked, setPicked] = useState(letterLessons[0]?.glyph ?? "")
  const [chartQuery, setChartQuery] = useState("")
  const [target, setTarget] = useState("613")
  const [scanCipher, setScanCipher] = useState<string>("jewish")
  const [customText, setCustomText] = useState("a 1\nb 2\nc 3")
  const [scanned, setScanned] = useState(false)
  const [addLetters, setAddLetters] = useState(false)
  const [addWords, setAddWords] = useState(false)
  const [tool, setTool] = useState<ToolId | null>(readTool)
  const [known, setKnown] = useState<string[]>(readKnown)
  const [quiz, setQuiz] = useState<LetterQuiz>(() => makeLetterQuiz())
  const [quizPick, setQuizPick] = useState<string | null>(null)
  const [wordArt, setWordArt] = useState<{ file: string; label: string }[]>([])
  const [ohb, setOhb] = useState<{ verse: string; kjv: string; tokens: { hebrew: string; translit: string; strong: string }[] }[] | null>(null)
  const [ohbIndex, setOhbIndex] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem(cipherKey)
    if (saved) setCustomText(saved)
  }, [])

  useEffect(() => {
    setScanned(false)
  }, [bookIndex, chapterIndex, passage])

  useEffect(() => {
    let cancel = false
    fetch("/brand/words/catalog.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { items?: { file: string; label: string }[] } | null) => {
        if (!cancel && data?.items) setWordArt(data.items)
      })
      .catch(() => undefined)
    return () => {
      cancel = true
    }
  }, [])

  useEffect(() => {
    if (tool !== "ohb" || ohb) return
    let cancel = false
    fetch("/ohb/genesis.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { rows?: { verse: string; kjv: string; tokens: { hebrew: string; translit: string; strong: string }[] }[] } | null) => {
        if (!cancel && data?.rows) setOhb(data.rows)
      })
      .catch(() => undefined)
    return () => {
      cancel = true
    }
  }, [tool, ohb])

  const lastSeed = useRef<string | null>(null)
  useEffect(() => {
    if (!verse) return
    // Seed from the open verse when empty, or when the verse changed and phrase still matched the previous seed.
    if (!phrase.trim() || (lastSeed.current != null && phrase === lastSeed.current)) {
      setPhrase(verse)
      lastSeed.current = verse
    }
  }, [verse])

  const chaptersHere = Math.max(1, chapterCounts[bookIndex] ?? 1)
  const canPrev = bookIndex > 0 || chapterIndex > 0
  const canNext = bookIndex < books.length - 1 || chapterIndex < chaptersHere - 1

  function goRelative(step: -1 | 1) {
    if (step < 0) {
      if (chapterIndex > 0) onPlace(bookIndex, chapterIndex - 1)
      else if (bookIndex > 0) {
        const prevBook = bookIndex - 1
        const last = Math.max(0, (chapterCounts[prevBook] ?? 1) - 1)
        onPlace(prevBook, last)
      }
      return
    }
    if (chapterIndex < chaptersHere - 1) onPlace(bookIndex, chapterIndex + 1)
    else if (bookIndex < books.length - 1) onPlace(bookIndex + 1, 0)
  }

  const count = useMemo(() => countGematria(phrase), [phrase])
  const ready = Boolean(phrase.trim())
  const total = count[cipher]
  const lesson = lessonOf(picked)
  const chartLetter = hebrewChart.find((item) => item.glyph === picked) ?? hebrewChart[0]
  const needle = chartQuery.trim().toLowerCase()
  const shown = hebrewChart.filter(
    (item) => !needle || `${item.glyph} ${item.name} ${item.english} ${item.picture} ${item.meaning} ${item.attribution}`.toLowerCase().includes(needle),
  )
  const chartHits = hebrewChart.filter((item) => item.value === total && total > 0)
  const customValues = useMemo(() => {
    const values: Record<string, number> = {}
    for (const line of customText.split(/\n/)) {
      const match = line.trim().match(/^(\S+)\s+(-?\d+)$/)
      if (match) values[match[1].toLowerCase()] = Number(match[2])
    }
    return values
  }, [customText])
  const arithmosOptions = useMemo(() => ({ characters: addLetters, words: addWords }), [addLetters, addWords])
  const arithmosTotals = useMemo(
    () => arithmosCiphers.map((item) => ({ cipher: item, total: countArithmos(phrase, item.values, arithmosOptions) })),
    [phrase, arithmosOptions],
  )
  const wordHits = useMemo(() => (ready && total ? matchWords(passage || phrase, total, cipher) : []), [ready, passage, phrase, total, cipher])
  const verseHits = useMemo(() => (ready && total && verses.length ? matchVerses(verses, total, cipher) : []), [ready, verses, total, cipher])
  const scanHits = useMemo(() => {
    if (!scanned) return []
    const goal = Number(target)
    if (!Number.isFinite(goal)) return []
    const method = arithmosById(scanCipher)
    if (method) return scanArithmos(passage || phrase, goal, method.values)
    return scanForValue(passage || phrase, goal, scanCipher as CipherId | "custom", customValues)
  }, [scanned, target, passage, phrase, scanCipher, customValues])
  const anagrams = useMemo(
    () => anagramsOf(phrase, { latin: [passage, verse ?? ""].join(" "), hebrew: [original ?? "", phrase].join(" ") }),
    [phrase, passage, verse, original],
  )
  const customTotal = countCustom(phrase, customValues)
  const outside = verseNeedle(phrase)
  const active = ciphers.find((item) => item.id === cipher) ?? ciphers[0]
  const usedGlyphs = new Set(count.parts.map((part) => part.glyph))
  const sampleCount = countGematria(lesson.sample.hebrew)
  const knownCount = letterLessons.filter((item) => known.includes(item.glyph)).length
  const quizAnswer = lessonOf(quiz.answer)

  function keepPhrases(next: string[]) {
    setPhrases(next)
    localStorage.setItem(phrasesKey, JSON.stringify(next))
  }

  function keepKnown(next: string[]) {
    setKnown(next)
    localStorage.setItem(knownKey, JSON.stringify(next))
  }

  function chooseTool(id: ToolId | null) {
    setTool(id)
    if (id) localStorage.setItem(toolKey, id)
  }

  function openScan(value: number, method: string) {
    setTarget(String(value))
    setScanCipher(method)
    setScanned(true)
    chooseTool("scan")
  }

  function pickLetter(glyph: string, nextTool: ToolId = "learn") {
    const match = letterLessons.find((item) => item.glyph === glyph || item.sofit?.glyph === glyph)
    setPicked(match?.glyph ?? glyph)
    chooseTool(nextTool)
  }

  function answerQuiz(glyph: string) {
    setQuizPick(glyph)
    if (glyph === quiz.answer && !known.includes(glyph)) keepKnown([...known, glyph])
  }

  const totalsText = () =>
    [
      `"${phrase.trim()}"`,
      ...ciphers.map((item) => `${item.label}: ${count[item.id]}`),
      ...arithmosTotals.filter((item) => featuredArithmos.includes(item.cipher.id)).map((item) => `${item.cipher.name}: ${item.total}`),
    ].join("\n")

  return (
    <div className="gem-desk">
      <header className="lex-head">
        <p className="eyebrow">Gematria</p>
        <h2>Learn the letters, then count</h2>
        <p className="quiet">
          Twenty-two letters, their numbers, and the words you can rearrange from them. Matches come from this chapter and the Hebrew chart — not a public phrase dump.
        </p>
      </header>

      <label className="sr" htmlFor="gem-query">
        Word or verse to count
      </label>
      <Input
        id="gem-query"
        className="gem-search"
        value={phrase}
        dir="auto"
        placeholder={verseLabel ? `Type a word, or use ${verseLabel}` : "Type a word or a verse"}
        onChange={(event) => setPhrase(event.target.value)}
      />
      <div className="gem-actions writing-tools">
        <Button type="button" size="sm" disabled={!verse} onClick={() => verse && setPhrase(verse)}>
          {verseLabel ? `Use ${verseLabel}` : "Use this verse"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setPhrase(tetragrammaton.letters)
            setCipher("hebrew")
            pickLetter("י")
          }}
        >
          YHVH · {tetragrammaton.total}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setPhrase("אמן")
            setCipher("hebrew")
            pickLetter("א")
            chooseTool("anagrams")
          }}
        >
          <Shuffle />
          אמן
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={!ready} onClick={() => onStudy(phrase.trim())}>
          <Sparkles />
          Write into the study
        </Button>
        {onSave ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!ready}
            onClick={() =>
              onSave(
                `${phrase.trim().slice(0, 48)} · ${active.label} ${total}`,
                `${phrase.trim()}\n${ciphers.map((item) => `${item.label} ${count[item.id]}`).join(" · ")}${verseLabel ? `\nBeside ${verseLabel}` : ""}`,
                ["gematria", cipher],
              )
            }
          >
            <NotebookPen />
            Save to notes
          </Button>
        ) : null}
        {onSearchOutside && outside ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onSearchOutside(outside)}>
            <ScrollText />
            Extra-canon
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!ready || phrases.includes(phrase.trim())}
          onClick={() => keepPhrases([phrase.trim(), ...phrases].slice(0, 24))}
        >
          <Bookmark />
          Keep
        </Button>
        {onCopy ? (
          <Button type="button" size="sm" variant="outline" disabled={!ready} onClick={() => onCopy(totalsText())}>
            <Copy />
            Copy
          </Button>
        ) : null}
      </div>
      {phrases.length ? (
        <div className="chip-row gem-phrases" role="group" aria-label="Kept phrases">
          {phrases.map((item) => (
            <span key={item} className="gem-phrase">
              <button type="button" onClick={() => setPhrase(item)} dir="auto">
                {item}
              </button>
              <button type="button" aria-label={`Forget ${item}`} onClick={() => keepPhrases(phrases.filter((other) => other !== item))}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {ready ? (
        <article className="gem-result" aria-live="polite">
          <p className="eyebrow">Result</p>
          <p className="gem-query-line">{phrase.trim()}</p>
          <p className="gem-total">
            {total.toLocaleString()}
            <small>
              {active.label}
              {total === 0 ? " · no letters this cipher counts" : ""}
            </small>
          </p>
          <p className="quiet">{active.note}. Choose another cipher to reread the same phrase.</p>
          <div className="gem-ciphers" role="tablist" aria-label="Cipher">
            {ciphers.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={cipher === item.id}
                onClick={() => setCipher(item.id)}
              >
                <small>{item.label}</small>
                <strong>{count[item.id].toLocaleString()}</strong>
              </button>
            ))}
          </div>
          <div className="gem-decode" aria-label={`${active.label} letter values`}>
            {count.parts.map((part, index) =>
              part.glyph === " " ? (
                <span key={index} className="gem-gap" />
              ) : (
                <button
                  key={index}
                  type="button"
                  className="gem-decode-letter"
                  onClick={() => /[\u05D0-\u05EA]/.test(part.glyph) && pickLetter(part.glyph)}
                >
                  {part.glyph}
                  <small>{part[cipher] || "·"}</small>
                </button>
              ),
            )}
          </div>
        </article>
      ) : (
        <p className="quiet">Start with a word, or count the open verse. The result, the letter values, and the chapter matches will sit here.</p>
      )}

      {ready && total > 0 ? (
        <section className="gem-matches" aria-label="Matches">
          <p className="eyebrow">Same {active.label} value · {total.toLocaleString()}</p>
          {chartHits.length ? (
            <div className="strong-verse" role="group" aria-label="Chart letters with this value">
              <span className="strong-label">Chart</span>
              {chartHits.map((item) => (
                <button
                  key={`${item.glyph}-${item.name}`}
                  type="button"
                  className="chip"
                  onClick={() => pickLetter(item.glyph)}
                >
                  {item.glyph} {item.name} · {item.value}
                </button>
              ))}
            </div>
          ) : (
            <p className="quiet">No single chart letter equals this total. The number belongs to the whole phrase.</p>
          )}
          {wordHits.length ? (
            <table className="gem-table">
              <caption>Words in this chapter</caption>
              <thead>
                <tr>
                  <th>Word</th>
                  <th>Jewish</th>
                  <th>English</th>
                  <th>Simple</th>
                  <th>Hebrew</th>
                </tr>
              </thead>
              <tbody>
                {wordHits.map((hit) => (
                  <tr key={hit.word}>
                    <td>
                      <button type="button" onClick={() => setPhrase(hit.word)}>
                        {hit.word}
                      </button>
                    </td>
                    <td>{hit.jewish}</td>
                    <td>{hit.english}</td>
                    <td>{hit.simple}</td>
                    <td>{hit.hebrew || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="quiet">No other word in this chapter totals {total.toLocaleString()} in {active.label}.</p>
          )}
          {verseHits.length ? (
            <ul className="gem-verse-hits">
              {verseHits.map((hit) => (
                <li key={hit.n}>
                  <button type="button" onClick={() => setPhrase(hit.text)}>
                    <b>Verse {hit.n}</b>
                    <small>{hit.text}</small>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="quiet">
            Click a word to count it. Anagrams keep the same letters. The scanner can look for this number with another method.
            <button type="button" className="link-btn" onClick={() => chooseTool("anagrams")}>
              Rearrange
            </button>
            <button type="button" className="link-btn" onClick={() => openScan(total, cipher)}>
              Scan for {total.toLocaleString()}
            </button>
          </p>
        </section>
      ) : null}

      <div className="work-shelves gem-tool-tabs" role="tablist" aria-label="Study tools">
        {tools.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={tool === item.id} onClick={() => chooseTool(tool === item.id ? null : item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tool === "learn" && lesson ? (
        <section className="gem-tool gem-learn" aria-label="Learn Hebrew letters">
          <div className="learn-progress" aria-label={`${knownCount} of 22 letters marked known`}>
            <span>{knownCount} of 22 known</span>
            <span className="learn-bar">
              <i style={{ width: `${(knownCount / 22) * 100}%` }} />
            </span>
          </div>
          <article className="learn-card">
            <div className="learn-stage">
              <p className="learn-glyph" lang="he">
                {lesson.glyph}
              </p>
              <p className="learn-paleo" aria-label={`Paleo-Hebrew ${lesson.name}`}>
                {lesson.paleo}
              </p>
              <p className="learn-value">{lesson.value}</p>
            </div>
            <div className="learn-copy">
              <p className="eyebrow">
                {lesson.groupLabel}
                {usedGlyphs.has(lesson.glyph) ? " · in this count" : ""}
              </p>
              <h3>
                {lesson.name}
                {lesson.english ? ` · ${lesson.english}` : ""}
              </h3>
              <p className="quiet">
                {lesson.sound}. Picture of {lesson.picture}. {lesson.meaning}
              </p>
              {lesson.meanings.length > 1 ? (
                <ul className="learn-meanings" aria-label="Pictograph meanings">
                  {lesson.meanings.map((gloss) => (
                    <li key={gloss}>{gloss}</li>
                  ))}
                </ul>
              ) : null}
              <p>{lesson.line}</p>
              <p className="learn-sample">
                <b dir="rtl" lang="he">
                  {lesson.sample.hebrew}
                </b>
                <span>
                  {lesson.sample.gloss} · Hebrew {sampleCount.hebrew}
                </span>
                {onOpen ? (
                  <button type="button" className="link-btn" onClick={() => onOpen(lesson.sample.ref)}>
                    {lesson.sample.ref}
                  </button>
                ) : (
                  <small>{lesson.sample.ref}</small>
                )}
              </p>
              {lesson.sofit ? (
                <p className="quiet">
                  Final form {lesson.sofit.glyph} ({lesson.sofit.name}) counts {lesson.sofit.value} in mispar.
                </p>
              ) : null}
              <p className="quiet">{lesson.groupNote}</p>
              <div className="gem-actions">
                <Tip content="Offline letter sound when available · desk voice otherwise">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      void playLetterClip(lesson.name).then((ok) => {
                        if (!ok) speak(speakLesson(lesson))
                      })
                    }}
                  >
                    <Volume2 />
                    Hear
                  </Button>
                </Tip>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const index = letterLessons.findIndex((item) => item.glyph === lesson.glyph)
                    pickLetter(letterLessons[(index + letterLessons.length - 1) % letterLessons.length].glyph)
                  }}
                >
                  <ChevronLeft />
                  Prev
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const index = letterLessons.findIndex((item) => item.glyph === lesson.glyph)
                    pickLetter(letterLessons[(index + 1) % letterLessons.length].glyph)
                  }}
                >
                  Next
                  <ChevronRight />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setPhrase((current) => `${current}${lesson.glyph}`)}>
                  Add {lesson.glyph}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={known.includes(lesson.glyph) ? "default" : "outline"}
                  onClick={() =>
                    keepKnown(known.includes(lesson.glyph) ? known.filter((item) => item !== lesson.glyph) : [...known, lesson.glyph])
                  }
                >
                  <GraduationCap />
                  {known.includes(lesson.glyph) ? "Known" : "Mark known"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => onLetter(lesson.glyph)}>
                  Strong's
                </Button>
                {onRoots ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => onRoots(lesson.glyph)}>
                    Roots
                  </Button>
                ) : null}
                {onSearchOutside ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => onSearchOutside(lesson.name)}>
                    <ScrollText />
                    Extra-canon
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
          <div className="learn-alpha" role="listbox" aria-label="Hebrew alphabet">
            {letterLessons.map((item) => (
              <button
                key={item.glyph}
                type="button"
                role="option"
                aria-selected={item.glyph === lesson.glyph}
                data-known={known.includes(item.glyph) ? "true" : "false"}
                data-in={usedGlyphs.has(item.glyph) ? "true" : "false"}
                onClick={() => pickLetter(item.glyph)}
              >
                <strong lang="he">{item.glyph}</strong>
                <small>{item.value}</small>
              </button>
            ))}
          </div>
          <div className="learn-finals" role="group" aria-label="Final forms">
            {letterLessons
              .filter((item) => item.sofit)
              .map((item) => (
                <button
                  key={item.sofit?.glyph}
                  type="button"
                  className="chip"
                  onClick={() => {
                    if (item.sofit) setPhrase((current) => `${current}${item.sofit?.glyph}`)
                    pickLetter(item.glyph)
                  }}
                >
                  {item.sofit?.glyph} {item.sofit?.value}
                </button>
              ))}
          </div>
          {letterGroups.map((group) => (
            <div key={group.id} className="strong-verse" role="group" aria-label={group.label}>
              <span className="strong-label">{group.label}</span>
              {letterLessons
                .filter((item) => letterClass(item.glyph) === group.id)
                .map((item) => (
                  <button
                    key={item.glyph}
                    type="button"
                    className="chip"
                    data-picked={item.glyph === picked ? "true" : "false"}
                    onClick={() => pickLetter(item.glyph)}
                  >
                    {item.glyph} {item.name}
                  </button>
                ))}
              <small className="quiet">{group.note}</small>
            </div>
          ))}
          <div className="learn-quiz">
            <p className="eyebrow">Drill</p>
            <p>{quiz.prompt}</p>
            <div className="learn-quiz-options">
              {quiz.options.map((glyph) => (
                <button
                  key={glyph}
                  type="button"
                  data-state={quizPick == null ? "idle" : glyph === quiz.answer ? "right" : glyph === quizPick ? "wrong" : "idle"}
                  onClick={() => answerQuiz(glyph)}
                >
                  <strong lang="he">{glyph}</strong>
                  <small>{lessonOf(glyph).name}</small>
                </button>
              ))}
            </div>
            {quizPick ? (
              <p className="quiet">
                {quizPick === quiz.answer ? "Yes." : "Not that one."} {quizAnswer.name} is {quizAnswer.picture}, value {quizAnswer.value}.
              </p>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setQuiz(makeLetterQuiz(quiz.answer))
                setQuizPick(null)
              }}
            >
              Another
            </Button>
          </div>
          <p className="rights">
            {tetragrammaton.note} {tetragrammaton.ref}. Paleo glyphs follow the same number line as the square script. Mothers, doubles, and simples follow Sefer Yetzirah’s grouping, not a copyrighted commentary.
          </p>
        </section>
      ) : null}

      {tool === "tree" ? (
        <section className="gem-tool" aria-label="Tree of Life">
          <TreeOfLifePanel
            onOpenRef={onOpen}
            onAsk={onAsk}
            onLetter={(glyph) => pickLetter(glyph, "learn")}
            onOpenYetzirah={onSearchOutside ? () => onSearchOutside("yetzirah") : undefined}
          />
          <p className="rights">
            Desk map from Genesis 1 Elohim tradition + Sefer Yetzirah letter groups. Western path numbers and Hermetic titles are study labels only — no Tarot draw, no Thelemic chart image.
          </p>
        </section>
      ) : null}

      {tool === "anagrams" ? (
        <section className="gem-tool gem-anagrams" aria-label="Anagram generator">
          <p className="quiet">
            Rearrangements keep the same letters, so they keep the same Simple or Hebrew total. Exact matches and shorter words are taken from this chapter
            {original ? " and the open Hebrew line" : ""}. Nothing is pulled from a copyrighted word list.
          </p>
          {anagrams.script === "empty" ? (
            <p className="quiet">Type a word of two or more letters, or fill אמן / live.</p>
          ) : (
            <>
              <p className="anagram-bag" aria-label="Letter bag">
                {anagrams.letters.map((glyph, index) => (
                  <span key={`${glyph}-${index}`}>
                    {glyph}
                    <small>
                      {anagrams.script === "hebrew"
                        ? hebrewChart.find((item) => item.glyph === glyph)?.value ?? ""
                        : glyph.charCodeAt(0) - 96}
                    </small>
                  </span>
                ))}
              </p>
              {anagrams.truncated ? <p className="quiet">This phrase is long for a full shuffle. Chapter matches and shorter words still run.</p> : null}
              <AnagramList
                title="Rearrangements"
                hits={anagrams.hits.filter((hit) => hit.kind === "rearrange")}
                empty={anagrams.truncated ? "Too many letters to list every shuffle." : "No other order of these letters."}
                onPick={setPhrase}
              />
              <AnagramList
                title="Same letters in this chapter"
                hits={anagrams.hits.filter((hit) => hit.kind === "chapter")}
                empty="No other word in this chapter uses exactly these letters."
                onPick={setPhrase}
              />
              <AnagramList
                title="Words you can make"
                hits={anagrams.hits.filter((hit) => hit.kind === "from-letters")}
                empty="No shorter chapter word hides inside this bag."
                onPick={setPhrase}
              />
              <AnagramList
                title="Two-word splits"
                hits={anagrams.hits.filter((hit) => hit.kind === "pair")}
                empty="No two chapter words share this bag exactly."
                onPick={setPhrase}
              />
            </>
          )}
          <div className="gem-actions">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setPhrase("live")
                setCipher("simple")
              }}
            >
              live
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setPhrase("אמן")
                setCipher("hebrew")
              }}
            >
              אמן
            </Button>
            {original ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setPhrase(original)}>
                Use Hebrew line
              </Button>
            ) : null}
          </div>
          <p className="rights">An anagram is a reshuffle, not a cipher. Same-value words that use different letters sit in the match table above.</p>
        </section>
      ) : null}

      {tool === "chart" && chartLetter ? (
        <section className="gem-tool" aria-label="Hebrew chart">
          <div className="gem-letter">
            <p className="gem-letter-glyph">{chartLetter.glyph}</p>
            <div>
              <p className="eyebrow">{chartLetter.value}</p>
              <h3>
                {chartLetter.name}
                {chartLetter.english ? ` · ${chartLetter.english}` : ""}
              </h3>
              <p className="quiet">
                {chartLetter.picture}. {chartLetter.meaning}
              </p>
              <div className="gem-actions">
                <Button type="button" size="sm" variant="outline" onClick={() => setPhrase((current) => `${current}${chartLetter.glyph}`)}>
                  Add {chartLetter.glyph} to the count
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => pickLetter(chartLetter.glyph)}>
                  Study {chartLetter.name}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => onLetter(chartLetter.glyph)}>
                  Strong's for {chartLetter.glyph}
                </Button>
                {onRoots ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => onRoots(chartLetter.glyph)}>
                    Roots for {chartLetter.glyph}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
          <Input value={chartQuery} placeholder="Search the chart" aria-label="Search the Hebrew chart" onChange={(event) => setChartQuery(event.target.value)} />
          <ul className="chart-grid">
            {shown.map((item) => (
              <li key={`${item.glyph}-${item.name}`}>
                <button
                  type="button"
                  className="chart-card"
                  data-hit={chartHits.some((hit) => hit.glyph === item.glyph) ? "true" : "false"}
                  data-picked={item.glyph === chartLetter.glyph ? "true" : "false"}
                  onClick={() => setPicked(item.glyph)}
                >
                  <strong>{item.glyph}</strong>
                  <b>{item.name}</b>
                  <small>{item.value}</small>
                  <span>{item.picture}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="rights">The letter chart is the Born Identity table from your study file. Strong's opens the Hebrew entries that begin with the letter.</p>
        </section>
      ) : null}

      {tool === "more" ? (
        <section className="gem-tool" aria-label="More ciphers">
          <p className="quiet">Standard, Ordinal, Reduced, and Sumerian are the extra desk methods. The rest are the Arithmos tables.</p>
          <div className="gem-actions">
            <label>
              <input type="checkbox" checked={addLetters} onChange={(event) => setAddLetters(event.target.checked)} /> Add letter count
            </label>
            <label>
              <input type="checkbox" checked={addWords} onChange={(event) => setAddWords(event.target.checked)} /> Add word count
            </label>
          </div>
          <div className="arithmos-grid gem-featured">
            {arithmosTotals
              .filter((item) => featuredArithmos.includes(item.cipher.id))
              .map((item) => (
                <Tip key={item.cipher.id} content={`Scan this chapter for ${item.total} in ${item.cipher.name}`}>
                  <button type="button" onClick={() => openScan(item.total, item.cipher.id)}>
                    <small>{item.cipher.name}</small>
                    <strong>{item.total.toLocaleString()}</strong>
                  </button>
                </Tip>
              ))}
          </div>
          {(["Combined", "English", "Greek", "Hebrew"] as const).map((group) => (
            <details key={group} className="gem-more">
              <summary>{group}</summary>
              <div className="arithmos-grid">
                {arithmosTotals
                  .filter((item) => item.cipher.group === group)
                  .map((item) => (
                    <button key={item.cipher.id} type="button" onClick={() => openScan(item.total, item.cipher.id)}>
                      <small>{item.cipher.name}</small>
                      <strong>{item.total.toLocaleString()}</strong>
                    </button>
                  ))}
              </div>
            </details>
          ))}
          <p className="rights">
            Extra tables from <a href="https://github.com/dlascelles/Arithmos">Arithmos</a> by Daniel Lascelles, 2018–2024, MIT License. Jewish, English, Simple, and final-form Hebrew stay with this desk.
          </p>
        </section>
      ) : null}

      {tool === "words" ? (
        <section className="gem-tool" aria-label="Hebrew word art">
          <p className="quiet">
            Pictorial word studies — including Hebrew (עבר) as cross over · eye in head — plus anoint, redeem, pray, holy, good, and righteous.
          </p>
          <HebrewCrossingCard
            layout="featured"
            onOpenRef={onOpen}
            onStrong={onStrong}
            onAsk={onAsk}
            onFillWord={(word) => {
              setPhrase(word)
              chooseTool(null)
            }}
            onOpenAnthropology={
              onAsk && anthropologyById("habiru")
                ? () => onAsk(anthropologyById("habiru")!.askPrompt)
                : undefined
            }
          />
          {wordArt.filter((item) => !item.file.includes("Hebrew-AyinBethResh")).length ? (
            <div className="word-art-grid">
              {wordArt
                .filter((item) => !item.file.includes("Hebrew-AyinBethResh"))
                .map((item) => (
                  <figure key={item.file}>
                    <img src={item.file} alt={item.label} width={160} height={160} loading="lazy" />
                    <figcaption>{item.label}</figcaption>
                  </figure>
                ))}
            </div>
          ) : (
            <p className="quiet">Word art is still loading…</p>
          )}
          <p className="rights">
            Anointed Staff word art · עבר letter vision is desk study with Strong’s (H5674 / H5680). Historical gematria: Bond &amp; Lea
            (1917) under Hermetic.
          </p>
        </section>
      ) : null}

      {tool === "ohb" ? (
        <section className="gem-tool" aria-label="Original Hebrew Bible Genesis sample">
          <p className="quiet">First fifty Genesis verses from the Original Hebrew Bible spreadsheet. BSB English is refused; KJV line + Hebrew tokens + Strong&apos;s only.</p>
          {!ohb ? <p className="quiet">Loading Genesis sample…</p> : null}
          {ohb?.length ? (
            <div className="ohb-sample">
              <div className="gem-actions">
                <Button type="button" size="sm" variant="outline" disabled={ohbIndex <= 0} onClick={() => setOhbIndex((i) => Math.max(0, i - 1))}>
                  Previous verse
                </Button>
                <b>{ohb[ohbIndex]?.verse}</b>
                <Button type="button" size="sm" variant="outline" disabled={ohbIndex >= ohb.length - 1} onClick={() => setOhbIndex((i) => Math.min(ohb.length - 1, i + 1))}>
                  Next verse
                </Button>
              </div>
              <p className="gem-query-line">{ohb[ohbIndex]?.kjv}</p>
              <div className="ohb-tokens" aria-label="Hebrew tokens">
                {[...(ohb[ohbIndex]?.tokens ?? [])].reverse().map((token, index) => (
                  <span key={`${token.strong}-${index}`}>
                    <b>{token.hebrew || "·"}</b>
                    <small>{token.translit}</small>
                    <small>{token.strong}</small>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <p className="rights">Anointed Staff Original Hebrew sample (Genesis) · public domain. Full OT kept as a study source outside the desk.</p>
        </section>
      ) : null}

      {tool === "scan" ? (
        <section className="gem-tool" aria-label="Chapter scanner">
          <p className="quiet">Find words that total a number in the chapter below. A custom cipher is a letter and a value on each line.</p>
          <div className="gem-scan-place" aria-label="Chapter to scan">
            <p className="eyebrow">Scanning</p>
            <b className="gem-scan-label">{chapterLabel}</b>
            <div className="gem-scan-pick">
              <Tip content="Previous chapter">
                <button type="button" className="icon-btn" aria-label="Previous chapter" disabled={!canPrev} onClick={() => goRelative(-1)}>
                  <ChevronLeft size={16} />
                </button>
              </Tip>
              <label className="sr" htmlFor="gem-scan-book">
                Book
              </label>
              <select
                id="gem-scan-book"
                aria-label="Book to scan"
                value={bookIndex}
                onChange={(event) => {
                  const book = Number(event.target.value)
                  const count = Math.max(1, chapterCounts[book] ?? 1)
                  onPlace(book, Math.min(chapterIndex, count - 1))
                }}
              >
                {books.map((book, index) => (
                  <option key={book.name} value={index} disabled={(chapterCounts[index] ?? 0) < 1}>
                    {book.name}
                  </option>
                ))}
              </select>
              <label className="sr" htmlFor="gem-scan-chapter">
                Chapter
              </label>
              <select
                id="gem-scan-chapter"
                aria-label="Chapter to scan"
                value={chapterIndex}
                onChange={(event) => onPlace(bookIndex, Number(event.target.value))}
              >
                {Array.from({ length: chaptersHere }, (_, index) => (
                  <option key={index} value={index}>
                    {index + 1}
                  </option>
                ))}
              </select>
              <Tip content="Next chapter">
                <button type="button" className="icon-btn" aria-label="Next chapter" disabled={!canNext} onClick={() => goRelative(1)}>
                  <ChevronRight size={16} />
                </button>
              </Tip>
            </div>
            <p className="quiet m-0">
              {verses.length
                ? `${verses.length} verses in the open translation · same chapter as the Bible pane`
                : "This translation has no text for that chapter. Pick another book or translation."}
            </p>
          </div>
          <div className="gem-actions">
            <Input
              value={target}
              aria-label="Value to find"
              onChange={(event) => {
                setTarget(event.target.value)
                setScanned(false)
              }}
            />
            <select
              aria-label="Cipher"
              value={scanCipher}
              onChange={(event) => {
                setScanCipher(event.target.value)
                setScanned(false)
              }}
            >
              {ciphers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
              {arithmosCiphers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            <Button
              type="button"
              size="sm"
              disabled={!passage.trim()}
              onClick={() => {
                localStorage.setItem(cipherKey, customText)
                setScanned(true)
              }}
            >
              Scan {chapterLabel}
            </Button>
          </div>
          {scanCipher === "custom" ? (
            <textarea className="report" aria-label="Custom cipher" value={customText} onChange={(event) => { setCustomText(event.target.value); setScanned(false) }} />
          ) : null}
          {scanCipher === "custom" ? <p className="quiet">This phrase totals {customTotal.toLocaleString()} in the custom cipher.</p> : null}
          {scanned ? (
            scanHits.length ? (
              <>
                <p className="quiet m-0">
                  {scanHits.length} match{scanHits.length === 1 ? "" : "es"} in {chapterLabel}
                </p>
                <ul className="strong-hits">
                  {scanHits.map((hit) => (
                    <li key={hit.word}>
                      <button type="button" onClick={() => setPhrase(hit.word)}>
                        <b>{hit.word}</b>
                        <span>{hit.value}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="quiet">No word in {chapterLabel} totals {target}.</p>
            )
          ) : null}
          <p className="rights">Scanning walks each word and sums the selected cipher. Arithmos methods ignore letters that cipher does not define.</p>
        </section>
      ) : null}
    </div>
  )
}

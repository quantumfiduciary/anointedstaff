import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { BookOpen, Check, Eye, EyeOff, FileDown, Headphones, Pause, Play, RotateCcw, Volume2 } from "lucide-react"
import { exportPdf, fileSafe } from "../pdf"
import { checkParse, parseHelp, parseStance, shuffleCards, type ParseCard } from "../study/hebrewParse"
import {
  ensurePracticeManifest,
  guideSrcFor,
  playLetterClip,
  playPracticeCue,
  stopPracticeBedIfKind,
  stopPracticeVoiceAudio,
  writePracticeCuesOn,
} from "../study/practiceAudio"
import { PracticeBedToggle } from "./PracticeBedToggle"
import {
  buildDeck,
  deckLabels,
  readCardProgress,
  writeCardProgress,
  type CardDeckId,
  type FlashCard,
} from "../study/practiceCards"
import { canSpeak, speak, stopSpeaking } from "../voice"
import { PracticeGuideBar } from "./PracticeGuideBar"
import { Tip } from "./ui/tip"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"

type Piece = {
  id: string
  title: string
  credit: string
  paragraphs: string[]
}

type MeditationSession = {
  id: string
  title: string
  minutes: number
  verse: string
  audio?: string
  steps: string[]
}

type HubId = "temple" | "parse" | "cards" | "meditate" | "readings" | "journal"

type PracticePaneProps = {
  focus: string
  onOpen: (reference: string) => void
  onOpenJournal?: () => void
  practiceCues?: boolean
  onPracticeCuesChange?: (on: boolean) => void
}

const hubs: { id: HubId; label: string; hint: string }[] = [
  { id: "temple", label: "Temple", hint: "Gates of body, soul, spirit" },
  { id: "parse", label: "Drill", hint: "Hebrew verb parse" },
  { id: "cards", label: "Cards", hint: "Letters, aroma, forms" },
  { id: "meditate", label: "Meditate", hint: "Timed quiet practices" },
  { id: "readings", label: "Readings", hint: "Aroma, prayers, lists" },
  { id: "journal", label: "Journal", hint: "Open Notes → Write" },
]

const courts = [
  {
    name: "Spirit · Holy of Holies",
    verse: "John 4:24",
    note: "Glory sits at the center. These gates open inward.",
    gates: [
      ["Revelation", "Ephesians 1:17"],
      ["Intuition", "1 Corinthians 2:10"],
      ["Prayer", "Matthew 6:6"],
      ["Reverence", "Hebrews 12:28"],
      ["Faith", "Hebrews 11:1"],
      ["Hope", "Romans 5:5"],
      ["Worship", "John 4:23"],
      ["Fear of God", "Proverbs 9:10"],
      ["First Love", "Revelation 2:4"],
    ],
  },
  {
    name: "Soul · Inner Court",
    verse: "1 Thessalonians 5:23",
    note: "Conscience, thought, and will meet here.",
    gates: [
      ["Conscience", "Romans 2:15"],
      ["Reason", "Isaiah 1:18"],
      ["Imagination", "2 Corinthians 10:5"],
      ["Mind", "Romans 12:2"],
      ["Emotion", "Psalm 42:5"],
      ["Choice", "Deuteronomy 30:19"],
      ["Will", "John 7:17"],
    ],
  },
  {
    name: "Body · Outer Court",
    verse: "1 Corinthians 6:19",
    note: "The five senses are the outer gates.",
    gates: [
      ["Touch", "Luke 24:39"],
      ["Taste", "Psalm 34:8"],
      ["Smell", "2 Corinthians 2:15"],
      ["Sight", "Matthew 6:22"],
      ["Hearing", "Romans 10:17"],
    ],
  },
] as const

const walkedKey = "anointed-staff.gates-walked"

function readWalked(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(walkedKey) ?? "[]") as unknown
    return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

function focusToHub(focus: string): HubId {
  const q = focus.toLowerCase()
  if (q === "meditate" || q === "meditation" || q === "meditations") return "meditate"
  if (q === "parse" || q === "drill") return "parse"
  if (q === "cards" || q === "flashcards") return "cards"
  if (q === "journal" || q === "write") return "journal"
  if (q === "temple" || !q) return "temple"
  return "readings"
}

export function PracticePane({ focus, onOpen, onOpenJournal, practiceCues = true, onPracticeCuesChange }: PracticePaneProps) {
  const [pieces, setPieces] = useState<Piece[]>([])
  const [meditations, setMeditations] = useState<MeditationSession[]>([])
  const [medStance, setMedStance] = useState("")
  const [sessionId, setSessionId] = useState("breath")
  const [hub, setHub] = useState<HubId>(() => focusToHub(focus || "temple"))
  const [readingId, setReadingId] = useState("aroma")
  const [filter, setFilter] = useState("")
  const [walked, setWalked] = useState<string[]>(readWalked)
  const [deck, setDeck] = useState<ParseCard[]>(() => shuffleCards())
  const [cardIndex, setCardIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [verdict, setVerdict] = useState<"idle" | "right" | "wrong">("idle")
  const [score, setScore] = useState({ right: 0, tried: 0 })
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [flashDeckId, setFlashDeckId] = useState<CardDeckId>(() => readCardProgress().lastDeck)
  const [flashCards, setFlashCards] = useState<FlashCard[]>([])
  const [flashIndex, setFlashIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [cardProgress, setCardProgress] = useState(readCardProgress)
  const cuesOn = practiceCues
  const reduceMotion = useReducedMotion()
  const completedCue = useRef(false)
  const [templeGuideSrc, setTempleGuideSrc] = useState<string | null>(null)

  useEffect(() => {
    void ensurePracticeManifest().then(() => setTempleGuideSrc(guideSrcFor("temple")))
  }, [])

  function toggleGate(gate: string) {
    setWalked((current) => {
      const next = current.includes(gate) ? current.filter((item) => item !== gate) : [...current, gate]
      localStorage.setItem(walkedKey, JSON.stringify(next))
      return next
    })
  }

  useEffect(() => setFilter(""), [hub, readingId])

  useEffect(() => {
    if (!focus) return
    const nextHub = focusToHub(focus)
    setHub(nextHub)
    if (nextHub === "readings" && focus && focus !== "readings") setReadingId(focus)
  }, [focus])

  useEffect(() => {
    if (hub !== "parse") return
    setVerdict("idle")
    setAnswer("")
  }, [hub, cardIndex])

  useEffect(() => {
    if (hub !== "meditate" || !timerRunning || secondsLeft <= 0) {
      if (secondsLeft <= 0) setTimerRunning(false)
      return
    }
    const id = window.setTimeout(() => setSecondsLeft((n) => n - 1), 1000)
    return () => window.clearTimeout(id)
  }, [hub, timerRunning, secondsLeft])

  useEffect(() => {
    if (hub !== "meditate") return
    if (secondsLeft === 0 && completedCue.current) {
      playPracticeCue("complete", cuesOn)
      completedCue.current = false
    }
  }, [hub, secondsLeft, cuesOn])

  useEffect(() => {
    stopPracticeVoiceAudio()
    stopPracticeBedIfKind("meditate")
    stopSpeaking()
    setTimerRunning(false)
  }, [hub])

  useEffect(() => () => {
    stopSpeaking()
    stopPracticeVoiceAudio()
    stopPracticeBedIfKind("meditate")
  }, [])

  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [libraryTick, setLibraryTick] = useState(0)

  useEffect(() => {
    let cancel = false
    setLibraryError(null)
    Promise.all([
      fetch("/practice.json").then((response) => {
        if (!response.ok) throw new Error("practice")
        return response.json() as Promise<{ pieces?: Piece[] }>
      }),
      fetch("/practice-meditations.json").then((response) => {
        if (!response.ok) throw new Error("meditations")
        return response.json() as Promise<{ sessions?: MeditationSession[]; stance?: string }>
      }),
    ])
      .then(([piecesData, medData]) => {
        if (cancel) return
        setPieces(piecesData.pieces ?? [])
        setMeditations(medData.sessions ?? [])
        setMedStance(medData.stance ?? "")
        if (medData.sessions?.[0]) setSessionId(medData.sessions[0].id)
      })
      .catch(() => {
        if (cancel) return
        setPieces([])
        setMeditations([])
        setLibraryError("Practice library did not load.")
      })
    return () => {
      cancel = true
    }
  }, [libraryTick])

  const aromaParas = useMemo(() => pieces.find((item) => item.id === "aroma")?.paragraphs ?? [], [pieces])

  useEffect(() => {
    if (hub !== "cards") return
    setFlashCards(buildDeck(flashDeckId, aromaParas))
    setFlashIndex(0)
    setRevealed(false)
  }, [hub, flashDeckId, aromaParas])

  const card = deck[cardIndex] ?? deck[0]
  const session = meditations.find((item) => item.id === sessionId) ?? meditations[0]
  const flash = flashCards[flashIndex] ?? flashCards[0]
  const piece = pieces.find((item) => item.id === readingId) ?? pieces[0]
  const needle = filter.trim().toLowerCase()
  const lines = useMemo(() => {
    if (!piece) return []
    return piece.paragraphs
      .map((line) => line.replace(/^\uFEFF/, "").trim())
      .filter((line) => line && line.toUpperCase() !== "AROMA'S LIST")
      .filter((line) => !needle || line.toLowerCase().includes(needle))
  }, [piece, needle])
  const gateCount = courts.reduce((sum, court) => sum + court.gates.length, 0)

  function submitParse() {
    if (!card || !answer.trim()) return
    const ok = checkParse(card, answer)
    setVerdict(ok ? "right" : "wrong")
    setScore((current) => ({ right: current.right + (ok ? 1 : 0), tried: current.tried + 1 }))
    playPracticeCue(ok ? "correct" : "again", cuesOn)
  }

  function nextCard() {
    playPracticeCue("next", cuesOn)
    setCardIndex((index) => (index + 1) % deck.length)
    setAnswer("")
    setVerdict("idle")
  }

  function reshuffle() {
    setDeck(shuffleCards())
    setCardIndex(0)
    setAnswer("")
    setVerdict("idle")
    setScore({ right: 0, tried: 0 })
  }

  function startMeditationTimer() {
    if (!session) return
    completedCue.current = true
    setSecondsLeft(session.minutes * 60)
    setTimerRunning(true)
  }

  const onGuidePlay = useCallback(() => {
    if (!session) return
    if (secondsLeft <= 0) {
      completedCue.current = true
      setSecondsLeft(session.minutes * 60)
    }
    setTimerRunning(true)
  }, [session, secondsLeft])

  function formatClock(total: number) {
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  function bumpProgress(known: boolean) {
    const next = {
      seen: cardProgress.seen + 1,
      known: cardProgress.known + (known ? 1 : 0),
      lastDeck: flashDeckId,
    }
    setCardProgress(next)
    writeCardProgress(next)
  }

  function nextFlash(known: boolean) {
    bumpProgress(known)
    playPracticeCue(known ? "correct" : "again", cuesOn)
    setRevealed(false)
    setFlashIndex((index) => (flashCards.length ? (index + 1) % flashCards.length : 0))
    window.setTimeout(() => playPracticeCue("next", cuesOn), known ? 700 : 900)
  }

  function toggleCues() {
    const next = !cuesOn
    writePracticeCuesOn(next)
    onPracticeCuesChange?.(next)
  }

  async function speakFlashFront() {
    if (!flash) return
    stopSpeaking()
    playPracticeCue("reveal", cuesOn)
    if (flashDeckId === "letters") {
      const name = flash.back.split("·")[0]?.trim()
      if (name && (await playLetterClip(name))) return
    }
    if (canSpeak()) speak(flash.front.replace(/\s+/g, " ").trim())
  }

  function speakParsePrompt() {
    if (!card) return
    stopSpeaking()
    playPracticeCue("drill", cuesOn)
    if (canSpeak()) speak(`Hebrew form. Root ${card.root}. ${card.gloss}.`)
  }

  const guideSrc = session ? guideSrcFor(session.id, session.audio) : null

  function exportPiece() {
    if (!piece) return
    exportPdf({ title: piece.title, sections: lines.map((body) => ({ body })), footer: piece.credit }, `${fileSafe(piece.title)}.pdf`)
  }

  return (
    <div className="practice">
      <div className="tool-rail" aria-label="Practice hub">
        <p className="tool-rail-label">
          <b>Practice</b>
          <span>Temple · drill · cards · meditate · readings · journal</span>
        </p>
        <nav className="segmented gem-nav tool-tabs" aria-label="Practice sections">
          {hubs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={hub === item.id}
              title={item.hint}
              onClick={() => {
                void import("../lib/uiSound").then(({ playUi }) => playUi("tap"))
                setHub(item.id)
              }}
            >
              <strong>{item.label}</strong>
              <small>{item.hint}</small>
            </button>
          ))}
        </nav>
        <div className="practice-voice-bar">
          <Tip content={cuesOn ? "Turn off spoken quiz cues (correct / again / next)" : "Turn on spoken quiz cues"}>
            <button type="button" className="practice-voice-toggle" aria-pressed={cuesOn} onClick={toggleCues}>
              {cuesOn ? <Volume2 size={14} /> : <Headphones size={14} />}
              <span>{cuesOn ? "Voice cues on" : "Voice cues off"}</span>
            </button>
          </Tip>
          <PracticeBedToggle kind="meditate" active={hub === "meditate"} />
        </div>
        <p className="quiet practice-intro">
          Temple walk opens first — then Drill, Cards, Meditate, Readings, or Journal (Notes → Write).
        </p>
        {libraryError ? (
          <div className="practice-load-error" role="alert">
            <p>{libraryError}</p>
            <Button type="button" size="sm" variant="outline" onClick={() => setLibraryTick((tick) => tick + 1)}>
              Retry
            </Button>
          </div>
        ) : null}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={hub}
          className="practice-hub-pane"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
      {hub === "temple" ? (
        <div className="gate-progress" aria-label={`${walked.length} of ${gateCount} gates walked`}>
          <div className="gate-bar">
            <i style={{ width: `${(walked.length / gateCount) * 100}%` }} />
          </div>
          <small>
            {walked.length} of {gateCount} gates walked
            {walked.length ? (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setWalked([])
                  localStorage.removeItem(walkedKey)
                }}
              >
                Begin again
              </button>
            ) : null}
          </small>
        </div>
      ) : null}

      {hub === "temple" ? (
        <>
          <div className="gem-actions">
            <Input
              value={filter}
              placeholder="Find a gate"
              aria-label="Find a gate"
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
          <Card className="practice-temple-lead">
            <CardHeader className="practice-temple-head">
              <Badge>Temple</Badge>
              <CardTitle className="text-xl">The temple of the Holy Spirit</CardTitle>
              <CardDescription>Body · outer court · soul · inner court · spirit · holy of holies. Glory at the center.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="quiet practice-temple-audio-note">Spoken walk · offline</p>
              <PracticeGuideBar src={templeGuideSrc} title="Temple walk" />
              <img src="/temple-of-the-holy-spirit.jpg" alt="Temple of the Holy Spirit chart: body, soul, and spirit around Glory" />
              <Button type="button" variant="outline" onClick={() => onOpen("1 Corinthians 6:19")}>
                Open 1 Corinthians 6:19
              </Button>
            </CardContent>
          </Card>
          {courts.map((court) => {
            const gates = court.gates.filter(([gate, verse]) => !needle || `${gate} ${verse}`.toLowerCase().includes(needle))
            if (!gates.length) return null
            const done = court.gates.filter(([gate]) => walked.includes(gate)).length
            return (
              <Card key={court.name}>
                <CardHeader>
                  <CardTitle className="text-xl">{court.name}</CardTitle>
                  <CardDescription>
                    {court.note} {done}/{court.gates.length} walked.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpen(court.verse)}>
                    Open {court.verse}
                  </Button>
                  <ul className="gate-list">
                    {gates.map(([gate, verse]) => (
                      <li key={gate} data-walked={walked.includes(gate) ? "true" : "false"}>
                        <button type="button" onClick={() => onOpen(verse)}>
                          <b>{gate}</b>
                          <span>{verse}</span>
                        </button>
                        <Tip content={walked.includes(gate) ? "Mark as still to walk" : "Mark this gate walked"}>
                          <button
                            type="button"
                            className="gate-check"
                            aria-pressed={walked.includes(gate)}
                            aria-label={`${gate} walked`}
                            onClick={() => toggleGate(gate)}
                          >
                            <Check size={14} />
                          </button>
                        </Tip>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
          <p className="rights">The chart is your Temple of the Holy Spirit image. Each gate opens a verse already in this library.</p>
        </>
      ) : null}

      {hub === "parse" && card ? (
        <Card className="parse-drill">
          <CardHeader>
            <Badge>Hebrew parse</Badge>
            <CardTitle className="text-xl">Recognize the verb</CardTitle>
            <CardDescription>{parseStance}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="parse-form" lang="he" dir="rtl">
              {card.form}
            </p>
            <p className="quiet">
              Root {card.root} · {card.gloss}
              {score.tried ? ` · score ${score.right}/${score.tried}` : ""} · card {cardIndex + 1}/{deck.length}
            </p>
            <p className="quiet">{parseHelp}</p>
            <label className="setting-field">
              Your parse
              <Input
                value={answer}
                placeholder="Q pf 3ms"
                aria-label="Hebrew verb parse answer"
                onChange={(event) => {
                  setAnswer(event.target.value)
                  setVerdict("idle")
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    if (verdict === "idle") submitParse()
                    else nextCard()
                  }
                }}
              />
            </label>
            <div className="sky-actions">
              <Button type="button" size="sm" onClick={submitParse} disabled={!answer.trim() || verdict !== "idle"}>
                Check
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={nextCard}>
                Next
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={speakParsePrompt}>
                <Headphones size={14} /> Hear prompt
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={reshuffle}>
                <RotateCcw size={14} /> Shuffle
              </Button>
              {card.sample ? (
                <Button type="button" size="sm" variant="outline" onClick={() => onOpen(card.sample!)}>
                  {card.sample}
                </Button>
              ) : null}
            </div>
            {verdict === "right" ? <p className="parse-ok">Right — {card.label}.</p> : null}
            {verdict === "wrong" ? (
              <p className="parse-bad">
                Not yet. Expected <b>{card.label}</b> (<code>{card.tags.join(" ")}</code>).
              </p>
            ) : null}
            <p className="rights">
              Anointed Staff Hebrew parse · Check / Next play short voice cues when Voice cues are on · Hear prompt uses the desk voice for the root gloss.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {hub === "cards" ? (
        <Card className="parse-drill">
          <CardHeader>
            <Badge>Flashcards</Badge>
            <CardTitle className="text-xl">{deckLabels[flashDeckId]}</CardTitle>
            <CardDescription>
              Desk decks only — letters, aroma list, and verb forms. Seen {cardProgress.seen}
              {cardProgress.known ? ` · marked known ${cardProgress.known}` : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <label className="setting-field">
              Deck
              <select
                aria-label="Flashcard deck"
                value={flashDeckId}
                onChange={(event) => setFlashDeckId(event.target.value as CardDeckId)}
              >
                {(Object.keys(deckLabels) as CardDeckId[]).map((id) => (
                  <option key={id} value={id}>
                    {deckLabels[id]}
                  </option>
                ))}
              </select>
            </label>
            {flash ? (
              <>
                <p className="parse-form" lang={flashDeckId === "letters" || flashDeckId === "parse" ? "he" : undefined}>
                  {flash.front}
                </p>
                {revealed ? (
                  <p className="parse-ok" style={{ whiteSpace: "pre-wrap" }}>
                    {flash.back}
                    {flash.hint ? `\n(${flash.hint})` : ""}
                  </p>
                ) : (
                  <p className="quiet">Reveal when you have an answer in mind.</p>
                )}
                <p className="quiet">
                  Card {flashIndex + 1}/{flashCards.length || 1}
                </p>
                <div className="sky-actions">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!revealed) playPracticeCue("reveal", cuesOn)
                      setRevealed((on) => !on)
                    }}
                  >
                    {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                    {revealed ? "Hide" : "Reveal"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={speakFlashFront}>
                    <Headphones size={14} /> Hear front
                  </Button>
                  <Button type="button" size="sm" onClick={() => nextFlash(true)} disabled={!revealed}>
                    Knew it
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => nextFlash(false)} disabled={!revealed}>
                    Again
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      playPracticeCue("next", cuesOn)
                      setFlashCards(buildDeck(flashDeckId, aromaParas))
                      setFlashIndex(0)
                      setRevealed(false)
                    }}
                  >
                    <RotateCcw size={14} /> Shuffle
                  </Button>
                  {flash.ref ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => onOpen(flash.ref!)}>
                      {flash.ref}
                    </Button>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="quiet">
                {flashDeckId === "aroma" && !aromaParas.length ? "Loading aroma list…" : "No cards in this deck."}
              </p>
            )}
            <p className="rights">
              Anointed Staff flashcards · Knew it / Again play voice cues · letter Hear front prefers offline clips (desk voice otherwise).
            </p>
          </CardContent>
        </Card>
      ) : null}

      {hub === "meditate" && session ? (
        <Card className="parse-drill practice-meditate">
          <CardHeader>
            <Badge>Meditate</Badge>
            <CardTitle className="text-xl">{session.title}</CardTitle>
            <CardDescription>{medStance || "Quiet disciplines beside Scripture."}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="practice-session-picker" role="listbox" aria-label="Meditation sessions">
              {meditations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={session.id === item.id}
                  className="practice-session-chip"
                  onClick={() => {
                    stopPracticeVoiceAudio()
                    stopSpeaking()
                    setSessionId(item.id)
                    setTimerRunning(false)
                    setSecondsLeft(0)
                    completedCue.current = false
                  }}
                >
                  <strong>{item.title}</strong>
                  <small>{item.minutes} min · {item.verse}</small>
                </button>
              ))}
            </div>
            <PracticeGuideBar src={guideSrc} title={session.title} onGuidePlay={onGuidePlay} />
            <div className="practice-timer-block">
              <p className="parse-form practice-timer" aria-live="polite">
                {secondsLeft > 0 ? formatClock(secondsLeft) : `${session.minutes}:00`}
              </p>
              <p className="quiet">Timer for quiet practice after (or with) the spoken guide.</p>
              <div className="sky-actions">
                <Button type="button" size="sm" onClick={startMeditationTimer}>
                  <Play size={14} /> Start timer
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setTimerRunning((on) => !on)} disabled={secondsLeft <= 0}>
                  {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                  {timerRunning ? "Pause" : "Resume"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTimerRunning(false)
                    setSecondsLeft(0)
                    completedCue.current = false
                    stopPracticeVoiceAudio()
                  }}
                >
                  <RotateCcw size={14} /> Reset
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => onOpen(session.verse)}>
                  Open {session.verse}
                </Button>
                {onOpenJournal ? (
                  <Button type="button" size="sm" variant="outline" onClick={onOpenJournal}>
                    <BookOpen size={14} /> Journal
                  </Button>
                ) : null}
              </div>
            </div>
            <ol className="practice-steps">
              {session.steps.map((step, index) => (
                <li key={`${session.id}-${index}`}>
                  <span className="practice-step-num">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="rights">
              Spoken guides ship with the desk · Play guide also starts the timer · when time ends you hear a short closing cue if Voice cues are on.
            </p>
          </CardContent>
        </Card>
      ) : null}
      {hub === "meditate" && !session ? <p className="quiet">Opening meditations…</p> : null}

      {hub === "readings" ? (
        <>
          <div className="gem-actions">
            <select aria-label="Practice reading" value={piece?.id ?? ""} onChange={(event) => setReadingId(event.target.value)}>
              {pieces.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <Input
              value={filter}
              placeholder={readingId === "aroma" ? "Search an aroma" : "Search this piece"}
              aria-label="Search this piece"
              onChange={(event) => setFilter(event.target.value)}
            />
            {piece ? (
              <Button type="button" variant="outline" onClick={exportPiece}>
                <FileDown />
                PDF
              </Button>
            ) : null}
          </div>
          {piece ? (
            <Card>
              <CardHeader>
                <Badge>{piece.title}</Badge>
                <CardTitle className="text-xl">{piece.title}</CardTitle>
                <CardDescription>{piece.credit}</CardDescription>
              </CardHeader>
              <CardContent className="practice-copy">
                {lines.map((line, index) => (
                  <p key={`${piece.id}-${index}`}>{line}</p>
                ))}
                {!lines.length ? <p className="quiet">Nothing matches that search.</p> : null}
              </CardContent>
            </Card>
          ) : (
            <p className="quiet">Opening the practice library…</p>
          )}
        </>
      ) : null}

      {hub === "journal" ? (
        <Card>
          <CardHeader>
            <Badge>Journal</Badge>
            <CardTitle className="text-xl">Practice journal</CardTitle>
            <CardDescription>
              The study journal lives under Notes → Write so one notebook keeps temple walks, meditations, and verse notes together.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p>
              Open the Write tab to log what you practiced — a gate walked, a meditation finished, or a card you want to remember beside Scripture.
            </p>
            <div className="sky-actions">
              {onOpenJournal ? (
                <Button type="button" onClick={onOpenJournal}>
                  <BookOpen size={14} /> Open Notes → Write
                </Button>
              ) : (
                <p className="quiet">Open the Notes window from the dock, then choose Write.</p>
              )}
              <Button type="button" size="sm" variant="outline" onClick={() => setHub("meditate")}>
                Back to Meditate
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setHub("temple")}>
                Back to Temple
              </Button>
            </div>
            <p className="rights">Anointed Staff · Practice hub links into the same notebook journal — no second journal silo.</p>
          </CardContent>
        </Card>
      ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

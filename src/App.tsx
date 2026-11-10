import { useEffect, useMemo, useRef, useState } from "react"
import { books } from "./catalog"
import { Desk, openWindow, windows, type DeskLayout, type WinId } from "./components/Desk"
import { exportPdf } from "./pdf"
import { EditorDock, type AgentMessage } from "./components/EditorDock"
import { completeChat, streamChatCompletion } from "./study/chatStream"
import { buildStudyPacket, loadEastonDictionary } from "./study/studyPacket"
import { Library } from "./components/Library"
import { Reader } from "./components/Reader"
import { SearchField } from "./components/SearchField"
import { RootsPane } from "./components/RootsPane"
import { StrongsPane } from "./components/StrongsPane"
import { StudyDesk } from "./components/StudyDesk"
import { GematriaPane } from "./components/GematriaPane"
import { PracticePane } from "./components/PracticePane"
import { HeavensPane } from "./components/HeavensPane"
import { SettingsPane } from "./components/SettingsPane"
import { WritingsPane, type WritingsLibrary } from "./components/WritingsPane"
import { catalogMatch, searchWritings, type LibraryEntry, type Writing } from "./library"
import { searchWeb } from "./search/web"
import { skillHarness } from "./agent/skills"
import {
  defaultSettings,
  hiddenWindows,
  loadSettings,
  confirmLeaveDevice,
  modelHostLeavesDevice,
  saveSettings,
  settingsWithSecrets,
  settingsWithoutSecrets,
  type AppSettings,
} from "./settings"
import { parseHash, parseReference, passageLabel, toHash } from "./reference"
import { playUi, setUiSoundEnabled } from "./lib/uiSound"
import { buildIndex, searchRows } from "./search"
import { verseStrongIds, normalizeStrong, type StrongsLibrary } from "./strongs"
import { headingAt, linksFor, purposeFor, setCrossIndex } from "./study/content"
import { originalChapter, originalCredit, originalVerse, type OriginalTexts } from "./study/originals"
import { skyNow } from "./study/heavens"
import { chapterList, planForDate } from "./study/plan"
import {
  appendWikiLog,
  applyAnnotations,
  blankNotebook,
  laneOf,
  notebookBrief,
  notebookDump,
  notebookMarkdownDocument,
  normalizeNotebooks,
  parseAnnotationLines,
  parseStudyPack,
  refreshWikiIndex,
  toStudyPack,
  upsertWikiPage,
  demoNotebook,
  MAX_STUDY_PACK_BYTES,
  type Notebook,
} from "./notebooks"
import { setPreferredVoice, setVoiceRate, stopSpeaking } from "./voice"
import type { VoiceCommand, VoicePhase } from "./voiceChat"
import { useVoice, useVoiceBridge, voice, voiceLive } from "./voiceSession"
import { VoiceWindow } from "./components/VoiceWindow"
import { ChapterListen } from "./components/ChapterListen"
import { Tip } from "./components/ui/tip"
import { loadStudy, markKey, saveStudy, withMark } from "./storage"
import { deskThemeMetaColor, nextDeskTheme, parseDeskTheme, type DeskTheme } from "./theme"
import {
  loadWorkspaceFile,
  saveWorkspaceFile,
  secretsFromWorkspaceFile,
  witnessLabels,
  witnessPackIds,
  type Workspace,
  type WorkspaceFile,
  type WitnessChoice,
} from "./workspaces"
import { isTranslationId, type Mark, type Place, type Scripture, type TranslationId } from "./types"

const reportKey = "anointed-staff.report"
const themeKey = "anointed-staff.theme"
const deskKey = "anointed-staff.desk.2"

const defaultDesk: DeskLayout = { main: "bible", side: "editor", expanded: false }

const voicePhaseLabel: Record<VoicePhase, string> = {
  off: "Off",
  starting: "Starting",
  listening: "Listening",
  hearing: "Hearing you",
  thinking: "Writing",
  speaking: "Speaking",
  paused: "Paused",
  error: "Stopped",
}

function isWitness(value: string | null): value is WitnessChoice {
  if (!value) return false
  if (value === "off" || value === "paired" || value === "wlc" || value === "tr") return true
  if ((witnessPackIds as readonly string[]).includes(value)) return true
  return value === "ylt" || value === "darby" || value === "bbe" || value === "drc"
}

function keptMessages(value: Workspace["messages"]): AgentMessage[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => item && (item.role === "you" || item.role === "agent") && typeof item.text === "string")
    .map((item) => ({
      role: item.role as "you" | "agent",
      text: item.text,
      receipt: Array.isArray((item as AgentMessage).receipt) ? (item as AgentMessage).receipt : undefined,
    }))
    .slice(-80)
}

function padBooks(text: string[][][] | undefined, count: number) {
  const next = Array.isArray(text) ? text.slice(0, count) : []
  while (next.length < count) next.push([])
  return next
}

function readDesk(): DeskLayout {
  try {
    const saved = JSON.parse(localStorage.getItem(deskKey) ?? "") as Partial<DeskLayout>
    const ids: WinId[] = ["bible", "strongs", "roots", "references", "editor", "voice", "books", "writings", "heavens", "gematria", "practice", "settings"]
    const main = ids.includes(saved.main as WinId) ? (saved.main as WinId) : defaultDesk.main
    const side = saved.side == null ? null : ids.includes(saved.side as WinId) ? (saved.side as WinId) : defaultDesk.side
    if (side === main) return { main, side: null, expanded: Boolean(saved.expanded) }
    return { main, side, expanded: Boolean(saved.expanded) }
  } catch {
    return defaultDesk
  }
}

function readInitial() {
  const saved = loadStudy()
  const hash = parseHash(window.location.hash)
  const place = hash
    ? {
        book: hash.book,
        chapter: hash.chapter - 1,
        verse: hash.verse == null ? null : hash.verse - 1,
      }
    : (saved?.place ?? { book: 0, chapter: 0, verse: null })
  return {
    place,
    translation: saved?.translation ?? "kjv",
    compare: saved?.compare ?? false,
    scale: saved?.scale ?? 1,
    marks: saved?.marks ?? {},
  }
}

function clampPlace(place: Place, text: string[][][]) {
  const book = Math.min(Math.max(place.book, 0), Math.max(text.length - 1, 0))
  const chapters = text[book] ?? []
  if (!chapters.length) {
    if (place.book === book && place.chapter === 0 && place.verse == null) return place
    return { book, chapter: 0, verse: null }
  }
  const chapter = Math.min(Math.max(place.chapter, 0), chapters.length - 1)
  const verse = place.verse == null ? null : Math.min(Math.max(place.verse, 0), chapters[chapter].length - 1)
  if (book === place.book && chapter === place.chapter && verse === place.verse) return place
  return { book, chapter, verse }
}

function shifted(place: Place, direction: -1 | 1, text: string[][][]): Place | null {
  let book = place.book
  let chapter = place.chapter + direction
  while (book >= 0 && book < text.length) {
    const count = text[book]?.length ?? 0
    if (chapter >= 0 && chapter < count) return { book, chapter, verse: null }
    if (direction < 0) {
      book -= 1
      chapter = (text[book]?.length ?? 0) - 1
    } else {
      book += 1
      chapter = 0
    }
  }
  return null
}

export function App() {
  const [seed] = useState(readInitial)
  const [scripture, setScripture] = useState<Scripture | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [place, setPlace] = useState<Place>(seed.place)
  const [translation, setTranslation] = useState<TranslationId>(seed.translation)
  const [scale, setScale] = useState(seed.scale)
  const [marks, setMarks] = useState<Record<string, Mark>>(seed.marks)
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [notice, setNotice] = useState<string | null>(null)
  const noticeTimer = useRef(0)
  function flash(text: string) {
    window.clearTimeout(noticeTimer.current)
    setNotice(text)
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2200)
  }
  const [theme, setTheme] = useState<DeskTheme>("dark")
  const [desk, setDesk] = useState<DeskLayout>(defaultDesk)
  const [strongs, setStrongs] = useState<StrongsLibrary | null>(null)
  const [strongQuery, setStrongQuery] = useState("")
  const [numbersOn, setNumbersOn] = useState(true)
  const [witness, setWitness] = useState<WitnessChoice>(seed.compare ? "paired" : "off")
  const [packs, setPacks] = useState<Partial<Record<(typeof witnessPackIds)[number], string[][][]>>>({})
  const [writings, setWritings] = useState<WritingsLibrary | null>(null)
  const [writingCatalog, setWritingCatalog] = useState<LibraryEntry[]>([])
  const [extraWorks, setExtraWorks] = useState<Record<string, Writing>>({})
  const [loadingWork, setLoadingWork] = useState<string | null>(null)
  const [writingQuery, setWritingQuery] = useState("")
  const [writingFocus, setWritingFocus] = useState<{ workId: string; section: number } | null>(null)
  const [practiceFocus, setPracticeFocus] = useState("temple")
  const [trail, setTrail] = useState<Place[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("anointed-staff.reading-trail") ?? "[]") as unknown
      if (!Array.isArray(raw)) return []
      return raw
        .filter(
          (item): item is Place =>
            item != null &&
            typeof item === "object" &&
            typeof (item as Place).book === "number" &&
            typeof (item as Place).chapter === "number",
        )
        .map((item) => ({
          book: item.book,
          chapter: item.chapter,
          verse: typeof item.verse === "number" ? item.verse : null,
        }))
        .slice(-30)
    } catch {
      return []
    }
  })
  const skipTrail = useRef(false)
  const trailPlace = useRef(seed.place)
  const [hydrated, setHydrated] = useState(false)
  const [workspaces, setWorkspaces] = useState<WorkspaceFile>({ active: "personal", items: [] })
  const [report, setReport] = useState("")
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [busy, setBusy] = useState(false)
  const chatAbort = useRef<AbortController | null>(null)
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [originals, setOriginals] = useState<OriginalTexts | null>(null)
  const [, setLinksReady] = useState(false)
  const [modelState, setModelState] = useState<"checking" | "ready" | "stopped" | "missing">("checking")
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => [blankNotebook()])
  const [notebookId, setNotebookId] = useState("")
  const [wikiFocusId, setWikiFocusId] = useState<string | null>(null)
  const [notesViewRequest, setNotesViewRequest] = useState<string | null>(null)
  const [studyTabRequest, setStudyTabRequest] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const [paneRequest, setPaneRequest] = useState<"chat" | "report">("chat")

  function openGuide(section = "shortcuts") {
    setStudyTabRequest("guide")
    setDesk((current) => openWindow(current, "references"))
    window.setTimeout(() => {
      document.getElementById(`guide-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 220)
  }

  const [scriptureTick, setScriptureTick] = useState(0)

  useEffect(() => {
    let cancel = false
    setError(null)
    fetch("/scripture.json")
      .then((response) => {
        if (!response.ok) throw new Error("The scripture library did not load.")
        return response.json() as Promise<Scripture>
      })
      .then((data) => {
        if (cancel) return
        for (const id of ["kjv", "asv", "ylt", "darby", "bbe", "drc"] as const) {
          if (data.text?.[id]) data.text[id] = padBooks(data.text[id], books.length)
        }
        if (!data.text?.kjv?.some((book) => book.length)) throw new Error("The scripture library is incomplete.")
        setScripture(data)
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : "The scripture library did not load.")
      })
    return () => {
      cancel = true
    }
  }, [scriptureTick])

  function reloadScripture() {
    setScripture(null)
    setError(null)
    setScriptureTick((tick) => tick + 1)
  }

  useEffect(() => {
    let cancel = false
    fetch("/crossrefs.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Record<string, string[]> | null) => {
        if (!cancel && data) {
          setCrossIndex(data)
          setLinksReady(true)
        } else if (!cancel && !data) {
          flash("Cross-references did not load — Links may stay empty until you refresh.")
        }
      })
      .catch(() => {
        if (!cancel) flash("Cross-references did not load — Links may stay empty until you refresh.")
      })
    return () => {
      cancel = true
    }
  }, [])

  function applyWorkspace(item: Workspace, keepPlace: boolean, secrets?: Pick<AppSettings, "modelKey" | "sttKey">) {
    if (!keepPlace) setPlace(item.place)
    setTranslation(isTranslationId(item.translation) ? item.translation : "kjv")
    setWitness(isWitness(item.witness) ? item.witness : "off")
    setScale(typeof item.scale === "number" ? item.scale : 1)
    setMarks(item.marks && typeof item.marks === "object" ? item.marks : {})
    const pages = normalizeNotebooks(item.notebooks)
    setNotebooks(pages)
    setNotebookId(pages.some((page) => page.id === item.notebookId) ? (item.notebookId ?? pages[0].id) : pages[0].id)
    setTheme(parseDeskTheme(item.theme))
    setDesk(item.desk?.main ? item.desk : defaultDesk)
    const live = secrets ?? { modelKey: loadSettings().modelKey, sttKey: loadSettings().sttKey }
    setSettings(settingsWithSecrets(item.settings, live))
    setReport(item.report ?? "")
    setMessages(keptMessages(item.messages))
  }

  function bundle(item: Workspace): Workspace {
    return {
      ...item,
      place,
      translation,
      witness,
      scale,
      marks,
      theme,
      desk,
      settings: settingsWithoutSecrets(settings),
      report,
      notebooks,
      notebookId,
      messages: messages.slice(-80),
    }
  }

  useEffect(() => {
    const saved = loadWorkspaceFile()
    const keepPlace = Boolean(parseHash(window.location.hash))
    const global = loadSettings()
    if (saved) {
      const active = saved.items.find((item) => item.id === saved.active) ?? saved.items[0]
      const legacy = secretsFromWorkspaceFile(saved)
      const secrets = {
        modelKey: global.modelKey || legacy.modelKey,
        sttKey: global.sttKey || legacy.sttKey,
      }
      if ((!global.modelKey && secrets.modelKey) || (!global.sttKey && secrets.sttKey)) {
        saveSettings(settingsWithSecrets(global, secrets))
      }
      setWorkspaces(saved)
      applyWorkspace(active, keepPlace, secrets)
      // Scrub keys out of any older workspace blobs on first load after this release.
      saveWorkspaceFile(saved)
    } else {
      const study = loadStudy()
      const savedTheme = localStorage.getItem(themeKey)
      const savedWitness = localStorage.getItem("anointed-staff.witness")
      const example = demoNotebook()
      const personal: Workspace = {
        id: "personal",
        name: "Personal",
        place: study?.place ?? { book: 0, chapter: 0, verse: null },
        translation: isTranslationId(study?.translation) ? study.translation : "kjv",
        witness: isWitness(savedWitness) ? savedWitness : study?.compare ? "paired" : "off",
        scale: study?.scale ?? 1,
        marks: study?.marks ?? {},
        theme: parseDeskTheme(savedTheme),
        desk: readDesk(),
        settings: settingsWithoutSecrets(global),
        report: localStorage.getItem(reportKey) ?? "",
        notebooks: [example],
        notebookId: example.id,
      }
      setWorkspaces({ active: personal.id, items: [personal] })
      applyWorkspace(personal, keepPlace, { modelKey: global.modelKey, sttKey: global.sttKey })
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", deskThemeMetaColor(theme))
  }, [theme])

  useEffect(() => {
    const controller = new AbortController()
    fetch("/strongs.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<StrongsLibrary>
      })
      .then((data) => {
        if (data.verses?.length === 66 || data.verses?.length === books.length) setStrongs(data)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        flash("Strong’s glossary did not load — refresh the page to try again.")
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (witness === "off" || witness === "paired" || witness === "wlc" || witness === "tr" || isTranslationId(witness) || packs[witness]) return
    if (!(witnessPackIds as readonly string[]).includes(witness)) return
    let cancel = false
    fetch(`/witnesses/${witness}.json`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: string[][][]) => {
        if (!cancel) setPacks((current) => ({ ...current, [witness]: data }))
      })
      .catch(() => undefined)
    return () => {
      cancel = true
    }
  }, [witness, packs])

  useEffect(() => {
    let cancel = false
    fetch("/writings.json")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: WritingsLibrary) => {
        if (!cancel) setWritings(data)
      })
      .catch(() => undefined)
    fetch("/library/catalog.json")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { works?: LibraryEntry[] }) => {
        if (!cancel) setWritingCatalog(Array.isArray(data.works) ? data.works : [])
      })
      .catch(() => undefined)
    return () => {
      cancel = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    let cancel = false
    const root = settings.modelUrl.replace(/\/$/, "").replace(/\/v1$/, "")
    fetch(`${root}/api/tags`, { signal: AbortSignal.timeout(4000) })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("stopped"))))
      .then((data: { models?: { name: string; size?: number; capabilities?: string[] }[] }) => {
        if (cancel) return
        const models = data.models ?? []
        const chat = models.filter((item) => item.capabilities?.includes("completion"))
        const wanted = settings.modelName.trim()
        const found = models.some((item) => item.name === wanted || item.name.startsWith(`${wanted}:`))
        if (!found && (wanted === "" || wanted === "llama3.2") && chat[0]) {
          const pick = [...chat].sort((a, b) => (a.size ?? 0) - (b.size ?? 0))[0]
          setSettings((current) => ({ ...current, modelName: pick.name }))
          setModelState("ready")
          return
        }
        setModelState(found ? "ready" : "missing")
      })
      .catch(() => {
        if (!cancel) setModelState("stopped")
      })
    return () => {
      cancel = true
    }
  }, [hydrated, settings.modelUrl, settings.modelName])

  useEffect(() => {
    if (!scripture) return
    setPlace((current) => clampPlace(current, scripture.text.kjv))
  }, [scripture])

  useEffect(() => setPreferredVoice(settings.voiceName), [settings.voiceName])
  useEffect(() => setVoiceRate(settings.voiceRate), [settings.voiceRate])
  useEffect(() => () => stopSpeaking(), [])
  useEffect(() => {
    stopSpeaking()
  }, [place.book, place.chapter, translation])

  const { state: voiceState } = useVoice()
  const voicePanelOptions = { pauseSecs: settings.voicePause, bargeIn: settings.voiceBargeIn, commands: settings.voiceCommands, rate: settings.voiceRate }
  const voiceServer = { url: settings.sttUrl, model: settings.sttModel, key: settings.sttKey }
  useVoiceBridge({
    settings: { pauseSecs: settings.voicePause, bargeIn: settings.voiceBargeIn, commands: settings.voiceCommands, earMode: settings.sttMode, server: voiceServer },
    busy,
    messages,
    onAsk: (text) => void ask(text, "chat", desk.main === "voice" || desk.side === "voice"),
    onCommand: voiceCommand,
  })
  useEffect(() => {
    if (!settings.plugins.voice) voice.end()
  }, [settings.plugins.voice])
  useEffect(() => {
    setUiSoundEnabled(settings.uiSound)
  }, [settings.uiSound])
  const voiceOn = voiceLive(voiceState)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancel = false
    fetch("/originals.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: OriginalTexts | null) => {
        if (!cancel && payload?.wlc && payload.tr) setOriginals(payload)
      })
      .catch(() => undefined)
    return () => {
      cancel = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveStudy({ place, translation, compare: witness !== "off", scale, marks })
    localStorage.setItem(reportKey, report)
    saveSettings(settings)
    localStorage.setItem(themeKey, theme)
    localStorage.setItem(deskKey, JSON.stringify(desk))
    localStorage.setItem("anointed-staff.witness", witness)
    if (workspaces.items.length) {
      saveWorkspaceFile({
        active: workspaces.active,
        items: workspaces.items.map((item) => (item.id === workspaces.active ? bundle(item) : item)),
      })
    }
  }, [hydrated, place, translation, witness, scale, marks, report, settings, theme, desk, workspaces, notebooks, notebookId, messages])

  useEffect(() => {
    const previous = trailPlace.current
    trailPlace.current = place
    if (skipTrail.current) {
      skipTrail.current = false
      return
    }
    if (previous.book === place.book && previous.chapter === place.chapter && previous.verse === place.verse) return
    setTrail((current) => {
      const next = [...current, previous].slice(-30)
      try {
        localStorage.setItem("anointed-staff.reading-trail", JSON.stringify(next))
      } catch {
        /* ignore quota */
      }
      return next
    })
  }, [place])

  function goBack() {
    setTrail((current) => {
      const previous = current.at(-1)
      if (!previous) return current
      skipTrail.current = true
      setPlace(previous)
      const next = current.slice(0, -1)
      try {
        localStorage.setItem("anointed-staff.reading-trail", JSON.stringify(next))
      } catch {
        /* ignore quota */
      }
      return next
    })
  }
  const goBackRef = useRef(goBack)
  goBackRef.current = goBack

  useEffect(() => {
    const next = toHash(place.book, place.chapter + 1, place.verse == null ? null : place.verse + 1)
    if (window.location.hash !== next) history.replaceState(null, "", next)
    const label = passageLabel(place.book, place.chapter + 1, place.verse == null ? null : place.verse + 1)
    document.title = `${voiceOn ? "● Voice · " : ""}${label} · Anointed Staff`
  }, [place, voiceOn])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 90)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function onHash() {
      const raw = window.location.hash
      if (!raw || raw === "#" || raw === "#/") return
      const parsed = parseHash(raw)
      if (!parsed) {
        flash("Couldn’t parse that link — staying on the open place.")
        return
      }
      setPlace({
        book: parsed.book,
        chapter: parsed.chapter - 1,
        verse: parsed.verse == null ? null : parsed.verse - 1,
      })
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      const typing = target instanceof HTMLElement && Boolean(target.closest("input, textarea, select"))
      if (event.altKey && event.key === "ArrowLeft" && !typing) {
        event.preventDefault()
        goBackRef.current()
        return
      }
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (typing) return
      const shortcut: Partial<Record<string, WinId>> = {
        "1": "bible",
        "2": "books",
        "3": "editor",
        v: "voice",
        V: "voice",
        "4": "strongs",
        e: "roots",
        E: "roots",
        "5": "references",
        "6": "writings",
        "7": "gematria",
        "8": "heavens",
        "9": "practice",
        "0": "settings",
      }
      const windowId = shortcut[event.key]
      if (windowId) {
        event.preventDefault()
        setDesk((current) => openWindow(current, windowId))
        return
      }
      if (event.key === "/") {
        event.preventDefault()
        const bibleOpen = desk.main === "bible" || desk.side === "bible"
        document.getElementById(bibleOpen ? "scripture-search" : "app-search")?.focus()
        return
      }
      if (!scripture) return
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
      const next = shifted(place, event.key === "ArrowLeft" ? -1 : 1, scripture.text[translation])
      if (!next) return
      event.preventDefault()
      setPlace(next)
      setDesk((current) => (current.main === "bible" || current.side === "bible" ? current : { ...current, side: "bible" }))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [place, scripture, translation, desk.main, desk.side])

  const rows = useMemo(
    () => (scripture ? buildIndex(scripture.text[translation]) : []),
    [scripture, translation],
  )
  const results = useMemo(() => searchRows(rows, debounced), [rows, debounced])

  const suggestion = useMemo(() => {
    if (!scripture) return null
    const parsed = parseReference(query)
    if (!parsed) return null
    const chapters = scripture.text[translation][parsed.book]
    if (!chapters || parsed.chapter < 1 || parsed.chapter > chapters.length) return null
    if (parsed.verse != null && (parsed.verse < 1 || parsed.verse > chapters[parsed.chapter - 1].length)) return null
    return { passage: parsed, label: passageLabel(parsed.book, parsed.chapter, parsed.verse) }
  }, [query, scripture, translation])

  const book = books[place.book] ?? books[0]
  const text = scripture?.text[translation]
  const chapterCount = text?.[place.book]?.length ?? 0
  const chapterVerses = text?.[place.book]?.[place.chapter] ?? []
  const pairedId: TranslationId = translation === "kjv" ? "asv" : "kjv"
  const witnessLabel =
    witness === "paired"
      ? (scripture?.translations.find((item) => item.id === pairedId)?.label ?? pairedId.toUpperCase())
      : witness === "off"
        ? ""
        : witnessLabels[witness]
  const otherVerses =
    witness === "off"
      ? []
      : witness === "paired"
        ? (scripture?.text[pairedId]?.[place.book]?.[place.chapter] ?? [])
        : witness === "wlc"
          ? place.book < 39
            ? (originals?.wlc?.[place.book]?.[place.chapter] ?? [])
            : []
          : witness === "tr"
            ? place.book >= 39
              ? (originals?.tr?.[place.book - 39]?.[place.chapter] ?? [])
              : []
            : isTranslationId(witness)
              ? (scripture?.text[witness]?.[place.book]?.[place.chapter] ?? [])
              : (packs[witness]?.[place.book]?.[place.chapter] ?? [])
  const otherLabel = witnessLabel
  const previous = text ? shifted(place, -1, text) : null
  const next = text ? shifted(place, 1, text) : null

  const readerVerses = chapterVerses.map((primary, index) => {
    const mark = marks[markKey(place.book, place.chapter, index)]
    return {
      n: index + 1,
      primary,
      compare: witness !== "off" ? otherVerses[index] : undefined,
      compareLabel: otherLabel,
      color: mark?.color,
      bookmarked: Boolean(mark?.bookmark),
      noted: Boolean(mark?.note),
      selected: place.verse === index,
      heading: headingAt(place.book, place.chapter + 1, index + 1),
      markup: strongs?.verses[place.book]?.[place.chapter]?.[index],
      original: originalVerse(originals, place.book, place.chapter, index),
    }
  })

  const selectedKey = place.verse == null ? null : markKey(place.book, place.chapter, place.verse)
  const selectedMark = selectedKey ? marks[selectedKey] : undefined
  const selectedText = place.verse == null ? null : (chapterVerses[place.verse] ?? null)
  const selectedCompare = witness !== "off" && place.verse != null ? (otherVerses[place.verse] ?? null) : null

  function reveal(id: WinId) {
    setDesk((current) => openWindow(current, id))
  }

  function openVerse(bookIndex: number, chapter: number, verse: number) {
    setPlace({ book: bookIndex, chapter, verse })
    setQuery("")
    reveal("bible")
  }

  function openPassage(passage: { book: number; chapter: number; verse: number | null }) {
    if (!scripture) return
    const chapters = scripture.text[translation][passage.book]
    if (!chapters || passage.chapter < 1 || passage.chapter > chapters.length) return
    if (passage.verse != null && (passage.verse < 1 || passage.verse > chapters[passage.chapter - 1].length)) return
    playUi("tap")
    setPlace({
      book: passage.book,
      chapter: passage.chapter - 1,
      verse: passage.verse == null ? null : passage.verse - 1,
    })
    setQuery("")
    reveal("bible")
  }

  const yearPlan = useMemo(() => (scripture ? planForDate(chapterList(scripture.text.kjv)) : null), [scripture])
  const todayRef = yearPlan
    ? passageLabel(yearPlan.verse.book, yearPlan.verse.chapter + 1, yearPlan.verse.verse + 1)
    : passageLabel(0, 1, 1)
  const todayParsed = parseReference(todayRef)
  const readings = yearPlan ? yearPlan.chapters.map((slot) => passageLabel(slot.book, slot.chapter + 1, null)) : []
  const todayText =
    todayParsed && scripture
      ? (scripture.text[translation][todayParsed.book]?.[todayParsed.chapter - 1]?.[(todayParsed.verse ?? 1) - 1] ?? null)
      : null

  const rights = scripture
    ? `${scripture.translations.map((item) => `${item.label} ${item.year}`).join(", ")} are public domain. Cross-references are from Open Bible, CC BY. Notes stay on this device.`
    : "Anointed Staff is independent study software."

  const placeLabel = passageLabel(place.book, place.chapter + 1, place.verse == null ? null : place.verse + 1)

  async function studyPacket(command: string) {
    if (!scripture) return { text: command, receipt: { labels: [] as string[] } }
    const dictionary = await loadEastonDictionary()
    const recent = [
      ...new Set(
        [...trail]
          .reverse()
          .map((spot) => passageLabel(spot.book, spot.chapter + 1, spot.verse == null ? null : spot.verse + 1)),
      ),
    ]
    return buildStudyPacket({
      command,
      place,
      scripture,
      translation,
      numbersOn,
      strongs,
      originals,
      compareLine: selectedCompare,
      compareLabel: otherLabel,
      notebookBrief: notebookContext(),
      trailLabels: recent,
      dictionary,
    })
  }

  function cancelAsk() {
    chatAbort.current?.abort()
    chatAbort.current = null
    setBusy(false)
    setMessages((current) => {
      const last = current[current.length - 1]
      if (last?.role === "agent" && last.streaming) {
        const next = [...current]
        next[next.length - 1] = {
          ...last,
          streaming: false,
          stage: "done",
          text: last.text.trim() || "(Stopped.)",
        }
        return next
      }
      return current
    })
  }

  async function chatWithModel(command: string, keepWindows = false) {
    setPaneRequest("chat")
    if (!keepWindows && !settings.chatKeepWindows) setDesk((current) => openWindow(current, "editor"))
    if (!settings.modelOn || !settings.modelUrl.trim()) {
      setMessages((current) => [
        ...current,
        { role: "you", text: command },
        {
          role: "agent",
          text: "The model is off. Open Settings and turn it on, then ask again. This chat does not write a study on its own.",
        },
      ])
      return
    }

    const leavesDevice = settings.modelMode === "cloud" || modelHostLeavesDevice(settings.modelUrl)
    if (
      leavesDevice &&
      !window.confirm(
        "Send this study packet (open passage, Strong’s, notes, and your question) to your model host?\n\nThis leaves the device. Cancel to keep study on the desk only.",
      )
    ) {
      return
    }

    chatAbort.current?.abort()
    const controller = new AbortController()
    chatAbort.current = controller
    const timeoutMs = Math.max(10, settings.modelTimeout) * 1000
    const timer = window.setTimeout(() => controller.abort(), timeoutMs)

    setBusy(true)
    const packet = await studyPacket(command)
    if (controller.signal.aborted) {
      window.clearTimeout(timer)
      return
    }

    setMessages((current) => [
      ...current,
      { role: "you", text: command, receipt: packet.receipt.labels },
      { role: "agent", text: "", streaming: true, stage: "reading" },
    ])

    const prior = messages.slice(-6).map((message) => ({
      role: message.role === "you" ? "user" : "assistant",
      content: message.text,
    }))
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (settings.modelKey.trim()) headers.Authorization = `Bearer ${settings.modelKey.trim()}`
    const endpoint = `${settings.modelUrl.replace(/\/$/, "")}/chat/completions`
    const body = {
      model: settings.modelName.trim() || "llama3.2",
      messages: [
        {
          role: "system",
          content: `${settings.systemPrompt.trim() || defaultSettings.systemPrompt}\n${skillHarness(command)}\nContext: the reader is in the passage packed with the question. A star marks the selected verse. Quote only the verses, compare line, Strong's glosses, cross-references, originals, dictionary hits, and notebook given to you. Do not invent cards or verses. Speak as the Anointed Staff companion — friendly, inquisitive, wise.`,
        },
        ...prior,
        { role: "user", content: packet.text },
      ],
    }

    const patchAgent = (patch: Partial<AgentMessage>) => {
      setMessages((current) => {
        const next = [...current]
        const last = next[next.length - 1]
        if (last?.role !== "agent") return current
        next[next.length - 1] = { ...last, ...patch }
        return next
      })
    }

    try {
      patchAgent({ stage: "writing", streaming: true })
      let content = ""
      try {
        content = await streamChatCompletion(endpoint, headers, body, {
          signal: controller.signal,
          onDelta: (text) => patchAgent({ text, stage: "writing", streaming: true }),
        })
      } catch (streamError) {
        if (controller.signal.aborted) throw streamError
        // Hosts that reject stream=true fall back to a full JSON reply.
        content = await completeChat(endpoint, headers, body, controller.signal)
        patchAgent({ text: content, stage: "writing", streaming: true })
      }
      setModelState("ready")
      patchAgent({ text: content.trim(), streaming: false, stage: "done" })
    } catch (error) {
      if (controller.signal.aborted) {
        setMessages((current) => {
          const next = [...current]
          const last = next[next.length - 1]
          if (last?.role !== "agent") return current
          next[next.length - 1] = {
            ...last,
            streaming: false,
            stage: "done",
            text: last.text.trim() || "(Stopped.)",
          }
          return next
        })
      } else {
        const reason = error instanceof Error ? error.message : "no answer"
        patchAgent({
          text: `The model did not answer (${reason}). This box is the chat. The bar at the top searches the library. Test connection is in Settings.`,
          streaming: false,
          stage: "done",
        })
      }
    } finally {
      window.clearTimeout(timer)
      if (chatAbort.current === controller) chatAbort.current = null
      setBusy(false)
    }
  }

  const extraLibrary = useMemo<WritingsLibrary | null>(() => {
    if (!writings) return null
    const extras = Object.values(extraWorks)
    if (!extras.length) return writings
    const seen = new Set(writings.works.map((item) => item.id))
    return { works: [...writings.works, ...extras.filter((item) => !seen.has(item.id))] }
  }, [writings, extraWorks])

  async function ensureWork(id: string) {
    const already = extraWorks[id] ?? writings?.works.find((item) => item.id === id)
    if (already) return already
    const entry = writingCatalog.find((item) => item.id === id)
    if (!entry) return undefined
    setLoadingWork(id)
    try {
      const response = await fetch(`/library/${entry.file}`)
      if (!response.ok) {
        flash(`Couldn’t open ${entry.title ?? "that book"}.`)
        return undefined
      }
      const work = (await response.json()) as Writing
      setExtraWorks((current) => ({ ...current, [id]: work }))
      return work
    } catch {
      flash(`Couldn’t open ${entry.title ?? "that book"}.`)
      return undefined
    } finally {
      setLoadingWork(null)
    }
  }

  function windowByName(name: string): WinId | null {
    const q = name.trim().toLowerCase()
    const aliases: Record<string, WinId> = {
      bible: "bible",
      scripture: "bible",
      chat: "editor",
      ai: "editor",
      editor: "editor",
      notes: "references",
      notebook: "references",
      "strong's": "strongs",
      strongs: "strongs",
      roots: "roots",
      etymology: "roots",
      heavens: "heavens",
      sky: "heavens",
      stars: "heavens",
      mazzaroth: "heavens",
      gematria: "gematria",
      letters: "gematria",
      voice: "voice",
      settings: "settings",
      writings: "writings",
      "extra-canon": "writings",
      practice: "practice",
      books: "books",
      library: "books",
    }
    const id = aliases[q] ?? windows.find((item) => item.title.toLowerCase() === q)?.id ?? null
    if (!id || hiddenWindows(settings).includes(id as "strongs")) return null
    return id
  }

  /** A window command opens that desk. It does not write a study. */
  function followCommand(command: string): boolean {
    const trimmed = command.trim()
    const strongsMatch = /^(?:strongs|strong's)(?:\s+(.+))?$/i.exec(trimmed)
    if (strongsMatch) {
      const rest = strongsMatch[1]?.trim()
      const id = rest ? normalizeStrong(rest) : ""
      if (id) openStrong(id)
      else {
        if (rest) setStrongQuery(rest)
        setDesk((current) => openWindow(current, "strongs"))
      }
      return true
    }
    const rootsMatch = /^(?:roots|etymology|etymologies|derivation)(?:\s+(.+))?$/i.exec(trimmed)
    if (rootsMatch) {
      const rest = rootsMatch[1]?.trim()
      const id = rest ? normalizeStrong(rest) : ""
      openRoots(id || rest || undefined)
      return true
    }
    if (/^(?:stars|heavens|sky|mazzaroth|chart|natal|matrix)(?:\s|$)/i.test(trimmed)) {
      setDesk((current) => openWindow(current, "heavens"))
      return true
    }
    if (/^(?:gematria|count|anagrams?|learn(?:\s+letters)?|letters|alef|hebrew)(?:\s|$)/i.test(trimmed)) {
      setDesk((current) => openWindow(current, "gematria"))
      return true
    }
    if (/^(?:practice|prayers?|aromas?|temple|dna|untangle|meditat\w*|cards?|flashcards?|journal)(?:\s|$)/i.test(trimmed)) {
      const q = trimmed.toLowerCase()
      if (/aroma/.test(q)) setPracticeFocus("aroma")
      else if (/meditat/.test(q)) setPracticeFocus("meditate")
      else if (/cards?|flashcards?/.test(q)) setPracticeFocus("cards")
      else if (/journal/.test(q)) setPracticeFocus("journal")
      else if (/\bdna\b/.test(q)) setPracticeFocus("dna")
      else if (/prayer|untangle/.test(q)) setPracticeFocus("untangle")
      else if (/temple/.test(q)) setPracticeFocus("temple")
      setDesk((current) => openWindow(current, "practice"))
      return true
    }
    if (/^(?:writings|extra-?canon(?:ical)?|outside|enoch|sophia|jasher|yetzirah|targum|talmud)$/i.test(trimmed)) {
      const named = catalogMatch(writingCatalog, trimmed)
      if (named) {
        setWritingQuery(named.title)
        void ensureWork(named.id)
      }
      setDesk((current) => openWindow(current, "writings"))
      return true
    }
    if (/^(?:cross|xref|references)$/i.test(trimmed)) {
      setDesk((current) => openWindow(current, "references"))
      return true
    }
    if (/^(?:guide|help|how\s*to|manual)$/i.test(trimmed)) {
      openGuide()
      return true
    }
    if (/^(?:reading|today)$/i.test(trimmed)) {
      if (todayParsed) openPassage(todayParsed)
      return true
    }
    const go = /^(?:open|go to|goto)\s+(.+)$/i.exec(trimmed)
    if (go) {
      const rest = go[1].trim()
      const named = windowByName(rest)
      if (named) {
        setDesk((current) => openWindow(current, named))
        return true
      }
      const ref = parseReference(rest)
      if (ref) {
        openPassage(ref)
        return true
      }
      const id = normalizeStrong(rest)
      if (id) {
        openStrong(id)
        return true
      }
    }
    if (/^web\s+\S/i.test(trimmed)) {
      void postWeb(trimmed)
      return true
    }
    if (/^search\s+\S/i.test(trimmed)) {
      setQuery(trimmed.replace(/^search\s+/i, "").trim())
      setDesk((current) => openWindow(current, "bible"))
      return true
    }
    return false
  }

  async function postWeb(command: string) {
    const query = command.replace(/^web\s+/i, "").trim()
    setPaneRequest("chat")
    setMessages((current) => [...current, { role: "you", text: command }])
    if (!settings.searxOn) {
      setMessages((current) => [
        ...current,
        { role: "agent", text: "Web search is off. Turn on SearXNG in Settings if you want a lookup. This chat does not search the web on its own." },
      ])
      return
    }
    if (
      modelHostLeavesDevice(settings.searxUrl) &&
      !confirmLeaveDevice(
        "searx",
        "Send this search query to your SearXNG host?\n\nThis leaves the device. Cancel to keep study on the desk only.",
      )
    ) {
      setMessages((current) => [...current, { role: "agent", text: "Web search cancelled — query stayed on this device." }])
      return
    }
    try {
      const hits = await searchWeb(settings.searxUrl, query, settings.searxLanguage)
      const text = hits.length
        ? hits.map((hit) => `${hit.title}\n${hit.url}\n${hit.snippet}`).join("\n\n")
        : `SearXNG found nothing for “${query}”.`
      setMessages((current) => [...current, { role: "agent", text }])
    } catch (reason) {
      const text = reason instanceof Error ? reason.message : "SearXNG did not answer."
      setMessages((current) => [...current, { role: "agent", text }])
    }
  }

  /** keepWindows leaves the panes as they are, so a spoken turn does not push the Voice window aside. */
  async function ask(command: string, _source: "chat" | "desk" = "desk", keepWindows = false) {
    if (!scripture) {
      flash(error ? "Scripture library did not load — open Bible and retry." : "Library still loading — try again in a moment.")
      return
    }
    const trimmed = command.trim()
    if (!trimmed) return
    playUi("send")
    if (/^expand notes\b/i.test(trimmed)) {
      await expandNotebook()
      return
    }
    if (/^ingest wiki\b/i.test(trimmed)) {
      await ingestWikiPassage()
      return
    }
    if (followCommand(trimmed)) return
    await chatWithModel(trimmed, keepWindows)
  }

  useEffect(() => {
    const hidden = new Set(hiddenWindows(settings))
    setDesk((current) => {
      const main = hidden.has(current.main as "strongs") ? "bible" : current.main
      const side = current.side && hidden.has(current.side as "strongs") ? null : current.side
      if (main === current.main && side === current.side) return current
      return { ...current, main, side }
    })
  }, [settings])

  async function shareReport() {
    const card = report.trim() || selectedText || ""
    if (!card) return
    try {
      await navigator.clipboard.writeText(card)
      setNotice("Study copied")
    } catch {
      setNotice("Could not copy")
    }
    window.setTimeout(() => setNotice(null), 1800)
  }

  function openStrong(id: string) {
    setStrongQuery(id)
    setNumbersOn(true)
    setTranslation("kjv")
    setDesk((current) => openWindow(current, "strongs"))
  }

  function openRoots(id?: string) {
    if (id) setStrongQuery(id)
    setNumbersOn(true)
    setTranslation("kjv")
    setDesk((current) => openWindow(current, "roots"))
  }

  function openOutside(query: string) {
    const needle = query.trim()
    setWritingQuery(needle)
    setDesk((current) => openWindow(current, "writings"))
    const named = catalogMatch(writingCatalog, needle)
    void (async () => {
      const loaded = named ? await ensureWork(named.id) : undefined
      const library: WritingsLibrary | null = extraLibrary
        ? { works: loaded && !extraLibrary.works.some((item) => item.id === loaded.id) ? [...extraLibrary.works, loaded] : extraLibrary.works }
        : loaded
          ? { works: [loaded] }
          : extraLibrary
      const hit = needle.length >= 3 ? searchWritings(library, needle, 1)[0] : undefined
      if (hit) setWritingFocus({ workId: hit.workId, section: hit.section })
      else if (named) setWritingFocus({ workId: named.id, section: 0 })
    })()
  }

  function verseOutsideQuery() {
    return [...new Set((selectedText ?? "").toLowerCase().match(/[a-z]{6,}/g) ?? [])][0] ?? ""
  }

  const modelLabel =
    modelState === "ready" ? "Connected" : modelState === "stopped" ? "Offline" : modelState === "missing" ? "Model missing" : "Checking"
  const previews: Record<WinId, string> = {
    bible: placeLabel,
    strongs: strongQuery || "Look up a number",
    roots: strongQuery || "Strong's chain, Hitchcock names, English tree",
    references: "Highlights, comments, and links",
    editor: busy ? "Working" : "Beside this chapter",
    voice: voiceState
      ? voiceState.phase === "error"
        ? "Stopped · try again"
        : `${voiceLive(voiceState) ? "Live" : "Voice"} · ${voicePhaseLabel[voiceState.phase]}`
      : "Talk hands free",
    books: book.name,
    writings: writingQuery || extraLibrary?.works.map((item) => item.title).slice(0, 6).join(", ") || "Enoch, Jasher, Targum, Gospels.net",
    heavens: "Birth chart, wheel, letter matrix, and the open station beside it",
    gematria: "Learn the letters, count a word, rearrange it",
    practice:
      practiceFocus === "aroma"
        ? "Aroma list"
        : practiceFocus === "dna"
          ? "DNA prayer"
          : practiceFocus === "untangle"
            ? "Prayer to Untangle"
            : practiceFocus === "meditate"
              ? "Meditations"
              : "Temple chart",
      settings: settings.modelOn ? settings.modelName : "Model, voice, plugins, About",
  }

  function activeNotebook() {
    return notebooks.find((item) => item.id === notebookId) ?? notebooks[0]
  }

  function notebookContext() {
    const page = activeNotebook()
    const brief = page ? notebookBrief(page) : ""
    return brief ? `\n\nNotebook:\n${brief}` : ""
  }

  function pinNoteCard(label: string, text: string, tags: string[] = ["study"]) {
    const snippet = text.trim()
    if (!snippet) return
    changeNotebook((item) => ({
      ...item,
      cards: [
        ...item.cards,
        {
          id: crypto.randomUUID(),
          book: place.book,
          chapter: place.chapter,
          verse: place.verse ?? 0,
          label,
          text: snippet.slice(0, 280),
          annotation: snippet.slice(0, 2000),
          tags: tags.slice(0, 6),
          lane: item.lanes.find((lane) => lane.id === "insight")?.id ?? item.lanes[0]?.id,
          kind: "note" as const,
        },
      ],
    }))
    flash("Saved to the notebook")
  }

  function addStudyNote(text: string) {
    pinNoteCard("Study note", text, ["study"])
  }

  function addWikiFromText(text: string, titleHint?: string) {
    const snippet = text.trim()
    if (!snippet) return
    const title = (titleHint?.trim() || `${placeLabel} note`).slice(0, 80)
    const body = `# ${title}\n\n${snippet}\n\nSee also [[Index]] and [[${placeLabel}]].\n`
    let focusId: string | null = null
    changeNotebook((item) => {
      const next = appendWikiLog(refreshWikiIndex(upsertWikiPage(item, title, body, "page")), `Filed chat into [[${title}]]`)
      focusId = next.pages.find((entry) => entry.title === title)?.id ?? null
      return next
    })
    if (focusId) setWikiFocusId(focusId)
    setDesk((current) => openWindow(current, "references"))
    flash("Saved to the wiki")
  }

  async function ingestWikiPassage() {
    const page = activeNotebook()
    if (!page) return
    const title = placeLabel
    const source = [
      selectedText ? `> ${selectedText}` : "",
      selectedCompare ? `Compare (${otherLabel}): ${selectedCompare}` : "",
    ]
      .filter(Boolean)
      .join("\n\n")
    let body = `# ${title}\n\n${source}\n\n## Notes\n\n- Opened from the desk.\n\nRelated: [[Index]]\n`
    const canAskModel = settings.modelOn && settings.modelUrl.trim()
    const ingestLeaves =
      Boolean(canAskModel) && (settings.modelMode === "cloud" || modelHostLeavesDevice(settings.modelUrl))
    const ingestAllowed =
      Boolean(canAskModel) &&
      (!ingestLeaves ||
        window.confirm(
          "Send this passage and wiki titles to your model host to draft the page?\n\nThis leaves the device. Cancel to file a stub page on the desk only.",
        ))
    if (ingestAllowed) {
      setBusy(true)
      setMessages((current) => [...current, { role: "you", text: `ingest wiki · ${title}` }])
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (settings.modelKey.trim()) headers.Authorization = `Bearer ${settings.modelKey.trim()}`
        const response = await fetch(`${settings.modelUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers,
          signal: AbortSignal.timeout(settings.modelTimeout * 1000),
          body: JSON.stringify({
            model: settings.modelName.trim() || "llama3.2",
            messages: [
              {
                role: "system",
                content:
                  "You maintain a Bible study wiki in markdown. Write one page only. Use ## headings, short bullets, and [[wikilinks]] to related ideas. Quote only the verses given. Do not invent scripture. Start with a # title matching the passage label.",
              },
              {
                role: "user",
                content: `Ingest this passage into the wiki as page "${title}".\n\nPassage:\n${source || placeLabel}\n\nExisting wiki titles: ${(page.pages ?? []).map((item) => item.title).join(", ") || "Index, Log"}`,
              },
            ],
            temperature: 0.4,
          }),
        })
        if (response.ok) {
          const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
          const content = data.choices?.[0]?.message?.content?.trim()
          if (content) body = content
          setMessages((current) => [...current, { role: "agent", text: content ? `Wiki page updated for ${title}.` : "The model sent no page text; a stub was filed." }])
        } else {
          setMessages((current) => [...current, { role: "agent", text: `Model answered ${response.status}. A stub page was filed offline.` }])
        }
      } catch (error) {
        setMessages((current) => [
          ...current,
          { role: "agent", text: error instanceof Error ? `${error.message} A stub page was filed offline.` : "A stub page was filed offline." },
        ])
      } finally {
        setBusy(false)
      }
    }
    let focusId: string | null = null
    changeNotebook((item) => {
      const next = appendWikiLog(refreshWikiIndex(upsertWikiPage(item, title, body, "page")), `Ingested [[${title}]]`)
      focusId = next.pages.find((entry) => entry.title === title)?.id ?? null
      return next
    })
    if (focusId) setWikiFocusId(focusId)
    setDesk((current) => openWindow(current, "references"))
    flash("Passage filed in the wiki")
  }

  async function expandNotebook() {
    const page = activeNotebook()
    if (!page?.cards.length) {
      flash("The notebook is empty")
      return
    }
    const empty = page.cards.filter((card) => !card.annotation.trim())
    if (!empty.length) {
      flash("Every card already has a note")
      return
    }
    if (!settings.modelOn || !settings.modelUrl.trim()) {
      flash("Turn the model on in Settings to expand notes")
      return
    }
    const leavesDevice = settings.modelMode === "cloud" || modelHostLeavesDevice(settings.modelUrl)
    if (
      leavesDevice &&
      !window.confirm(
        "Send empty notebook cards (labels and verse text) to your model host?\n\nThis leaves the device. Cancel to keep notes on the desk only.",
      )
    ) {
      return
    }
    setMessages((current) => [...current, { role: "you", text: "expand notes" }])
    setBusy(true)
    setDesk((current) => openWindow(current, "editor"))
    const list = empty.map((card) => `${card.label} | ${card.text}`).join("\n")
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (settings.modelKey.trim()) headers.Authorization = `Bearer ${settings.modelKey.trim()}`
    try {
      const response = await fetch(`${settings.modelUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(Math.max(10, settings.modelTimeout) * 1000),
        body: JSON.stringify({
          model: settings.modelName.trim() || "llama3.2",
          messages: [
            {
              role: "system",
              content: `${settings.systemPrompt.trim() || defaultSettings.systemPrompt}\nWrite one short annotation per card. Quote only the verse given. Reply with one line each: Label | annotation`,
            },
            { role: "user", content: `Fill empty notes on these cards:\n${list}` },
          ],
        }),
      })
      if (!response.ok) throw new Error(String(response.status))
      const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
      const content = data.choices?.[0]?.message?.content?.trim()
      if (!content) throw new Error("empty")
      const lines = parseAnnotationLines(content)
      const before = empty.length
      changeNotebook((item) => applyAnnotations(item, lines, true))
      const filled = lines.length
      setMessages((current) => [
        ...current,
        { role: "agent", text: filled ? `Wrote notes on ${Math.min(filled, before)} cards. Open Notes to read them.` : "The model answered, but no Label | annotation lines could be read. Try Study this notebook instead." },
      ])
      flash(filled ? "Notes written on the cards" : "The model did not return card lines")
    } catch (error) {
      const reason = error instanceof Error ? error.message : "no answer"
      setMessages((current) => [...current, { role: "agent", text: `Could not fill the notes (${reason}). Test the model in Settings, then try again.` }])
      flash("The model did not fill the notes")
    }
    setBusy(false)
  }

  function changeNotebook(update: (page: Notebook) => Notebook) {
    setNotebooks((current) => {
      const id = current.some((item) => item.id === notebookId) ? notebookId : current[0]?.id
      return current.map((item) => (item.id === id ? update(item) : item))
    })
  }

  function saveVerseCard(tags: string[]) {
    if (place.verse == null || !selectedText) return
    const here = { book: place.book, chapter: place.chapter, verse: place.verse }
    const label = placeLabel
    const text = selectedText
    const color = selectedMark?.color
    const annotation = selectedMark?.note ?? ""
    const page = activeNotebook()
    const known = page?.cards.some((card) => card.kind !== "note" && card.book === here.book && card.chapter === here.chapter && card.verse === here.verse)
    changeNotebook((item) => {
      const existing = item.cards.find((card) => card.kind !== "note" && card.book === here.book && card.chapter === here.chapter && card.verse === here.verse)
      if (existing) {
        return { ...item, cards: item.cards.map((card) => (card.id === existing.id ? { ...card, tags: [...new Set([...card.tags, ...tags])].slice(0, 6) } : card)) }
      }
      return {
        ...item,
        cards: [...item.cards, { id: crypto.randomUUID(), book: here.book, chapter: here.chapter, verse: here.verse, label, text, color, annotation, tags, lane: item.lanes[0]?.id, kind: "verse" }],
      }
    })
    flash(known ? `${label} is already in ${page?.title ?? "the notebook"}` : `${label} saved to ${page?.title ?? "the notebook"}`)
  }

  function addNoteCard(text: string, lane: string, at?: { x: number; y: number }) {
    const verse = place.verse ?? 0
    changeNotebook((item) => ({
      ...item,
      cards: [
        ...item.cards,
        {
          id: crypto.randomUUID(),
          book: place.book,
          chapter: place.chapter,
          verse,
          label: text.trim() === "Write here" ? "Sticky" : `Note · ${passageLabel(place.book, place.chapter + 1, place.verse == null ? null : verse + 1)}`,
          text,
          annotation: "",
          tags: [],
          lane,
          kind: "note",
          x: at?.x,
          y: at?.y,
        },
      ],
    }))
  }

  function exportNotebookPdf() {
    const page = activeNotebook()
    if (!page) return
    const journal = page.journal.trim()
      ? [{ heading: "Journal", body: page.journal.trim() }]
      : []
    const wiki = (page.pages ?? [])
      .filter((item) => item.body.trim())
      .map((item) => ({ heading: `Wiki · ${item.title}`, body: item.body.trim() }))
    exportPdf(
      {
        title: page.title,
        subtitle: `${page.cards.length} cards · ${(page.pages ?? []).length} wiki pages · ${new Date().toLocaleDateString()}`,
        sections: [
          ...wiki,
          ...journal,
          ...page.lanes.flatMap((lane) => {
            const cards = page.cards.filter((card) => laneOf(card, page.lanes) === lane.id)
            if (!cards.length) return []
            return [
              { heading: `${lane.title} · ${cards.length}`, body: "" },
              ...cards.map((card) => ({
                heading: card.label,
                body: [card.text, card.tags.length ? `Topics: ${card.tags.join(", ")}` : "", card.annotation ? `Note: ${card.annotation}` : ""].filter(Boolean).join("\n"),
                quote: card.kind !== "note",
              })),
            ]
          }),
        ],
        footer: `Anointed Staff · ${page.title}`,
      },
      page.title,
    )
    flash("Notebook exported as PDF")
  }

  function exportStudyPack() {
    const page = activeNotebook()
    if (!page) return
    const pack = toStudyPack(page)
    downloadText(`${page.title.replace(/[^\w\- ]+/g, "").trim() || "notebook"}.aswiki.json`, JSON.stringify(pack, null, 2), "application/json")
    flash("Study pack exported")
  }

  async function importStudyPack(file: File) {
    try {
      if (file.size > MAX_STUDY_PACK_BYTES) {
        flash(`Study pack is too large (max ${Math.round(MAX_STUDY_PACK_BYTES / (1024 * 1024))} MB)`)
        return
      }
      const text = await file.text()
      const pack = parseStudyPack(JSON.parse(text) as unknown)
      if (!pack) {
        flash("That file is not a study pack")
        return
      }
      const title = pack.notebook.title.trim() || "Imported notebook"
      const imported = { ...pack.notebook, title: notebooks.some((item) => item.title === title) ? `${title} (import)` : title }
      setNotebooks((current) => [...current, imported])
      setNotebookId(imported.id)
      setWikiFocusId(imported.pages.find((item) => item.kind === "index")?.id ?? imported.pages[0]?.id ?? null)
      setDesk((current) => openWindow(current, "references"))
      flash("Study pack imported")
    } catch {
      flash("Could not read that study pack")
    }
  }

  function copyNotebookMarkdown() {
    const page = activeNotebook()
    if (!page) return
    void navigator.clipboard?.writeText(notebookMarkdownDocument(page)).then(
      () => flash("Markdown copied"),
      () => flash("Could not copy"),
    )
  }

  function exportChatPdf(kind: "report" | "chat") {
    const where = passageLabel(place.book, place.chapter + 1, place.verse == null ? null : place.verse + 1)
    if (kind === "report") {
      exportPdf({ title: `Study · ${where}`, subtitle: new Date().toLocaleDateString(), sections: [{ body: report.trim() }] }, `${studyFileName()}-report`)
    } else {
      exportPdf(
        {
          title: `Conversation · ${where}`,
          subtitle: new Date().toLocaleDateString(),
          sections: messages.map((message) => ({ heading: message.role === "you" ? "You" : "AI", body: message.text })),
        },
        `${studyFileName()}-chat`,
      )
    }
    flash(kind === "report" ? "Report exported as PDF" : "Chat exported as PDF")
  }

  function markVerse(patch: Partial<Mark>) {
    if (!selectedKey) return
    if (patch.bookmark != null || patch.color) playUi("mark")
    setMarks((current) => withMark(current, selectedKey, patch))
  }

  async function copyText(text: string, label = "Copied") {
    try {
      await navigator.clipboard.writeText(text)
      flash(label)
    } catch {
      flash("Could not copy")
    }
  }

  function copyVerse() {
    if (!selectedText) return
    void copyText(`${placeLabel} (${translation.toUpperCase()})\n${selectedText}`, `${placeLabel} copied`)
  }

  function voiceCommand(command: VoiceCommand): string | void {
    if (!text) return "The Bible is still loading."
    const verseText = (book: number, chapter: number, verse: number) => text[book]?.[chapter]?.[verse] ?? ""
    if (command.kind === "rate") {
      const rate = Math.round(Math.min(1.6, Math.max(0.6, settings.voiceRate + command.step)) * 100) / 100
      setSettings((current) => ({ ...current, voiceRate: rate }))
      setVoiceRate(rate)
      return command.step < 0 ? "Slower." : "Faster."
    }
    if (command.kind === "next-verse" || command.kind === "previous-verse") {
      const step = command.kind === "next-verse" ? 1 : -1
      const verse = (place.verse ?? (step > 0 ? -1 : 1)) + step
      if (verse >= 0 && verse < chapterVerses.length) {
        setPlace({ ...place, verse })
        return `${passageLabel(place.book, place.chapter + 1, verse + 1)}. ${verseText(place.book, place.chapter, verse)}`
      }
      const over = shifted(place, step > 0 ? 1 : -1, text)
      if (!over) return "That is the edge of the Bible."
      const last = step > 0 ? 0 : (text[over.book]?.[over.chapter]?.length ?? 1) - 1
      setPlace({ ...over, verse: last })
      return `${passageLabel(over.book, over.chapter + 1, last + 1)}. ${verseText(over.book, over.chapter, last)}`
    }
    if (command.kind === "next-chapter" || command.kind === "previous-chapter") {
      const over = shifted(place, command.kind === "next-chapter" ? 1 : -1, text)
      if (!over) return "That is the edge of the Bible."
      setPlace(over)
      return `${passageLabel(over.book, over.chapter + 1, null)}. ${verseText(over.book, over.chapter, 0)}`
    }
    if (command.kind === "read-verse") {
      if (place.verse == null) return `${placeLabel}. ${chapterVerses[0] ?? ""}`
      return `${placeLabel}. ${selectedText ?? ""}`
    }
    if (command.kind === "read-chapter") return `${passageLabel(place.book, place.chapter + 1, null)}. ${chapterVerses.join(" ")}`
    if (command.kind === "save-verse") {
      if (place.verse == null || !selectedText) return "Choose a verse first, then say save this verse."
      saveVerseCard([])
      return `${placeLabel} is in the notebook.`
    }
    if (command.kind === "write-study") {
      void ask("study", "chat")
      return
    }
    if (command.kind !== "open") return
    const spoken = command.reference.trim()
    if (/^(extra-?canon(?:ical)?|writings|outside|enoch|sophia|jasher|yetzirah|targum|talmud)$/i.test(spoken)) {
      setDesk((current) => openWindow(current, "writings"))
      return "Extra-canon is open."
    }
    if (/^(strongs|strong'?s)$/i.test(spoken)) {
      setDesk((current) => openWindow(current, "strongs"))
      return "Strong's is open."
    }
    if (/^(roots|etymology)$/i.test(spoken)) {
      openRoots()
      return "Roots is open."
    }
    const strongId = normalizeStrong(spoken)
    if (strongId && /^[hg]/i.test(spoken.replace(/\s/g, ""))) {
      openStrong(strongId)
      return `${strongId} is open.`
    }
    const parsed = parseReference(spoken.replace(/^(1|2|3)(st|nd|rd)\s/, "$1 ").replace(/\bchapter\s/, ""))
    if (!parsed) return `I could not find ${command.reference}. Try a book and chapter, like John 3.`
    openPassage(parsed)
    const book = parsed.book
    const chapter = parsed.chapter - 1
    const verse = parsed.verse == null ? 0 : parsed.verse - 1
    return `${passageLabel(book, parsed.chapter, parsed.verse ?? null)}. ${verseText(book, chapter, verse)}`
  }

  const recentPlaces = [...new Set([...trail].reverse().map((spot) => passageLabel(spot.book, spot.chapter + 1, spot.verse == null ? null : spot.verse + 1)))]
    .filter((label) => label !== placeLabel)
    .slice(0, 6)

  function renderChat() {
    return (
      <EditorDock
        report={report}
        messages={messages}
        busy={busy}
        modelOn={settings.modelOn}
        modelName={settings.modelName}
        onReport={setReport}
        onAsk={(command) => void ask(command, "chat")}
        onDeskCommand={(command) => {
          if (followCommand(command)) return
          void ask(command, "chat")
        }}
        onSaveNote={addStudyNote}
        onSaveWiki={(text) => addWikiFromText(text)}
        hasNotebook={Boolean(activeNotebook()?.cards.length || activeNotebook()?.pages?.length)}
        onShare={() => void shareReport()}
        spoken={selectedText ?? chapterVerses.slice(0, 3).join(" ")}
        voice={settings.plugins.voice}
        onOpenVoice={() => setDesk((current) => openWindow(current, "voice"))}
        modelState={modelLabel}
        modelReady={modelState === "ready"}
        onOpenSettings={() => setDesk((current) => openWindow(current, "settings"))}
        readingWhere={passageLabel(place.book, place.chapter + 1, place.verse == null ? null : place.verse + 1)}
        readingLine={selectedText ?? chapterVerses[0] ?? ""}
        paneRequest={paneRequest}
        onExportPdf={exportChatPdf}
        onClear={() => {
          cancelAsk()
          setMessages([])
        }}
        onCancelAsk={cancelAsk}
        onOpenRef={(reference) => {
          const parsed = parseReference(reference)
          if (parsed) openPassage(parsed)
        }}
      />
    )
  }

  function windowBody(id: WinId) {
    if (id === "voice") {
      return (
        <VoiceWindow
          enabled={settings.plugins.voice}
          options={voicePanelOptions}
          earMode={settings.sttMode}
          server={voiceServer}
          readingWhere={placeLabel}
          onOptions={(patch) => setSettings((current) => ({ ...current, ...patch }))}
          onOpenSettings={() => {
            setDesk((current) => openWindow(current, "settings"))
            window.setTimeout(() => document.getElementById("set-voice")?.scrollIntoView({ block: "start", behavior: "smooth" }), 250)
          }}
          onCopy={(text) => void copyText(text)}
          onAsk={(text) => voice.ask(text)}
        />
      )
    }
    if (id === "settings") {
      return (
        <SettingsPane
          settings={settings}
          modelState={modelLabel}
          theme={theme}
          onTheme={setTheme}
          onChange={setSettings}
          onTest={testModel}
        />
      )
    }
    if (id === "gematria") {
      return (
        <GematriaPane
          verse={selectedText}
          verseLabel={place.verse == null ? null : placeLabel}
          verses={chapterVerses}
          passage={scripture?.text[translation][place.book]?.[place.chapter]?.join(" ") ?? ""}
          chapterLabel={passageLabel(place.book, place.chapter + 1, null)}
          bookIndex={place.book}
          chapterIndex={place.chapter}
          chapterCounts={(scripture?.text[translation] ?? []).map((book) => book.length)}
          original={originalChapter(originals, place.book, place.chapter) || originalVerse(originals, place.book, place.chapter, place.verse ?? 0)}
          onStudy={(phrase) => void ask(`What does the count of “${phrase}” add to this verse?`, "chat")}
          onCopy={(text) => void copyText(text, "Totals copied")}
          onSave={(label, text, tags) => pinNoteCard(label, text, tags)}
          onSearchOutside={(query) => openOutside(query)}
          onOpen={(ref) => {
            const parsed = parseReference(ref)
            if (parsed) openPassage(parsed)
          }}
          onPlace={(book, chapter) => setPlace({ book, chapter, verse: null })}
          onLetter={(glyph) => {
            setStrongQuery(glyph)
            setDesk((current) => openWindow(current, "strongs"))
          }}
          onRoots={(glyph) => openRoots(glyph)}
          onStrong={openStrong}
          onAsk={(question) => void ask(question, "chat")}
        />
      )
    }
    if (id === "practice") {
      return (
        <PracticePane
          focus={practiceFocus}
          practiceCues={settings.practiceCues}
          onPracticeCuesChange={(on) => setSettings((current) => ({ ...current, practiceCues: on }))}
          onOpen={(reference) => {
            const parsed = parseReference(reference)
            if (parsed) openPassage(parsed)
          }}
          onOpenJournal={() => {
            setStudyTabRequest("notes")
            setNotesViewRequest("write")
            setDesk((current) => openWindow(current, "references"))
          }}
        />
      )
    }
    if (id === "heavens") {
      return (
        <HeavensPane
          query={query}
          verseLabel={place.verse == null ? null : placeLabel}
          onOpen={(ref) => {
            const parsed = parseReference(ref)
            if (parsed) openPassage(parsed)
          }}
          onStudy={(summary) => {
            let hasIdentity = false
            try {
              const facts = JSON.parse(summary) as { name?: string | null; date?: string | null; place?: string | null }
              hasIdentity = Boolean(facts.name?.trim() || facts.date?.trim() || facts.place?.trim())
            } catch {
              hasIdentity = true
            }
            const leaves =
              settings.modelOn && (settings.modelMode === "cloud" || modelHostLeavesDevice(settings.modelUrl))
            if (
              hasIdentity &&
              leaves &&
              !window.confirm(
                "Send this cast’s name, date, and place to your model host?\n\nThis leaves the device. Cancel to keep the chart on the desk only.",
              )
            ) {
              return
            }
            void ask(
              `Study this cast sky beside the open verse. Chart facts (desk ephemeris, not a fortune):\n${summary}`,
              "chat",
            )
          }}
          onSave={(label, text, tags) => pinNoteCard(label, text, tags)}
          onSearchOutside={(query) => openOutside(query)}
        />
      )
    }
    if (id === "writings") {
      return (
        <WritingsPane
          library={extraLibrary}
          catalog={writingCatalog}
          loadingId={loadingWork}
          query={writingQuery}
          focus={writingFocus}
          verseLabel={place.verse == null ? null : placeLabel}
          verseText={selectedText}
          onQuery={setWritingQuery}
          onNeedWork={(id) => void ensureWork(id)}
          onAsk={(prompt) => void ask(prompt, "chat")}
          onCopy={(text) => void copyText(text, "Section copied")}
          onSave={(label, text, tags) => pinNoteCard(label, text, tags)}
          onLookUp={(query) => openStrong(query)}
          onOpenRef={(ref) => {
            const parsed = parseReference(ref)
            if (parsed) openPassage(parsed)
          }}
        />
      )
    }
    if (id === "books") {
      return (
        <Library
          activeBook={place.book}
          activeChapter={place.chapter}
          purpose={purposeFor(place.book)}
          chapters={scripture?.text[translation][place.book]?.length ?? 0}
          onPick={(bookIndex, chapter = 0) => {
            setPlace({ book: bookIndex, chapter, verse: null })
            reveal("bible")
          }}
        />
      )
    }
    if (id === "strongs") {
      return (
        <StrongsPane
          library={strongs}
          query={strongQuery}
          verseIds={strongs ? verseStrongIds(strongs, place.book, place.chapter, place.verse) : []}
          verseLabel={place.verse == null ? null : placeLabel}
          bookIndex={place.book}
          onQuery={setStrongQuery}
          onAsk={(id) => void ask(`What does ${id} mean in this verse?`, "chat")}
          onOpenVerse={(book, chapter, verse) => {
            setTranslation("kjv")
            openVerse(book, chapter, verse)
          }}
          onCopy={(text) => void copyText(text, "Strong's entry copied")}
          onSave={(label, text, tags) => pinNoteCard(label, text, tags)}
          onSearchOutside={(query) => openOutside(query)}
          onCount={() => setDesk((current) => openWindow(current, "gematria"))}
          onRoots={(id) => openRoots(id)}
        />
      )
    }
    if (id === "roots") {
      return (
        <RootsPane
          library={strongs}
          query={strongQuery}
          verseIds={strongs ? verseStrongIds(strongs, place.book, place.chapter, place.verse) : []}
          verseLabel={place.verse == null ? null : placeLabel}
          onQuery={setStrongQuery}
          onOpenStrong={(id) => openStrong(id)}
          onCount={() => setDesk((current) => openWindow(current, "gematria"))}
          onLearn={() => setDesk((current) => openWindow(current, "gematria"))}
          onSearchOutside={(query) => openOutside(query)}
          onCopy={(text) => void copyText(text, "Root chain copied")}
          onSave={(label, text, tags) => pinNoteCard(label, text, tags)}
        />
      )
    }
    if (id === "references") {
      return (
        <StudyDesk
          bookIndex={place.book}
          chapter={place.chapter + 1}
          verse={place.verse == null ? null : place.verse + 1}
          label={place.verse == null ? null : placeLabel}
          text={selectedText}
          rights={rights}
          todayLabel={todayParsed ? passageLabel(todayParsed.book, todayParsed.chapter, todayParsed.verse) : null}
          todayText={todayText}
          todayRef={todayRef}
          readings={readings}
          notebooks={notebooks}
          notebookId={notebookId || notebooks[0]?.id || ""}
          onPickNotebook={setNotebookId}
          onNotebook={changeNotebook}
          onAddNote={addNoteCard}
          onExportNotebook={exportNotebookPdf}
          onExportPack={exportStudyPack}
          onImportPack={(file) => void importStudyPack(file)}
          onCopyMarkdown={copyNotebookMarkdown}
          wikiFocusId={wikiFocusId}
          notesViewRequest={notesViewRequest}
          onNotesViewHandled={() => setNotesViewRequest(null)}
          tabRequest={studyTabRequest}
          onTabRequestHandled={() => setStudyTabRequest(null)}
          onAsk={(question) => void ask(question, "chat")}
          onStrong={openStrong}
          onNewNotebook={() => {
            const page = blankNotebook(`Notebook ${notebooks.length + 1}`)
            setNotebooks((current) => [...current, page])
            setNotebookId(page.id)
          }}
          onAddExampleNotebook={() => {
            if (notebooks.some((item) => item.title.startsWith("Example · John 3"))) {
              const existing = notebooks.find((item) => item.title.startsWith("Example · John 3"))
              if (existing) {
                setNotebookId(existing.id)
                flash("The example notebook is already here")
                return
              }
            }
            const page = demoNotebook()
            setNotebooks((current) => [...current, page])
            setNotebookId(page.id)
            flash("Example · John 3 notebook added")
          }}
          onTrashNotebook={() => {
            if (notebooks.length < 2) return
            const next = notebooks.filter((item) => item.id !== (notebookId || notebooks[0]?.id))
            setNotebooks(next)
            setNotebookId(next[0]?.id ?? "")
          }}
          onSaveVerse={saveVerseCard}
          onCardColor={(cardId, color) => {
            setNotebooks((current) =>
              current.map((item) => ({ ...item, cards: item.cards.map((card) => (card.id === cardId ? { ...card, color } : card)) })),
            )
            const card = notebooks.flatMap((item) => item.cards).find((item) => item.id === cardId)
            if (card) setMarks((current) => withMark(current, markKey(card.book, card.chapter, card.verse), { color }))
          }}
          onGather={() => {
            const page = activeNotebook()
            if (!page || (!page.cards.length && !page.journal.trim() && !(page.pages ?? []).some((item) => item.body.trim()))) return
            setReport(notebookDump(page))
            setPaneRequest("report")
            setDesk((current) => openWindow(current, "editor"))
            flash("The notebook is in the study")
          }}
          onOpen={openVerse}
          onOpenRef={(ref) => {
            const parsed = parseReference(ref)
            if (parsed) openPassage(parsed)
          }}
          onOpenOutside={openOutside}
        />
      )
    }
    if (id === "editor") {
      return renderChat()
    }
    const bible = (
      <div className="bible-window">
        <div className="bible-tools">
          <SearchField
            query={query}
            suggestion={suggestion}
            hits={results.hits}
            total={results.total}
            labelFor={(row) => passageLabel(row.book, row.chapter + 1, row.verse + 1)}
            onQuery={setQuery}
            onOpenPassage={openPassage}
            onOpenHit={(row) => openVerse(row.book, row.chapter, row.verse)}
          />
          <div className="versions" role="group" aria-label="Translation">
            <label className="sr" htmlFor="translation">
              Reading translation
            </label>
            <Tip content="Reading translation for this chapter">
              <select
                id="translation"
                aria-label="Reading translation"
                title="Reading"
                value={translation}
                onChange={(event) => {
                  const next = event.target.value
                  if (!isTranslationId(next)) return
                  setTranslation(next)
                  if (next !== "kjv") setNumbersOn(false)
                }}
              >
                {(scripture?.translations ?? [{ id: "kjv", label: "KJV" }, { id: "asv", label: "ASV" }]).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Tip>
            <label className="sr" htmlFor="witness">
              Comparison translation
            </label>
            <Tip content="Adds a second public-domain line under each verse — English, other languages, or Hebrew/Greek originals. Off keeps a single reading line.">
              <select
                id="witness"
                aria-label="Comparison translation"
                title="Comparison"
                value={witness}
                onChange={(event) => setWitness(event.target.value as typeof witness)}
              >
                <option value="off">Compare off</option>
                <option value="paired">{translation === "kjv" ? "ASV" : "KJV"}</option>
                <optgroup label="English">
                  <option value="web">WEB</option>
                  <option value="geneva">Geneva</option>
                  <option value="bishops">Bishops</option>
                  <option value="coverdale">Coverdale</option>
                  <option value="ylt">YLT</option>
                  <option value="darby">Darby</option>
                  <option value="bbe">BBE</option>
                  <option value="drc">DRC</option>
                </optgroup>
                <optgroup label="Languages">
                  <option value="rv1909">Spanish · RV 1909</option>
                  <option value="cuvs">Chinese · Union 简</option>
                  <option value="cuvt">Chinese · Union 繁</option>
                  <option value="segond">French · Segond 1910</option>
                  <option value="luther1912">German · Luther 1912</option>
                  <option value="cherokee">Cherokee · NT</option>
                </optgroup>
                <optgroup label="Originals">
                  <option value="wlc">Hebrew · WLC (OT)</option>
                  <option value="tr">Greek · TR (NT)</option>
                </optgroup>
              </select>
            </Tip>
            <Tip content="King James only — shows Strong’s number links on words. Turns on KJV when you press it.">
              <button
                type="button"
                aria-pressed={numbersOn}
                aria-description="King James only. Shows Strong’s number links on words."
                onClick={() => {
                  setNumbersOn((current) => !current)
                  if (!numbersOn) setTranslation("kjv")
                }}
              >
                Numbers
              </button>
            </Tip>
            <button type="button" onClick={() => setDesk((current) => openWindow(current, "references"))}>
              Notes
            </button>
            <ChapterListen
              chapterLabel={passageLabel(place.book, place.chapter + 1, null)}
              verses={chapterVerses}
              voiceName={settings.voiceName}
              voiceRate={settings.voiceRate}
              onVoice={(patch) => setSettings((current) => ({ ...current, ...patch }))}
            />
          </div>
        </div>
        <Reader
          bookName={book.name}
          blurb={purposeFor(place.book)}
          chapterNumber={place.chapter + 1}
          chapterCount={chapterCount}
          verses={readerVerses}
          scale={scale}
          previousLabel={previous ? `${books[previous.book].name} ${previous.chapter + 1}` : null}
          nextLabel={next ? `${books[next.book].name} ${next.chapter + 1}` : null}
          status={
            error ??
            (scripture && chapterCount === 0
              ? `${scripture.translations.find((item) => item.id === translation)?.label ?? "This translation"} does not include ${book.name}.`
              : null)
          }
          libraryLoading={!scripture && !error}
          onRetryLibrary={error ? reloadScripture : undefined}
          layoutKey={`${desk.main}-${desk.side ?? "none"}-${desk.expanded}`}
          showStrongs={numbersOn && translation === "kjv"}
          onStrong={openStrong}
          onChapter={(chapterIndex) => setPlace({ book: place.book, chapter: chapterIndex, verse: null })}
          onVerse={(verseIndex) => setPlace({ book: place.book, chapter: place.chapter, verse: verseIndex })}
          onBack={goBack}
          canGoBack={trail.length > 0}
          links={place.verse == null ? [] : linksFor(place.book, place.chapter + 1, place.verse + 1)}
          onOpenLink={(reference) => {
            const parsed = parseReference(reference)
            if (parsed) openPassage(parsed)
          }}
          todayLabel={todayRef}
          onOpenToday={() => {
            if (todayParsed) openPassage(todayParsed)
          }}
          recent={recentPlaces}
          onOpenRecent={(reference) => {
            const parsed = parseReference(reference)
            if (parsed) openPassage(parsed)
          }}
          bookmarks={Object.entries(marks)
            .filter(([, mark]) => mark.bookmark)
            .map(([key]) => {
              const [book, chapter, verse] = key.split(":").map(Number)
              return passageLabel(book, chapter + 1, verse + 1)
            })
            .slice(0, 40)}
          onOpenBookmark={(reference) => {
            const parsed = parseReference(reference)
            if (parsed) openPassage(parsed)
          }}
          originalNote={originalCredit(originals, place.book)}
          alternates={
            scripture && chapterCount === 0
              ? (["kjv", "drc"] as const)
                  .filter((id) => id !== translation && (scripture.text[id]?.[place.book]?.length ?? 0) > 0)
                  .map((id) => ({
                    id,
                    label: `Read in ${scripture.translations.find((item) => item.id === id)?.label ?? id.toUpperCase()}`,
                  }))
              : []
          }
          onAlternate={(id) => {
            if (!isTranslationId(id)) return
            setTranslation(id)
            if (id !== "kjv") setNumbersOn(false)
          }}
          onPrevious={() => {
            if (previous) setPlace(previous)
          }}
          onNext={() => {
            if (next) setPlace(next)
          }}
          onScale={(direction) =>
            setScale((current) => Math.min(1.4, Math.max(0.85, Math.round((current + direction * 0.1) * 100) / 100)))
          }
          actions={{
            note: selectedMark?.note ?? "",
            onColor: (color) => markVerse({ color }),
            onBookmark: () => markVerse({ bookmark: !selectedMark?.bookmark }),
            onNote: (note) => {
              markVerse({ note })
              flash(note.trim() ? "Note kept" : "Note cleared")
            },
            onCopy: () => void copyVerse(),
            onSave: () => saveVerseCard([]),
            onAsk: () => void ask(`What does ${placeLabel} mean?`, "chat"),
            onCount: () => setDesk((current) => openWindow(current, "gematria")),
            onStrongs:
              translation === "kjv" && strongs
                ? () => {
                    const first = verseStrongIds(strongs, place.book, place.chapter, place.verse)[0]
                    if (first) openStrong(first)
                    else setDesk((current) => openWindow(current, "strongs"))
                  }
                : undefined,
            onRoots:
              translation === "kjv" && strongs
                ? () => {
                    const first = verseStrongIds(strongs, place.book, place.chapter, place.verse)[0]
                    openRoots(first)
                  }
                : undefined,
            onOutside: () => openOutside(verseOutsideQuery()),
          }}
        />
      </div>
    )
    return bible
  }

  function openWorkspace(id: string) {
    if (id === workspaces.active) return
    const items = workspaces.items.map((item) => (item.id === workspaces.active ? bundle(item) : item))
    const next = items.find((item) => item.id === id)
    if (!next) return
    setWorkspaces({ active: id, items })
    applyWorkspace(next, false, { modelKey: settings.modelKey, sttKey: settings.sttKey })
    flash(`Opened ${next.name}`)
  }

  function newWorkspace() {
    const items = workspaces.items.map((item) => (item.id === workspaces.active ? bundle(item) : item))
    const current = items.find((item) => item.id === workspaces.active)
    if (!current) return
    const page = blankNotebook()
    const fresh: Workspace = {
      ...current,
      id: crypto.randomUUID(),
      name: `Study ${items.length + 1}`,
      marks: {},
      report: "",
      notebooks: [page],
      notebookId: page.id,
      messages: [],
    }
    setWorkspaces({ active: fresh.id, items: [...items, fresh] })
    setMarks({})
    setReport("")
    setMessages([])
    setNotebooks([page])
    setNotebookId(page.id)
  }

  function navigate(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const opened = /^(?:open|go to|goto)\s+(.+)$/i.exec(trimmed)
    const target = opened ? opened[1].trim() : trimmed
    const hidden: WinId[] = hiddenWindows(settings)
    const q = target.toLowerCase()
    if (/^(topic|word study)\b/i.test(target)) {
      void ask(target)
      return
    }
    if (q === "today" || q === "reading") {
      if (todayParsed) openPassage(todayParsed)
      return
    }
    if (q === "aroma" || q === "aromas") {
      setPracticeFocus("aroma")
      setDesk((current) => openWindow(current, "practice"))
      return
    }
    if (q === "prayer" || q === "prayers" || q === "dna") {
      setPracticeFocus(q === "dna" ? "dna" : "untangle")
      setDesk((current) => openWindow(current, "practice"))
      return
    }
    if (q === "temple") {
      setPracticeFocus("temple")
      setDesk((current) => openWindow(current, "practice"))
      return
    }
    if (q === "meditate" || q === "meditation" || q === "meditations") {
      setPracticeFocus("meditate")
      setDesk((current) => openWindow(current, "practice"))
      return
    }
    if (q === "study links" || q === "links" || q === "lost books" || q === "anthropology" || q === "shem") {
      setStudyTabRequest("links")
      setDesk((current) => openWindow(current, "references"))
      return
    }
    if (q === "cards" || q === "flashcards" || q === "flashcard") {
      setPracticeFocus("cards")
      setDesk((current) => openWindow(current, "practice"))
      return
    }
    if (q === "journal") {
      setPracticeFocus("journal")
      setDesk((current) => openWindow(current, "practice"))
      return
    }
    if (/^(extra-?canon(?:ical)?|outside|writings|enoch|sophia|jasher|yetzirah|targum|talmud)$/.test(q)) {
      const named = catalogMatch(writingCatalog, q)
      if (named) {
        setWritingQuery(named.title)
        void ensureWork(named.id)
      }
      setDesk((current) => openWindow(current, "writings"))
      return
    }
    if (/^(strongs|strong's)$/.test(q)) {
      setDesk((current) => openWindow(current, "strongs"))
      return
    }
    if (/^(roots|etymology)$/.test(q)) {
      openRoots()
      return
    }
    const exact = windows.find((item) => !hidden.includes(item.id) && (item.title.toLowerCase() === q || item.id === q))
    if (exact) {
      setDesk((current) => openWindow(current, exact.id))
      return
    }
    const strongId = normalizeStrong(target)
    if (strongId && /^[hg]/i.test(target)) {
      setStrongQuery(strongId)
      setDesk((current) => openWindow(current, "strongs"))
      return
    }
    if (/^[\u05D0-\u05EA]$/.test(target)) {
      setStrongQuery(target)
      setDesk((current) => openWindow(current, "strongs"))
      return
    }
    if (/\d/.test(target)) {
      const ref = parseReference(target)
      if (ref) {
        openPassage(ref)
        return
      }
    }
    const named = catalogMatch(writingCatalog, target)
    if (named) {
      setWritingQuery(target)
      setWritingFocus({ workId: named.id, section: 0 })
      void ensureWork(named.id)
      setDesk((current) => openWindow(current, "writings"))
      return
    }
    const writingHit = searchWritings(extraLibrary, target, 1)[0]
    setQuery(target)
    if (writingHit) {
      setWritingQuery(target)
      setWritingFocus({ workId: writingHit.workId, section: writingHit.section })
      setDesk((current) => openWindow(current, "writings"))
      return
    }
    setDesk((current) => openWindow(current, "bible"))
  }

  function studyFileName() {
    const name = workspaces.items.find((item) => item.id === workspaces.active)?.name ?? "Study"
    return name.replace(/[^\w.-]+/g, "-") || "study"
  }

  function studyDocument() {
    const notes = Object.entries(marks).flatMap(([key, mark]) => {
      if (!mark.note && !mark.bookmark && !mark.color) return []
      const [bookIndex, chapter, verse] = key.split(":").map(Number)
      const label = passageLabel(bookIndex, chapter + 1, verse + 1)
      const line = scripture?.text[translation][bookIndex]?.[chapter]?.[verse]
      return [`${label}${mark.bookmark ? " · kept" : ""}${mark.color ? ` · ${mark.color}` : ""}`, line ?? "", mark.note ?? ""].filter(Boolean)
    })
    const page = activeNotebook()
    const notebook = page?.cards.length ? notebookDump(page) : ""
    return [report.trim(), notes.length ? ["Marks", "", ...notes].join("\n") : "", notebook].filter(Boolean).join("\n\n") || "This study has no page yet."
  }

  function downloadText(filename: string, contents: string, type: string) {
    const url = URL.createObjectURL(new Blob([contents], { type }))
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  function saveStudyFile() {
    downloadText(
      `${studyFileName()}.json`,
      JSON.stringify(
        {
          name: studyFileName(),
          place,
          translation,
          report,
          marks,
          notebooks,
          notebookId,
        },
        null,
        2,
      ),
      "application/json",
    )
    setNotice("Study saved")
    window.setTimeout(() => setNotice(null), 1800)
  }

  function exportStudyPdf() {
    const name = workspaces.items.find((item) => item.id === workspaces.active)?.name ?? "Study"
    const notes = Object.entries(marks).flatMap(([key, mark]) => {
      if (!mark.note && !mark.bookmark && !mark.color) return []
      const [bookIndex, chapter, verse] = key.split(":").map(Number)
      const line = scripture?.text[translation][bookIndex]?.[chapter]?.[verse] ?? ""
      const tags = [mark.bookmark ? "Bookmarked" : "", mark.color ? `Highlighted ${mark.color}` : ""].filter(Boolean).join(" · ")
      return [{ heading: passageLabel(bookIndex, chapter + 1, verse + 1), body: [line, tags, mark.note ? `Note: ${mark.note}` : ""].filter(Boolean).join("\n"), quote: true }]
    })
    const page = activeNotebook()
    const cards = page?.cards.length ? [{ heading: `Notebook · ${page.title}`, body: notebookDump(page) }] : []
    const sections = [...(report.trim() ? [{ heading: "Study", body: report.trim() }] : []), ...notes, ...cards]
    exportPdf(
      {
        title: name,
        subtitle: `${placeLabel} · ${translation.toUpperCase()} · ${new Date().toLocaleDateString()}`,
        sections: sections.length ? sections : [{ body: "This study has no page yet. Add a reply or keep a note, then export again." }],
        footer: "Anointed Staff · public-domain scripture",
      },
      studyFileName(),
    )
    flash("Study exported as PDF")
  }

  function printStudyFile() {
    const frame = window.open("", "anointed-print")
    if (!frame) return
    const body = studyDocument().replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] ?? char)
    frame.document.write(`<!doctype html><title>${studyFileName()}</title><pre style="font:18px/1.6 Georgia,serif;white-space:pre-wrap;margin:32px">${body}</pre>`)
    frame.document.close()
    frame.focus()
    frame.print()
  }

  async function testModel() {
    const leaves = settings.modelMode === "cloud" || modelHostLeavesDevice(settings.modelUrl)
    if (
      leaves &&
      !confirmLeaveDevice(
        "model-test",
        "Send a short test prompt to your model host?\n\nThis leaves the device when the host is not on this machine.",
      )
    ) {
      return "Test cancelled — nothing left this device."
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (settings.modelKey.trim()) headers.Authorization = `Bearer ${settings.modelKey.trim()}`
    setModelState("checking")
    try {
      const response = await fetch(`${settings.modelUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(Math.min(settings.modelTimeout, 20) * 1000),
        body: JSON.stringify({
          model: settings.modelName,
          messages: [{ role: "user", content: "Reply with the single word ready." }],
          max_tokens: 16,
          temperature: 0,
        }),
      })
      if (!response.ok) {
        setModelState(response.status === 404 ? "missing" : "stopped")
        return `The address answered ${response.status}. Check the model name${settings.modelMode === "cloud" ? " and the key" : ""}.`
      }
      const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
      const content = data.choices?.[0]?.message?.content?.trim() ?? ""
      setModelState("ready")
      return content ? `Connected. The model said: ${content.slice(0, 80)}` : "Connected. The model sent no text."
    } catch (error) {
      setModelState("stopped")
      return error instanceof Error ? error.message : "The model did not answer."
    }
  }

  return (
    <Desk
      theme={theme}
      layout={desk}
      previews={previews}
      status={`${busy ? "Chat working" : "Ready"} · ${modelLabel}`}
      notice={notice}
      onAsk={(text) => void ask(text, "chat")}
      recent={recentPlaces}
      onTheme={() => setTheme((current) => nextDeskTheme(current))}
      onThemePick={setTheme}
      onLayout={setDesk}
      render={windowBody}
      hidden={hiddenWindows(settings)}
      modelReady={modelState === "ready"}
      modelOn={settings.modelOn}
      modelLabel={modelLabel}
      onOpenModelSettings={() => setDesk((current) => openWindow(current, "settings"))}
      onOpenGuide={openGuide}
      libraryBanner={
        !scripture
          ? error
            ? { kind: "error", message: error, onRetry: reloadScripture }
            : {
                kind: "loading",
                message: "Loading Scripture library (~25 MB, once per visit)…",
              }
          : null
      }
      workspaces={workspaces.items}
      activeWorkspace={workspaces.active}
      onWorkspace={openWorkspace}
      onWorkspaceName={(name) =>
        setWorkspaces((current) => ({
          ...current,
          items: current.items.map((item) => (item.id === current.active ? { ...item, name } : item)),
        }))
      }
      onNewWorkspace={newWorkspace}
      onSaveStudy={saveStudyFile}
      onExportPdf={exportStudyPdf}
      onPrintStudy={printStudyFile}
      onRemoveWorkspace={() => {
        if (workspaces.items.length < 2) return
        const currentName = workspaces.items.find((item) => item.id === workspaces.active)?.name ?? "this study"
        if (!window.confirm(`Remove “${currentName}” from this browser? Notes and chat on that study will be gone.`)) return
        const items = workspaces.items.filter((item) => item.id !== workspaces.active)
        const next = items[0]
        setWorkspaces({ active: next.id, items })
        applyWorkspace(next, false, { modelKey: settings.modelKey, sttKey: settings.sttKey })
        flash(`Removed ${currentName} · now in ${next.name}`)
      }}
      onCommand={navigate}
      clockTime={now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      clockDetail={`${now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} · Sun in the ${skyNow(now).sun} · ${skyNow(now).moon}`}
      onOpenSky={() => setDesk((current) => openWindow(current, "heavens"))}
      voiceStatus={voiceState && voiceState.phase !== "off" ? { phase: voiceState.phase, label: voicePhaseLabel[voiceState.phase] } : null}
      onVoiceEnd={voice.end}
    />
  )
}


import { useEffect, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Group, Panel, Separator as PaneHandle, usePanelRef, type Layout } from "react-resizable-panels"
import {
  ArrowLeftRight,
  AudioLines,
  BookMarked,
  BookOpen,
  Bot,
  Calculator,
  Command,
  Droplets,
  Eye,
  FileDown,
  Flame,
  FolderOpen,
  GitBranch,
  Hash,
  HeartHandshake,
  HelpCircle,
  Library,
  Maximize2,
  Minimize2,
  Moon,
  MoreHorizontal,
  PanelLeft,
  PenLine,
  Plus,
  Printer,
  RotateCcw,
  Save,
  ScrollText,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react"
import { donateUrl } from "../settings"
import {
  deskAtmosphereSrc,
  deskThemeHint,
  deskThemeLabel,
  deskThemes,
  nextDeskTheme,
  nextDeskThemeLabel,
  type DeskTheme,
} from "../theme"
import { CommandPalette } from "./CommandPalette"
import { Tour } from "./Tour"
import { markWhatsNewSeen, shouldShowWhatsNew, WhatsNew } from "./WhatsNew"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Menu, MenuCheck, MenuItem, MenuLabel, MenuSeparator } from "./ui/menu"
import { Separator } from "./ui/separator"
import { Pop, Tip, TipProvider } from "./ui/tip"

export type WinId = "bible" | "strongs" | "roots" | "references" | "editor" | "voice" | "books" | "writings" | "heavens" | "gematria" | "practice" | "settings"

export type DeskLayout = {
  main: WinId
  side: WinId | null
  expanded: boolean
}

export const windows: { id: WinId; title: string; hint: string; icon: LucideIcon; group: "Read" | "Study" | "Tools"; key: string }[] = [
  { id: "bible", title: "Bible", hint: "Six public-domain translations and the Apocrypha", icon: BookOpen, group: "Read", key: "1" },
  { id: "books", title: "Books", hint: "The shelf. Bible is the open chapter.", icon: Library, group: "Read", key: "2" },
  { id: "editor", title: "AI", hint: "Chat answers; Study holds your written page", icon: Bot, group: "Study", key: "3" },
  { id: "voice", title: "Voice", hint: "Talk with the study agent hands free", icon: AudioLines, group: "Study", key: "V" },
  { id: "strongs", title: "Strong's", hint: "Hebrew and Greek numbers on the King James", icon: Hash, group: "Study", key: "4" },
  { id: "roots", title: "Roots", hint: "Strong's chain, Hitchcock names, and a short English tree", icon: GitBranch, group: "Study", key: "E" },
  { id: "references", title: "Notes", hint: "Wiki, notebooks, cards, and a Guide to the desk", icon: BookMarked, group: "Study", key: "5" },
  { id: "writings", title: "Extra-canon", hint: "Enoch, Fathers, Hermetic, World, and other public-domain books beside Scripture", icon: ScrollText, group: "Study", key: "6" },
  { id: "gematria", title: "Gematria", hint: "Learn Hebrew letters, count a word, and rearrange it", icon: Calculator, group: "Tools", key: "7" },
  { id: "heavens", title: "Heavens", hint: "Cast a birth chart on the Mazzaroth wheel, with houses and a letter matrix", icon: Sun, group: "Tools", key: "8" },
  { id: "practice", title: "Practice", hint: "Temple · Drill · Cards · Meditate", icon: Flame, group: "Tools", key: "9" },
  { id: "settings", title: "Settings", hint: "Model, voice, plugins, and About", icon: Settings, group: "Tools", key: "0" },
]

export const windowGroups = ["Read", "Study", "Tools"] as const

const titles = Object.fromEntries(windows.map((item) => [item.id, item.title])) as Record<WinId, string>

function themeIcon(theme: DeskTheme): LucideIcon {
  if (theme === "light") return Sun
  if (theme === "parchment") return ScrollText
  if (theme === "mystic") return Sparkles
  if (theme === "ink") return Droplets
  return Moon
}

function ThemeNextIcon({ theme, size }: { theme: DeskTheme; size: number }) {
  const Icon = themeIcon(nextDeskTheme(theme))
  return <Icon size={size} />
}

type DeskProps = {
  theme: DeskTheme
  layout: DeskLayout
  previews: Record<WinId, string>
  status: string
  notice: string | null
  onTheme: () => void
  onThemePick: (theme: DeskTheme) => void
  onLayout: (layout: DeskLayout) => void
  render: (id: WinId) => ReactNode
  hidden?: WinId[]
  workspaces: { id: string; name: string }[]
  activeWorkspace: string
  onWorkspace: (id: string) => void
  onWorkspaceName: (name: string) => void
  onNewWorkspace: () => void
  onSaveStudy: () => void
  onExportPdf: () => void
  onPrintStudy: () => void
  onRemoveWorkspace: () => void
  onCommand: (text: string) => void
  onAsk: (text: string) => void
  recent: string[]
  clockTime: string
  clockDetail: string
  onOpenSky: () => void
  /** A running voice session, shown on the top bar and the Voice icon wherever the desk is. */
  voiceStatus: { phase: string; label: string } | null
  onVoiceEnd: () => void
  /** Model connection for the AI status light. */
  modelReady?: boolean
  modelOn?: boolean
  modelLabel?: string
  onOpenModelSettings?: () => void
  /** Open the Study desk Guide tab (Notes → Guide). */
  onOpenGuide?: () => void
  /** Scripture library boot strip (large JSON). */
  libraryBanner?: { kind: "loading" | "error"; message: string; onRetry?: () => void } | null
}

/** Move a saved layout so the Bible occupies the reading pane. */
export function pinBible(layout: DeskLayout): DeskLayout {
  if (layout.main === "bible") return layout
  if (layout.side === "bible") return { ...layout, main: "bible", side: layout.main }
  return { ...layout, main: "bible", side: layout.main }
}

function isNarrowViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 960px)").matches
}

/** On phones/tablets, promote the window into the single visible (main) pane. */
function focusWindowNarrow(layout: DeskLayout, id: WinId): DeskLayout {
  if (layout.main === id) return { ...layout, expanded: false }
  const previous = layout.main
  let side: WinId | null = layout.side
  if (id === "bible") {
    side = previous !== "bible" ? previous : layout.side && layout.side !== "bible" ? layout.side : null
  } else {
    side = previous === id ? layout.side : previous
  }
  if (side === id) side = null
  return { main: id, side, expanded: false }
}

/** Open a window in a pane of its own. An already-open window is left where it is. */
export function focusWindow(layout: DeskLayout, id: WinId): DeskLayout {
  if (isNarrowViewport()) return focusWindowNarrow(layout, id)
  if (layout.main === id) return { ...layout, expanded: false }
  if (layout.side === id) return { ...layout, main: id, side: layout.main, expanded: false }
  if (id === "bible") {
    if (layout.side == null) return { ...layout, main: "bible", side: layout.main, expanded: false }
    return { ...layout, main: "bible", side: layout.side, expanded: false }
  }
  if (layout.side == null) return { ...layout, side: id, expanded: false }
  return { ...layout, side: id, expanded: false }
}

/** Open the window beside the one already on the desk. */
export function openWindow(layout: DeskLayout, id: WinId): DeskLayout {
  const already = layout.main === id || layout.side === id
  void import("../lib/uiSound").then(({ playUi }) => playUi(already ? "tap" : "open"))
  return focusWindow(layout, id)
}

export function placeWindow(layout: DeskLayout, id: WinId, slot: "main" | "side"): DeskLayout {
  if (slot === "main") {
    if (layout.main === id) return layout
    if (layout.side === id) return { ...layout, main: id, side: layout.main, expanded: false }
    if (layout.side == null) return { ...layout, main: id, side: layout.main, expanded: false }
    return { ...layout, main: id, expanded: false }
  }
  if (layout.main === id) {
    if (!layout.side) return layout
    return { ...layout, main: layout.side, side: id, expanded: false }
  }
  return { ...layout, side: id, expanded: false }
}

export function closeWindow(layout: DeskLayout, slot: "main" | "side"): DeskLayout {
  if (slot === "side") return { ...layout, side: null, expanded: false }
  if (!layout.side) return layout
  return { ...layout, main: layout.side, side: null, expanded: false }
}

export function useNarrow(query = "(max-width: 960px)") {
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setNarrow(media.matches)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [query])
  return narrow
}

const splitPrefix = "anointed-staff.split."

function readSplit(id: string): Layout | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(splitPrefix + id) ?? "null") as Layout | null
    return saved && typeof saved === "object" ? saved : undefined
  } catch {
    return undefined
  }
}

export function resetSplits() {
  for (const key of Object.keys(localStorage)) if (key.startsWith(splitPrefix)) localStorage.removeItem(key)
}

type SplitProps = {
  id: string
  first: ReactNode
  second: ReactNode
  firstSize?: number
  firstMin?: number
  secondMin?: number
  className?: string
  stackBelow?: number
  version?: number
}

const snapPercents = [30, 38, 50, 62, 70]

function nearestSnap(percent: number, threshold = 2.8) {
  let best = percent
  let distance = threshold + 1
  for (const point of snapPercents) {
    const gap = Math.abs(point - percent)
    if (gap < distance) {
      distance = gap
      best = point
    }
  }
  return distance <= threshold ? best : percent
}

/** Two resizable panes. The handle remembers its place. Below the stack width the panes sit one above the other. Double-click snaps to the default split. Drag near 30/38/50/62/70% snaps. */
export function Split({ id, first, second, firstSize = 62, firstMin = 320, secondMin = 260, className, stackBelow = 960, version = 0 }: SplitProps) {
  const stacked = useNarrow(`(max-width: ${stackBelow}px)`)
  const orientation = stacked ? "vertical" : "horizontal"
  const key = `${id}-${orientation}`
  const firstRef = usePanelRef()
  const snapTimer = useRef<number | null>(null)
  return (
    <Group
      key={`${key}-${version}`}
      id={key}
      orientation={orientation}
      className={className ? `split ${className}` : "split"}
      defaultLayout={readSplit(key)}
      onLayoutChanged={(layout, meta) => {
        if (!meta.isUserInteraction) return
        localStorage.setItem(splitPrefix + key, JSON.stringify(layout))
        const panelId = `${key}-a`
        const raw = layout[panelId]
        const percent = typeof raw === "number" ? raw : Number.parseFloat(String(raw))
        if (!Number.isFinite(percent)) return
        const snapped = nearestSnap(percent)
        if (snapped === percent) return
        if (snapTimer.current) window.clearTimeout(snapTimer.current)
        snapTimer.current = window.setTimeout(() => {
          firstRef.current?.resize(`${snapped}%`)
        }, 90)
      }}
    >
      <Panel id={`${key}-a`} panelRef={firstRef} defaultSize={`${firstSize}`} minSize={stacked ? 240 : firstMin} className="split-pane">
        {first}
      </Panel>
      <PaneHandle className="pane-handle" aria-label="Resize panes. Double-click to restore the default split." title="Drag to resize · double-click to reset">
        <i aria-hidden="true" />
      </PaneHandle>
      <Panel id={`${key}-b`} defaultSize={`${100 - firstSize}`} minSize={stacked ? 120 : secondMin} className="split-pane">
        {second}
      </Panel>
    </Group>
  )
}

type RailMode = "open" | "icons" | "closed"

function isWinId(value: unknown): value is WinId {
  return windows.some((item) => item.id === value)
}

function readChrome(): { rail: RailMode; hidden: WinId[]; tabs: WinId[] } {
  try {
    const saved = JSON.parse(localStorage.getItem("anointed-staff.chrome") ?? "{}") as {
      rail?: string
      hidden?: unknown[]
      tabs?: unknown[]
    }
    return {
      rail: saved.rail === "icons" || saved.rail === "closed" ? saved.rail : "open",
      hidden: Array.isArray(saved.hidden) ? saved.hidden.filter(isWinId) : [],
      tabs: Array.isArray(saved.tabs) ? saved.tabs.filter(isWinId).slice(0, 5) : [],
    }
  } catch {
    return { rail: "open", hidden: [], tabs: [] }
  }
}

function readDrag(event: DragEvent) {
  const id = event.dataTransfer.getData("text/plain")
  return isWinId(id) ? id : null
}

const tourKey = "anointed-staff.toured"

export function Desk({
  theme,
  layout,
  previews,
  status,
  notice,
  onTheme,
  onThemePick,
  onLayout,
  render,
  hidden = [],
  workspaces,
  activeWorkspace,
  onWorkspace,
  onWorkspaceName,
  onNewWorkspace,
  onSaveStudy,
  onExportPdf,
  onPrintStudy,
  onRemoveWorkspace,
  onCommand,
  onAsk,
  recent,
  clockTime,
  clockDetail,
  onOpenSky,
  voiceStatus,
  onVoiceEnd,
  modelReady = false,
  modelOn = false,
  modelLabel = "Offline",
  onOpenModelSettings,
  onOpenGuide,
  libraryBanner = null,
}: DeskProps) {
  const aiState = !modelOn ? "off" : modelReady ? "ready" : modelLabel.toLowerCase().includes("check") ? "checking" : modelLabel.toLowerCase().includes("missing") ? "missing" : "stopped"
  const [filter, setFilter] = useState("")
  const [command, setCommand] = useState("")
  const [over, setOver] = useState<"main" | "side" | null>(null)
  const chrome = readChrome()
  const [rail, setRail] = useState<RailMode>(chrome.rail)
  const [editing, setEditing] = useState(false)
  const [hiddenRail, setHiddenRail] = useState<WinId[]>(chrome.hidden)
  const [tabs, setTabs] = useState<WinId[]>(chrome.tabs)
  const reduceMotion = useReducedMotion()
  const [focus, setFocus] = useState(false)
  const [palette, setPalette] = useState(false)
  const [tour, setTour] = useState(() => localStorage.getItem(tourKey) !== "done")
  const [whatsNew, setWhatsNew] = useState(() => shouldShowWhatsNew())
  const [splitVersion, setSplitVersion] = useState(0)
  const beforeFocus = useRef<DeskLayout | null>(null)
  const activeName = workspaces.find((item) => item.id === activeWorkspace)?.name ?? ""
  const visible = windows.filter((item) => !hidden.includes(item.id))

  useEffect(() => {
    localStorage.setItem("anointed-staff.chrome", JSON.stringify({ rail, hidden: hiddenRail, tabs }))
  }, [rail, hiddenRail, tabs])

  useEffect(() => {
    const side = layout.side
    if (!side) return
    setTabs((current) => (current.includes(side) ? current : [side, ...current].slice(0, 5)))
  }, [layout.side])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPalette((current) => !current)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const [hint, setHint] = useState<string | null>(null)
  const narrow = useNarrow()

  function flashHint(message: string) {
    setHint(message)
    window.setTimeout(() => setHint((current) => (current === message ? null : current)), 2800)
  }

  function openDeskWindow(id: WinId) {
    onLayout(openWindow(layout, id))
  }

  function submitCommand(event: FormEvent) {
    event.preventDefault()
    const text = command.trim()
    if (!text) {
      setPalette(true)
      flashHint("Type a reference such as John 3:16, or press Ctrl K to ask the AI.")
      return
    }
    onCommand(text)
    setCommand("")
  }
  const needle = filter.trim().toLowerCase()
  const listed = visible.filter((item) => (item.id === "voice" || !hiddenRail.includes(item.id)) && (!needle || `${item.title} ${item.hint}`.toLowerCase().includes(needle)))

  function toggleFocus() {
    if (focus) {
      setFocus(false)
      if (beforeFocus.current) onLayout(beforeFocus.current)
      return
    }
    beforeFocus.current = layout
    setFocus(true)
    onLayout({ ...focusWindow(layout, "bible"), expanded: true })
  }
  const showSide = layout.side != null && !layout.expanded && !narrow

  function dragStart(event: DragEvent, id: WinId) {
    event.dataTransfer.setData("text/plain", id)
    event.dataTransfer.effectAllowed = "move"
  }

  function dropOn(event: DragEvent, slot: "main" | "side") {
    event.preventDefault()
    const id = readDrag(event)
    setOver(null)
    if (id) onLayout(placeWindow(layout, id, slot))
  }

  function swap() {
    if (!layout.side) return
    onLayout({ ...layout, main: layout.side, side: layout.main, expanded: false })
  }

  function closeTab(id: WinId) {
    const rest = tabs.filter((item) => item !== id)
    setTabs(rest)
    if (layout.side === id) {
      const next = rest.find((item) => item !== layout.main && !hidden.includes(item))
      onLayout(next ? { ...layout, side: next } : closeWindow(layout, "side"))
    }
  }

  function finishTour(open: boolean) {
    setTour(open)
    if (!open) localStorage.setItem(tourKey, "done")
  }

  const actions = [
    { id: "pdf", label: "Export the study as PDF", detail: "Report and verse notes", icon: FileDown, onSelect: onExportPdf },
    { id: "print", label: "Print the study", icon: Printer, onSelect: onPrintStudy },
    { id: "save", label: "Save the study file", detail: "A JSON copy of this study", icon: Save, onSelect: onSaveStudy },
    { id: "new", label: "New study", icon: Plus, onSelect: onNewWorkspace },
    { id: "theme", label: `Use the ${nextDeskThemeLabel(theme).toLowerCase()}`, detail: `Now ${deskThemeLabel(theme)} · ${deskThemeHint(theme)}`, icon: themeIcon(nextDeskTheme(theme)), onSelect: onTheme },
    { id: "focus", label: focus ? "Leave focus reading" : "Focus reading", detail: "The chapter alone, on parchment", icon: Eye, onSelect: toggleFocus },
    { id: "swap", label: "Swap the panes", icon: ArrowLeftRight, onSelect: swap },
    { id: "rail", label: rail === "open" ? "Collapse the sidebar" : "Expand the sidebar", icon: PanelLeft, onSelect: () => setRail((current) => (current === "open" ? "icons" : "open")) },
    { id: "tour", label: "Take the tour", icon: HelpCircle, onSelect: () => setTour(true) },
    ...(onOpenGuide
      ? [{ id: "guide", label: "Open the desk guide", icon: BookMarked, onSelect: onOpenGuide }]
      : []),
    { id: "meditate", label: "Practice · Meditate", detail: "Timed quiet with offline River guides", icon: Flame, onSelect: () => onCommand("meditate") },
    { id: "study-links", label: "Study · Links", detail: "Cross-refs, lost books, anthropology, Shem 72", icon: BookMarked, onSelect: () => onCommand("study links") },
    { id: "extra-canon", label: "Extra-canon shelf", detail: "Enoch, Jasher, Goetia history, Fathers", icon: ScrollText, onSelect: () => onCommand("extra-canon") },
  ]

  function pane(slot: "main" | "side") {
    const id = slot === "main" ? layout.main : layout.side
    if (!id) return null
    const item = windows.find((entry) => entry.id === id)
    const Icon = item?.icon ?? PenLine
    const other = slot === "main" ? layout.side : layout.main
    return (
      <section
        className={slot === "main" ? "column main-column" : "column screen"}
        aria-label={slot === "main" ? titles[id] : `${titles[id]} screen`}
        onDragOver={(event) => {
          event.preventDefault()
          setOver(slot)
        }}
        onDragLeave={() => setOver((current) => (current === slot ? null : current))}
        onDrop={(event) => dropOn(event, slot)}
        data-over={over === slot ? "true" : "false"}
      >
        <header className="column-bar">
          <i className={`mark mark-${id}`} aria-hidden="true" data-live={id === "voice" && voiceStatus ? voiceStatus.phase : undefined} draggable onDragStart={(event) => dragStart(event, id)}>
            <Icon size={16} />
            {id === "voice" && voiceStatus && voiceStatus.phase !== "error" ? <em className="live-dot" /> : null}
          </i>
          <div className="column-title">
            <Menu label={<b>{titles[id]}</b>} ariaLabel={`Choose the window for the ${slot === "main" ? "reading" : "side"} pane`} className="title-menu">
              <MenuLabel>Show in this pane</MenuLabel>
              {visible.map((entry) => (
                <MenuCheck key={entry.id} checked={entry.id === id} hint={entry.key} onSelect={() => onLayout(placeWindow(layout, entry.id, slot))}>
                  {entry.title}
                </MenuCheck>
              ))}
            </Menu>
            <small>{previews[id]}</small>
          </div>
          <div className="window-actions">
            {slot === "main" ? (
              <Tip content={layout.expanded ? "Restore both panes" : "Give this window the whole desk"}>
                <button type="button" className="icon-btn" aria-label={layout.expanded ? "Restore windows" : "Expand window"} onClick={() => onLayout({ ...layout, expanded: !layout.expanded })}>
                  {layout.expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
              </Tip>
            ) : null}
            <Menu label={<MoreHorizontal size={16} />} caret={false} ariaLabel={`${titles[id]} window options`} align="end" className="icon-btn">
              <MenuItem icon={<ArrowLeftRight size={14} />} onSelect={swap} disabled={!other}>
                Swap panes
              </MenuItem>
              {slot === "side" ? (
                <MenuItem icon={<BookOpen size={14} />} onSelect={() => onLayout(placeWindow(layout, id, "main"))}>
                  Move to the reading pane
                </MenuItem>
              ) : null}
              <MenuItem icon={<RotateCcw size={14} />} onSelect={() => {
                resetSplits()
                setSplitVersion((value) => value + 1)
              }}>
                Reset pane widths
              </MenuItem>
              <MenuSeparator />
              <MenuItem icon={<X size={14} />} disabled={slot === "main" && !layout.side} onSelect={() => onLayout(closeWindow(layout, slot))}>
                Close {titles[id]}
              </MenuItem>
            </Menu>
            {(slot === "side" || layout.side) ? (
              <Tip content={`Close ${titles[id]}`}>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Close ${titles[id]}`}
                  disabled={slot === "main" && !layout.side}
                  onClick={() => onLayout(closeWindow(layout, slot))}
                >
                  <X size={15} />
                </button>
              </Tip>
            ) : null}
          </div>
        </header>
        {slot === "side" && tabs.length > 1 ? (
          <div className="pane-tabs" role="tablist" aria-label="Side pane windows">
            {tabs
              .filter((tab) => tab !== layout.main && !hidden.includes(tab))
              .map((tab) => (
                <span key={tab} className="pane-tab" data-active={tab === id ? "true" : "false"}>
                  <button type="button" role="tab" aria-selected={tab === id} onClick={() => onLayout({ ...layout, side: tab })}>
                    {titles[tab]}
                  </button>
                  <button type="button" className="pane-tab-close" aria-label={`Close the ${titles[tab]} tab`} onClick={() => closeTab(tab)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
          </div>
        ) : null}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={id}
            className="window-body"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {render(id)}
          </motion.div>
        </AnimatePresence>
      </section>
    )
  }

  return (
    <TipProvider delayDuration={350} skipDelayDuration={150}>
      <div className="stage" data-theme={theme} data-expanded={layout.expanded ? "true" : "false"} data-rail={focus ? "closed" : rail} data-focus={focus ? "true" : "false"}>
        <img
          className="stage-atmosphere"
          src={deskAtmosphereSrc(theme)}
          alt=""
          aria-hidden="true"
        />
        {focus ? (
          <div className="focus-bar">
            <b>The scroll</b>
            <span>{previews.bible}</span>
            <Button type="button" size="sm" onClick={toggleFocus}>
              Leave the scroll
            </Button>
          </div>
        ) : null}
        <header className="topbar">
          <img className="topbar-wordmark topbar-wordmark-dark" src="/brand/wordmark-dark.png" alt="Anointed Staff" />
          <img className="topbar-wordmark topbar-wordmark-cream" src="/brand/wordmark-cream.png" alt="Anointed Staff" />
          <Tip content="The sky now. Opens Heavens.">
            <button type="button" className="sky-clock" onClick={onOpenSky}>
              <b>{clockTime}</b>
              <small>{clockDetail}</small>
            </button>
          </Tip>
          {onOpenModelSettings ? (
            <Tip content={modelOn ? `Model ${modelLabel}` : "Turn the model on in Settings"}>
              <button type="button" className="model-status" data-state={aiState} onClick={onOpenModelSettings} aria-label={`AI ${modelLabel}`}>
                <i className="ai-dot" data-state={aiState} aria-hidden="true" />
                <b>{modelReady && modelOn ? "AI" : "AI"}</b>
                <span>{modelOn ? modelLabel : "Off"}</span>
              </button>
            </Tip>
          ) : null}
          {voiceStatus ? (
            <span className="voice-pill" data-phase={voiceStatus.phase} role="status" aria-live="polite">
              <button type="button" onClick={() => onLayout(openWindow(layout, "voice"))} aria-label={`Voice chat is on: ${voiceStatus.label}. Open the Voice window`}>
                <i aria-hidden="true" />
                <AudioLines size={14} />
                <b>Voice</b>
                <span>{voiceStatus.label}</span>
              </button>
              <Tip content="End voice chat">
                <button type="button" className="voice-pill-end" onClick={onVoiceEnd} aria-label="End voice chat">
                  <X size={13} />
                </button>
              </Tip>
            </span>
          ) : null}
          <Menu label={<><FolderOpen size={16} /> Study</>} ariaLabel="Study menu" className="top-menu">
            <MenuLabel>Workspaces</MenuLabel>
            {workspaces.map((item) => (
              <MenuCheck key={item.id} checked={item.id === activeWorkspace} onSelect={() => onWorkspace(item.id)}>
                {item.name}
              </MenuCheck>
            ))}
            <MenuSeparator />
            <MenuItem icon={<Plus size={14} />} onSelect={onNewWorkspace}>
              New study
            </MenuItem>
            <MenuItem icon={<FileDown size={14} />} onSelect={onExportPdf}>
              Export as PDF
            </MenuItem>
            <MenuItem icon={<Printer size={14} />} onSelect={onPrintStudy}>
              Print
            </MenuItem>
            <MenuItem icon={<Save size={14} />} onSelect={onSaveStudy}>
              Save the study file
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Trash2 size={14} />} onSelect={onRemoveWorkspace} disabled={workspaces.length < 2}>
              Delete this study
            </MenuItem>
          </Menu>
          <label className="sr" htmlFor="workspace-name">
            Study name
          </label>
          <Input id="workspace-name" className="workspace-name" aria-label="Workspace name" value={activeName} onChange={(event) => onWorkspaceName(event.target.value)} />
          <form className="command-form" onSubmit={submitCommand}>
            <label className="sr" htmlFor="app-search">
              Search the desk
            </label>
            <Input
              id="app-search"
              value={command}
              placeholder="Go to John 3:16, open Notes, or Ctrl K to ask"
              onChange={(event) => setCommand(event.target.value)}
            />
            <Tip content="Ask the AI or jump anywhere" keys="Ctrl K">
              <button type="button" className="palette-btn" aria-label="Open the command palette" onClick={() => setPalette(true)}>
                <Command size={15} />
                <kbd>K</kbd>
              </button>
            </Tip>
            <Tip content="Opens a place or window. For questions, use Ctrl K → Ask.">
              <Button type="submit" size="sm">
                Go
              </Button>
            </Tip>
          </form>
          <Menu label={<><Eye size={16} /> View</>} ariaLabel="View menu" align="end" className="top-menu">
            <MenuLabel>Sidebar</MenuLabel>
            <MenuCheck checked={rail === "open"} onSelect={() => setRail("open")}>
              Full
            </MenuCheck>
            <MenuCheck checked={rail === "icons"} onSelect={() => setRail("icons")}>
              Icons only
            </MenuCheck>
            <MenuCheck checked={rail === "closed"} onSelect={() => setRail("closed")}>
              Hidden
            </MenuCheck>
            <MenuSeparator />
            <MenuCheck checked={focus} onSelect={toggleFocus}>
              Focus reading
            </MenuCheck>
            <MenuCheck checked={layout.expanded} onSelect={() => onLayout({ ...layout, expanded: !layout.expanded })}>
              Expand the reading pane
            </MenuCheck>
            <MenuItem icon={<ArrowLeftRight size={14} />} onSelect={swap} disabled={!layout.side}>
              Swap panes
            </MenuItem>
            <MenuItem
              icon={<RotateCcw size={14} />}
              onSelect={() => {
                resetSplits()
                setSplitVersion((value) => value + 1)
              }}
            >
              Reset pane widths
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<ThemeNextIcon theme={theme} size={14} />} onSelect={onTheme}>
              Next · {nextDeskThemeLabel(theme)} (now {deskThemeLabel(theme)})
            </MenuItem>
            {deskThemes.map((item) => {
              const Icon = themeIcon(item)
              return (
                <MenuItem
                  key={item}
                  icon={<Icon size={14} />}
                  onSelect={() => onThemePick(item)}
                  disabled={item === theme}
                >
                  {deskThemeLabel(item)}
                  {item === theme ? " · current" : ` · ${deskThemeHint(item)}`}
                </MenuItem>
              )
            })}
          </Menu>
          <Tip content={`Appearance: ${deskThemeLabel(theme)} (${deskThemeHint(theme)}). Click cycles · View menu picks any look.`}>
            <button
              type="button"
              className="icon-btn theme-toggle"
              data-theme-mode={theme}
              aria-label={`Appearance ${deskThemeLabel(theme)}. Switch to ${nextDeskThemeLabel(theme)}`}
              onClick={onTheme}
            >
              <ThemeNextIcon theme={theme} size={16} />
            </button>
          </Tip>
          <Tip content="Support the desk on PayPal">
            <button
              type="button"
              className="icon-btn support-btn"
              aria-label="Support the desk on PayPal"
              onClick={() => window.open(donateUrl, "_blank", "noopener")}
            >
              <HeartHandshake size={16} />
            </button>
          </Tip>
          <Pop
            align="end"
            className="help-pop"
            trigger={
              <button type="button" className="icon-btn" aria-label="Help and shortcuts">
                <HelpCircle size={16} />
              </button>
            }
          >
            <b>Shortcuts</b>
            <dl className="keys">
              <dt>Ctrl K</dt>
              <dd>Command palette</dd>
              <dt>1 – 0</dt>
              <dd>Open a window</dd>
              <dt>V</dt>
              <dd>Voice chat</dd>
              <dt>← →</dt>
              <dd>Previous and next chapter</dd>
              <dt>Alt ←</dt>
              <dd>Back to the last place</dd>
              <dt>/</dt>
              <dd>Scripture search when Bible is open; otherwise the Go bar</dd>
            </dl>
            <p>Drag a sidebar window onto a pane to open it there. Drag the handle between panes to resize them.</p>
            <div className="help-actions">
              {onOpenGuide ? (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    onOpenGuide()
                  }}
                >
                  Open Guide · Shortcuts
                </Button>
              ) : null}
              <Button type="button" variant={onOpenGuide ? "outline" : "default"} size="sm" onClick={() => setTour(true)}>
                Take the tour
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => window.open(donateUrl, "_blank", "noopener")}>
                <HeartHandshake size={14} /> Support
              </Button>
            </div>
          </Pop>
        </header>
        <aside className="rail">
          <div className="rail-top">
            <div className="rail-brand">
              <img className="rail-mark rail-mark-dark" src="/brand/mark-as-dark.png" alt="" width={36} height={36} />
              <img className="rail-mark rail-mark-light" src="/brand/mark-cream.png" alt="" width={36} height={36} />
              <div>
                <strong>Anointed Staff</strong>
                <small>Study desk</small>
              </div>
            </div>
            <button type="button" className="rail-expand" onClick={() => setRail("open")} title="Expand the sidebar" aria-label="Expand the sidebar">
              <PanelLeft size={18} />
            </button>
            <div className="rail-actions">
              <Tip content={editing ? "Done editing the sidebar" : "Hide windows from the sidebar"}>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing((current) => !current)} aria-pressed={editing}>
                  <PenLine />
                  <span>{editing ? "Done" : "Edit"}</span>
                </Button>
              </Tip>
              <Tip content={rail === "open" ? "Icons only" : "Full sidebar"}>
                <Button type="button" variant="outline" size="sm" onClick={() => setRail((current) => (current === "open" ? "icons" : "open"))} aria-label="Collapse or restore the sidebar">
                  <PanelLeft />
                  <span>{rail === "open" ? "Collapse" : "Expand"}</span>
                </Button>
              </Tip>
            </div>
          </div>
          <label className="sr" htmlFor="desk-search">
            Find a window
          </label>
          <Input id="desk-search" className="rail-search" value={filter} placeholder="Search windows" onChange={(event) => setFilter(event.target.value)} />
          <div className="rail-list">
            {windowGroups.map((group) => {
              const items = listed.filter((item) => item.group === group)
              if (!items.length) return null
              return (
                <section key={group} aria-label={group}>
                  <p className="rail-group">{group}</p>
                  <ul>
                    {items.map((item) => {
                      const onMain = item.id === layout.main
                      const onSide = item.id === layout.side
                      const active = onMain || onSide
                      return (
                        <li key={item.id} className="rail-row">
                          <Tip side="right" keys={item.key} content={<span className="tip-stack"><b>{item.title}</b><span>{item.hint}</span></span>}>
                            <button
                              type="button"
                              className="rail-item"
                              aria-label={item.title}
                              data-active={active ? "true" : "false"}
                              data-pane={onMain ? "main" : onSide ? "side" : undefined}
                              data-live={item.id === "voice" && voiceStatus ? voiceStatus.phase : undefined}
                              data-voice={item.id === "voice" ? "true" : undefined}
                              data-ai={item.id === "editor" ? "true" : undefined}
                              draggable
                              onDragStart={(event) => dragStart(event, item.id)}
                              onClick={() => openDeskWindow(item.id)}
                            >
                              <i className={`mark mark-${item.id}`} aria-hidden="true">
                                <item.icon size={18} strokeWidth={2.25} />
                                {item.id === "voice" && voiceStatus ? <em className="live-dot" /> : null}
                                {item.id === "editor" ? <em className="ai-dot" data-state={aiState} /> : null}
                              </i>
                              <span>
                                <b>{item.title}</b>
                                <small>{previews[item.id]}</small>
                              </span>
                            </button>
                          </Tip>
                          {editing && item.id !== "bible" ? (
                            <button type="button" className="rail-hide" onClick={() => setHiddenRail((current) => [...current, item.id])}>
                              Hide
                            </button>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
          <Separator className="my-2" />
          {hiddenRail.length ? (
            <button type="button" className="rail-restore" onClick={() => setHiddenRail([])}>
              Show {hiddenRail.length} hidden
            </button>
          ) : null}
          <Tip side="right" content="Support the desk on PayPal">
            <button
              type="button"
              className="rail-foot rail-support"
              aria-label="Support the desk on PayPal"
              onClick={() => window.open(donateUrl, "_blank", "noopener")}
            >
              <i className="avatar support-avatar" aria-hidden="true">
                <HeartHandshake size={16} />
              </i>
              <span>
                <b>Support</b>
                <small>PayPal · {status}</small>
              </span>
            </button>
          </Tip>
        </aside>

        {libraryBanner ? (
          <div className="library-banner" data-kind={libraryBanner.kind} role="status">
            <span>{libraryBanner.message}</span>
            {libraryBanner.onRetry ? (
              <button type="button" onClick={libraryBanner.onRetry}>
                Retry
              </button>
            ) : null}
          </div>
        ) : null}

        <main className="panes">
          {showSide ? (
            <Split id="desk" version={splitVersion} firstSize={64} firstMin={280} secondMin={240} first={pane("main")} second={pane("side")} />
          ) : (
            pane("main")
          )}
        </main>

        <nav className="dock" aria-label="Windows">
          {narrow && layout.main !== "bible" ? (
            <p className="dock-active" aria-live="polite">
              Viewing <b>{titles[layout.main]}</b>
              {previews[layout.main] ? <span> · {previews[layout.main]}</span> : null}
            </p>
          ) : null}
          {windowGroups.map((group) => (
            <div key={group} className="dock-group">
              <span>{group}</span>
              {visible
                .filter((item) => item.group === group)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={item.title}
                    aria-pressed={layout.main === item.id}
                    data-active={layout.main === item.id ? "true" : "false"}
                    data-open={layout.side === item.id ? "true" : undefined}
                    data-live={item.id === "voice" && voiceStatus ? voiceStatus.phase : undefined}
                    title={item.hint}
                    onClick={() => openDeskWindow(item.id)}
                  >
                    <item.icon size={16} strokeWidth={2.25} aria-hidden="true" />
                    <span>{item.title}</span>
                  </button>
                ))}
            </div>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          {notice || hint ? (
            <motion.div
              key={notice ?? hint}
              className="toast"
              role="status"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {notice ?? hint}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <CommandPalette
          open={palette}
          onOpenChange={setPalette}
          windows={visible}
          actions={actions}
          recent={recent}
          onWindow={(id) => isWinId(id) && openDeskWindow(id)}
          onCommand={onCommand}
          onAsk={onAsk}
        />
        <Tour open={tour} onOpenChange={finishTour} />
        <WhatsNew
          open={whatsNew && !tour}
          onClose={() => {
            markWhatsNewSeen()
            setWhatsNew(false)
          }}
          onOpenGuide={onOpenGuide}
        />
      </div>
    </TipProvider>
  )
}

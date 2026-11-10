import type { DeskLayout } from "./components/Desk"
import type { Notebook } from "./notebooks"
import { settingsFrom, settingsWithoutSecrets, type AppSettings } from "./settings"
import type { DeskTheme } from "./theme"
import type { Mark, Place, TranslationId } from "./types"

export const workspaceKey = "anointed-staff.workspaces"

export type WitnessChoice =
  | "off"
  | "paired"
  | "web"
  | "geneva"
  | "bishops"
  | "coverdale"
  | "ylt"
  | "darby"
  | "bbe"
  | "drc"
  | "rv1909"
  | "cuvs"
  | "cuvt"
  | "segond"
  | "luther1912"
  | "cherokee"
  | "wlc"
  | "tr"

/** Compare packs loaded from /witnesses/{id}.json (not paired English mains / originals). */
export const witnessPackIds = [
  "web",
  "geneva",
  "bishops",
  "coverdale",
  "rv1909",
  "cuvs",
  "cuvt",
  "segond",
  "luther1912",
  "cherokee",
] as const

export const witnessLabels: Record<Exclude<WitnessChoice, "off" | "paired">, string> = {
  web: "WEB",
  geneva: "Geneva",
  bishops: "Bishops",
  coverdale: "Coverdale",
  ylt: "YLT",
  darby: "Darby",
  bbe: "BBE",
  drc: "DRC",
  rv1909: "Spanish RV 1909",
  cuvs: "Chinese Union (简)",
  cuvt: "Chinese Union (繁)",
  segond: "French Segond 1910",
  luther1912: "German Luther 1912",
  cherokee: "Cherokee NT",
  wlc: "Hebrew WLC (OT)",
  tr: "Greek TR (NT)",
}

export type Workspace = {
  id: string
  name: string
  place: Place
  translation: TranslationId
  witness: WitnessChoice
  scale: number
  marks: Record<string, Mark>
  theme: DeskTheme
  desk: DeskLayout
  settings: AppSettings
  report: string
  notebooks?: Notebook[]
  notebookId?: string
  /** The chat on this study. It stays in this browser. */
  messages?: { role: "you" | "agent"; text: string }[]
}

export type WorkspaceFile = {
  active: string
  items: Workspace[]
}

function scrubWorkspaceItem(item: Workspace): Workspace {
  return {
    ...item,
    settings: settingsWithoutSecrets(settingsFrom(item.settings)),
  }
}

/** Pull any legacy keys out of a workspace blob once (before scrubbing on save). */
export function secretsFromWorkspaceFile(file: WorkspaceFile | null): { modelKey: string; sttKey: string } {
  const empty = { modelKey: "", sttKey: "" }
  if (!file?.items?.length) return empty
  const active = file.items.find((item) => item.id === file.active) ?? file.items[0]
  const settings = active?.settings
  if (!settings) return empty
  return {
    modelKey: typeof settings.modelKey === "string" ? settings.modelKey : "",
    sttKey: typeof settings.sttKey === "string" ? settings.sttKey : "",
  }
}

export function loadWorkspaceFile(): WorkspaceFile | null {
  try {
    const raw = localStorage.getItem(workspaceKey)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<WorkspaceFile>
    if (!data.active || !Array.isArray(data.items) || data.items.length === 0) return null
    const items = data.items.filter((item) => item && typeof item.id === "string" && item.place)
    if (!items.length) return null
    const active = items.some((item) => item.id === data.active) ? data.active : items[0].id
    return { active, items }
  } catch {
    return null
  }
}

export function saveWorkspaceFile(file: WorkspaceFile) {
  const scrubbed: WorkspaceFile = {
    active: file.active,
    items: file.items.map(scrubWorkspaceItem),
  }
  localStorage.setItem(workspaceKey, JSON.stringify(scrubbed))
}

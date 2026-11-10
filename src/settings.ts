import { inferProviderId, providerById, type ModelProviderId } from "./modelProviders"

export type PluginId = "strongs" | "writings" | "heavens" | "gematria" | "voice"

export const donateUrl = "https://www.paypal.com/donate/?hosted_button_id=3TVS72EVNWXSY"

export type AppSettings = {
  modelOn: boolean
  modelUrl: string
  modelName: string
  modelTimeout: number
  modelMode: "local" | "cloud"
  /** Preset for Local / Cloud; Custom keeps a free-form address. */
  modelProvider: ModelProviderId
  modelKey: string
  systemPrompt: string
  voiceName: string
  voiceRate: number
  voicePause: number
  voiceBargeIn: boolean
  voiceCommands: boolean
  /** How voice chat hears you: the browser's recognizer, or a speech-to-text server. */
  sttMode: "auto" | "browser" | "server"
  sttUrl: string
  sttModel: string
  sttKey: string
  searxOn: boolean
  searxUrl: string
  searxLanguage: string
  /** Soft UI tones (Web Audio). Off when false; also quiet when the OS asks for reduced motion. */
  uiSound: boolean
  /** Spoken Practice quiz cues and meditation end cue (offline mp3). */
  practiceCues: boolean
  /** When true, chat does not force the AI window open beside the Bible. */
  chatKeepWindows: boolean
  /**
   * When true, model/STT API keys are written to localStorage.
   * Default false: keys stay in sessionStorage for this browser session only.
   */
  persistSecrets: boolean
  plugins: Record<PluginId, boolean>
}

export const pluginMeta: { id: PluginId; title: string; detail: string }[] = [
  { id: "strongs", title: "Strong's", detail: "Hebrew and Greek numbers on the King James, with Roots for the chain, Hitchcock names, and an English tree" },
  { id: "writings", title: "Extra-canon", detail: "Enoch, Fathers, Hermetic, World, Jasher, Yetzirah, Targum, Gospels.net, and other public-domain books beside Scripture" },
  { id: "heavens", title: "Heavens", detail: "Cast a birth chart on a light natal wheel, with houses, spans, and a letter matrix of the date" },
  { id: "gematria", title: "Gematria", detail: "Learn the Hebrew letters, count a word, and rearrange it beside this chapter" },
  { id: "voice", title: "Voice", detail: "Read aloud, and the Voice window for hands-free voice chat" },
]

/** Shared instructions for text chat and voice chat. Editable in Settings → Model. */
export const defaultSystemPrompt = [
  "You are the study companion on Anointed Staff — a local desk where Scripture, language (Strong's, Hebrew and Greek), Extra-canon, letters, Heavens, Practice (temple, drills, spoken meditations), notes, and the study wiki converge as one walk of reading and growth.",
  "",
  "Your purpose is to assist the reader's spiritual evolution and careful study: illuminate the open Word, ask thoughtful questions, and help them notice connections across the desk. You do not replace Scripture, dictate belief, or invent verses.",
  "",
  "Voice: friendly and inquisitive, yet wise, calm, and helpful. Prefer short clear pages. Wonder with the reader; do not lecture. Match their pace and invite the next step of curiosity.",
  "",
  "Grounding: Quote only the verses, compare lines, Strong's glosses, notebook cards, and wiki excerpts supplied in the packet. Do not invent Scripture, Strong's numbers, or notebook cards. Heavens and Witness serve Scripture study of the lights (time and glory) — clocks and glory beside the Word, not fortunes or lives ruled by the sky. Practice meditations are quiet disciplines beside Scripture, not magic or fortune-telling.",
  "",
  "Text chat and voice chat share these instructions. Answer the question at the top. Keep the study on one page unless the reader asks for more.",
].join("\n")

/** Older shipped defaults — loadSettings upgrades them to defaultSystemPrompt. */
const legacySystemPrompts = new Set([
  "You write Bible studies from the supplied public-domain context. Quote only the verses given to you. Keep the study on one page.",
  "You write Bible studies from the supplied public-domain context. Quote only the verses and Strong's glosses given to you. Answer the question at the top. Keep the study on one page.",
  [
    "You are the study companion on Anointed Staff — a local desk where Scripture, language (Strong's, Hebrew and Greek), Extra-canon, letters, Heavens, notes, and the study wiki converge as one walk of reading and growth.",
    "",
    "Your purpose is to assist the reader's spiritual evolution and careful study: illuminate the open Word, ask thoughtful questions, and help them notice connections across the desk. You do not replace Scripture, dictate belief, or invent verses.",
    "",
    "Voice: friendly and inquisitive, yet wise, calm, and helpful. Prefer short clear pages. Wonder with the reader; do not lecture. Match their pace and invite the next step of curiosity.",
    "",
    "Grounding: Quote only the verses, compare lines, Strong's glosses, notebook cards, and wiki excerpts supplied in the packet. Do not invent Scripture, Strong's numbers, or notebook cards. Heavens and Witness serve Scripture study of the lights (time and glory) — clocks and glory beside the Word, not fortunes or lives ruled by the sky.",
    "",
    "Text chat and voice chat share these instructions. Answer the question at the top. Keep the study on one page unless the reader asks for more.",
  ].join("\n"),
])

export const defaultSettings: AppSettings = {
  modelOn: false,
  modelUrl: "http://127.0.0.1:11434/v1",
  modelName: "llama3.2",
  modelTimeout: 120,
  modelMode: "local",
  modelProvider: "ollama",
  modelKey: "",
  systemPrompt: defaultSystemPrompt,
  voiceName: "",
  voiceRate: 0.95,
  voicePause: 0.9,
  voiceBargeIn: true,
  voiceCommands: true,
  sttMode: "auto",
  sttUrl: "",
  sttModel: "whisper-1",
  sttKey: "",
  searxOn: false,
  searxUrl: "http://127.0.0.1:8080",
  searxLanguage: "en",
  uiSound: true,
  practiceCues: true,
  chatKeepWindows: false,
  persistSecrets: false,
  plugins: { strongs: true, writings: true, heavens: true, gematria: true, voice: true },
}

const legacyPracticeCuesKey = "anointed-staff.practice-cues"
const secretsSessionKey = "anointed-staff.secrets"

type SecretBag = { modelKey: string; sttKey: string }

function readSecretBag(raw: string | null): SecretBag {
  try {
    const row = asRecord(JSON.parse(raw ?? "{}"))
    return {
      modelKey: typeof row.modelKey === "string" ? row.modelKey : "",
      sttKey: typeof row.sttKey === "string" ? row.sttKey : "",
    }
  } catch {
    return { modelKey: "", sttKey: "" }
  }
}

function writeSessionSecrets(secrets: SecretBag) {
  try {
    sessionStorage.setItem(secretsSessionKey, JSON.stringify(secrets))
  } catch {
    /* private mode */
  }
}

function readSessionSecrets(): SecretBag {
  try {
    return readSecretBag(sessionStorage.getItem(secretsSessionKey))
  } catch {
    return { modelKey: "", sttKey: "" }
  }
}

function migratePracticeCues(saved: Record<string, unknown>): boolean {
  if (typeof saved.practiceCues === "boolean") return saved.practiceCues
  try {
    const raw = localStorage.getItem(legacyPracticeCuesKey)
    if (raw == null) return defaultSettings.practiceCues
    return raw === "1" || raw === "true"
  } catch {
    return defaultSettings.practiceCues
  }
}

const settingsKey = "anointed-staff.settings"
const legacyModelKey = "anointed-staff.model"

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

export function loadSettings(): AppSettings {
  let saved: Record<string, unknown> = {}
  try {
    saved = asRecord(JSON.parse(localStorage.getItem(settingsKey) ?? "{}"))
  } catch {
    saved = {}
  }
  let legacy: { on?: boolean; url?: string; name?: string } = {}
  try {
    legacy = JSON.parse(localStorage.getItem(legacyModelKey) ?? "{}") as typeof legacy
  } catch {
    legacy = {}
  }
  const plugins = asRecord(saved.plugins)
  const diskKeys = {
    modelKey: typeof saved.modelKey === "string" ? saved.modelKey : "",
    sttKey: typeof saved.sttKey === "string" ? saved.sttKey : "",
  }
  const hadLegacyKeys = Boolean(diskKeys.modelKey || diskKeys.sttKey)
  /** Existing desks that already stored keys keep them on disk until the user turns the toggle off. */
  const persistSecrets =
    typeof saved.persistSecrets === "boolean" ? saved.persistSecrets : hadLegacyKeys ? true : defaultSettings.persistSecrets
  const session = readSessionSecrets()
  const secrets: SecretBag = {
    modelKey: session.modelKey || (persistSecrets ? diskKeys.modelKey : ""),
    sttKey: session.sttKey || (persistSecrets ? diskKeys.sttKey : ""),
  }
  if (secrets.modelKey || secrets.sttKey) writeSessionSecrets(secrets)
  if (hadLegacyKeys && !persistSecrets) {
    // Scrub keys out of the main settings blob on next save path.
    try {
      const scrubbed = { ...saved, modelKey: "", sttKey: "", persistSecrets: false }
      localStorage.setItem(settingsKey, JSON.stringify(scrubbed))
    } catch {
      /* private mode */
    }
  }
  return {
    ...defaultSettings,
    modelOn: typeof saved.modelOn === "boolean" ? saved.modelOn : Boolean(legacy.on),
    modelUrl: typeof saved.modelUrl === "string" ? saved.modelUrl : legacy.url || defaultSettings.modelUrl,
    modelName: typeof saved.modelName === "string" ? saved.modelName : legacy.name || defaultSettings.modelName,
    modelTimeout: typeof saved.modelTimeout === "number" ? saved.modelTimeout : defaultSettings.modelTimeout,
    modelMode: saved.modelMode === "cloud" ? "cloud" : "local",
    modelProvider: (() => {
      const mode = saved.modelMode === "cloud" ? "cloud" : "local"
      const url = typeof saved.modelUrl === "string" ? saved.modelUrl : legacy.url || defaultSettings.modelUrl
      const raw = typeof saved.modelProvider === "string" ? saved.modelProvider : ""
      const known = providerById(raw)
      return known && known.mode === mode ? known.id : inferProviderId(mode, url)
    })(),
    modelKey: secrets.modelKey,
    systemPrompt: (() => {
      if (typeof saved.systemPrompt !== "string" || !saved.systemPrompt.trim()) return defaultSystemPrompt
      if (legacySystemPrompts.has(saved.systemPrompt.trim())) return defaultSystemPrompt
      return saved.systemPrompt
    })(),
    voiceName: typeof saved.voiceName === "string" ? saved.voiceName : "",
    voiceRate: typeof saved.voiceRate === "number" ? Math.min(1.6, Math.max(0.6, saved.voiceRate)) : defaultSettings.voiceRate,
    voicePause: typeof saved.voicePause === "number" ? Math.min(2, Math.max(0.5, saved.voicePause)) : defaultSettings.voicePause,
    voiceBargeIn: saved.voiceBargeIn !== false,
    voiceCommands: saved.voiceCommands !== false,
    sttMode: saved.sttMode === "browser" || saved.sttMode === "server" ? saved.sttMode : "auto",
    sttUrl: typeof saved.sttUrl === "string" ? saved.sttUrl : "",
    sttModel: typeof saved.sttModel === "string" && saved.sttModel.trim() ? saved.sttModel : defaultSettings.sttModel,
    sttKey: secrets.sttKey,
    searxOn: saved.searxOn === true,
    searxUrl: typeof saved.searxUrl === "string" ? saved.searxUrl : defaultSettings.searxUrl,
    searxLanguage: typeof saved.searxLanguage === "string" ? saved.searxLanguage : defaultSettings.searxLanguage,
    uiSound: saved.uiSound !== false,
    practiceCues: migratePracticeCues(saved),
    chatKeepWindows: saved.chatKeepWindows === true,
    persistSecrets,
    plugins: {
      strongs: plugins.strongs !== false,
      writings: plugins.writings !== false,
      heavens: plugins.heavens !== false,
      gematria: plugins.gematria !== false,
      voice: plugins.voice !== false,
    },
  }
}

/** Keep only the current settings. Older desks stored tasks, schedules, and a custom donation link. */
export function settingsFrom(saved: Partial<AppSettings> | null | undefined): AppSettings {
  const next: AppSettings = { ...defaultSettings, plugins: { ...defaultSettings.plugins } }
  if (!saved) return next
  const source = saved as Record<string, unknown>
  for (const key of Object.keys(defaultSettings) as (keyof AppSettings)[]) {
    if (key === "plugins" || source[key] === undefined) continue
    ;(next as unknown as Record<string, unknown>)[key] = source[key]
  }
  const plugins = (source.plugins ?? {}) as Partial<Record<PluginId, boolean>>
  next.plugins = {
    strongs: plugins.strongs !== false,
    writings: plugins.writings !== false,
    heavens: plugins.heavens !== false,
    gematria: plugins.gematria !== false,
    voice: plugins.voice !== false,
  }
  next.modelMode = source.modelMode === "cloud" ? "cloud" : "local"
  next.uiSound = source.uiSound !== false
  next.practiceCues = source.practiceCues !== false
  next.chatKeepWindows = source.chatKeepWindows === true
  next.persistSecrets = source.persistSecrets === true
  const provider = typeof source.modelProvider === "string" ? source.modelProvider : ""
  next.modelProvider = provider ? (provider as ModelProviderId) : inferProviderId(next.modelMode, next.modelUrl)
  return next
}

/** Workspace / export snapshots must never carry cloud credentials. */
export function settingsWithoutSecrets(settings: AppSettings): AppSettings {
  return { ...settings, modelKey: "", sttKey: "" }
}

/** Apply workspace prefs while keeping session secrets from settings storage. */
export function settingsWithSecrets(
  saved: Partial<AppSettings> | null | undefined,
  secrets: Pick<AppSettings, "modelKey" | "sttKey">,
): AppSettings {
  const next = settingsFrom(saved)
  next.modelKey = typeof secrets.modelKey === "string" ? secrets.modelKey : ""
  next.sttKey = typeof secrets.sttKey === "string" ? secrets.sttKey : ""
  return next
}

/** True when a model URL is likely to leave this machine. */
export function modelHostLeavesDevice(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `http://${trimmed}`)
    const host = parsed.hostname.toLowerCase()
    return host !== "localhost" && host !== "127.0.0.1" && host !== "[::1]" && host !== "::1"
  } catch {
    return true
  }
}

const egressConsentKey = "anointed-staff.egress-consent"

function readEgressConsent(): Record<string, boolean> {
  try {
    return asRecord(JSON.parse(sessionStorage.getItem(egressConsentKey) ?? "{}")) as Record<string, boolean>
  } catch {
    return {}
  }
}

function rememberEgressConsent(kind: string) {
  try {
    const next = { ...readEgressConsent(), [kind]: true }
    sessionStorage.setItem(egressConsentKey, JSON.stringify(next))
  } catch {
    /* private mode */
  }
}

/**
 * One confirm per browser session for a given leave-device channel.
 * Returns false when the user cancels.
 */
export function confirmLeaveDevice(kind: "nominatim" | "searx" | "model-test", message: string): boolean {
  if (readEgressConsent()[kind]) return true
  if (!window.confirm(message)) return false
  rememberEgressConsent(kind)
  return true
}

export function saveSettings(settings: AppSettings) {
  const secrets: SecretBag = {
    modelKey: settings.modelKey.trim(),
    sttKey: settings.sttKey.trim(),
  }
  writeSessionSecrets(secrets)
  const forDisk = settingsWithoutSecrets({
    ...settings,
    persistSecrets: settings.persistSecrets === true,
  })
  if (settings.persistSecrets) {
    forDisk.modelKey = secrets.modelKey
    forDisk.sttKey = secrets.sttKey
  }
  localStorage.setItem(settingsKey, JSON.stringify(forDisk))
  localStorage.setItem(legacyModelKey, JSON.stringify({ on: settings.modelOn, url: settings.modelUrl, name: settings.modelName }))
  try {
    localStorage.setItem(legacyPracticeCuesKey, settings.practiceCues ? "1" : "0")
  } catch {
    /* private mode */
  }
}

export function hiddenWindows(settings: AppSettings): ("strongs" | "roots" | "writings" | "heavens" | "gematria" | "voice")[] {
  const hidden: ("strongs" | "roots" | "writings" | "heavens" | "gematria" | "voice")[] = []
  if (!settings.plugins.strongs) hidden.push("strongs", "roots")
  if (!settings.plugins.writings) hidden.push("writings")
  if (!settings.plugins.heavens) hidden.push("heavens")
  if (!settings.plugins.gematria) hidden.push("gematria")
  if (!settings.plugins.voice) hidden.push("voice")
  return hidden
}

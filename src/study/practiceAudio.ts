/** Offline Practice audio — guided meditations, quiz cues, Hebrew clips, and soft beds under /audio/practice. */

import { watchSpeaking } from "../voice"

export type PracticeCueId = "correct" | "again" | "complete" | "next" | "reveal" | "drill"
export type PracticeBedKind = "meditate" | "read"

type PracticeManifest = {
  guides?: Record<string, string>
  cues?: Partial<Record<PracticeCueId, string>>
  letters?: Record<string, string>
  names?: Record<string, string>
  /** Optional soft instrumental beds (offline mp3). */
  beds?: { meditate?: string; read?: string }
}

/** Fallback paths if /audio/practice/manifest.json fails to load. */
export const practiceGuideFallback: Record<string, string> = {
  breath: "/audio/practice/guide-breath.mp3",
  rejoice: "/audio/practice/guide-rejoice.mp3",
  word: "/audio/practice/guide-word.mp3",
  creation: "/audio/practice/guide-creation.mp3",
  "fast-frame": "/audio/practice/guide-fast-frame.mp3",
  "psalm-tone": "/audio/practice/guide-psalm-tone.mp3",
  temple: "/audio/practice/guide-temple.mp3",
}

export const practiceCueFallback: Record<PracticeCueId, string> = {
  correct: "/audio/practice/cue-correct.mp3",
  again: "/audio/practice/cue-again.mp3",
  complete: "/audio/practice/cue-complete.mp3",
  next: "/audio/practice/cue-next.mp3",
  reveal: "/audio/practice/cue-reveal.mp3",
  drill: "/audio/practice/cue-drill.mp3",
}

/** Live maps — start as fallbacks, then merge from manifest. */
export let practiceGuideSrc: Record<string, string> = { ...practiceGuideFallback }
export let practiceCueSrc: Record<PracticeCueId, string> = { ...practiceCueFallback }
export let practiceLetterSrc: Record<string, string> = {}
export let practiceNameSrc: Record<string, string> = {}
export let practiceBedSrc: { meditate: string | null; read: string | null } = { meditate: null, read: null }

const cuesKey = "anointed-staff.practice-cues"
const bedKey = "anointed-staff.practice-bed"
const manifestUrl = "/audio/practice/manifest.json"

let shared: HTMLAudioElement | null = null
let guide: HTMLAudioElement | null = null
let clip: HTMLAudioElement | null = null
let bed: HTMLAudioElement | null = null
let bedKind: PracticeBedKind | null = null
let bedDesired = false
let bedDucked = false
let duckWatchInstalled = false
let manifestPromise: Promise<void> | null = null

export function readPracticeCuesOn(): boolean {
  try {
    const raw = localStorage.getItem(cuesKey)
    if (raw == null) return true
    return raw === "1" || raw === "true"
  } catch {
    return true
  }
}

export function writePracticeCuesOn(on: boolean) {
  try {
    localStorage.setItem(cuesKey, on ? "1" : "0")
  } catch {
    /* private mode */
  }
}

function applyManifest(data: PracticeManifest) {
  if (data.guides && typeof data.guides === "object") {
    practiceGuideSrc = { ...practiceGuideFallback, ...data.guides }
  }
  if (data.cues && typeof data.cues === "object") {
    practiceCueSrc = { ...practiceCueFallback, ...data.cues } as Record<PracticeCueId, string>
  }
  if (data.letters && typeof data.letters === "object") {
    practiceLetterSrc = { ...data.letters }
  }
  if (data.names && typeof data.names === "object") {
    practiceNameSrc = { ...data.names }
  }
  practiceBedSrc = {
    meditate: data.beds?.meditate ?? practiceBedSrc.meditate,
    read: data.beds?.read ?? practiceBedSrc.read,
  }
}

export function readPracticeBedOn(): boolean {
  try {
    const raw = localStorage.getItem(bedKey)
    if (raw == null) return false
    return raw === "1" || raw === "true"
  } catch {
    return false
  }
}

export function writePracticeBedOn(on: boolean) {
  try {
    localStorage.setItem(bedKey, on ? "1" : "0")
  } catch {
    /* private mode */
  }
}

function ensureDuckWatch() {
  if (duckWatchInstalled || typeof window === "undefined") return
  duckWatchInstalled = true
  watchSpeaking((speaking) => {
    if (speaking) duckPracticeBed()
    else unduckPracticeBed()
  })
}

export function stopPracticeBed() {
  bedDesired = false
  bedKind = null
  bedDucked = false
  if (!bed) return
  bed.pause()
  bed.currentTime = 0
}

/** Stop only if the playing bed is this kind (so Meditate off does not kill the read bed). */
export function stopPracticeBedIfKind(kind: PracticeBedKind) {
  if (bedKind !== kind) return
  stopPracticeBed()
}

function startBed(kind: PracticeBedKind, volume: number) {
  void ensurePracticeManifest().then(() => {
    if (!bedDesired || bedKind !== kind) return
    const src = practiceBedSrc[kind]
    if (!src || typeof window === "undefined") return
    if (!bed) {
      bed = new Audio()
      bed.loop = true
      bed.preload = "auto"
    }
    try {
      bed.volume = bedDucked ? Math.min(0.08, volume * 0.35) : volume
      const already = bed.getAttribute("data-src") === src && !bed.paused && !bedDucked
      if (already && bed.getAttribute("data-kind") === kind) return
      bed.setAttribute("data-src", src)
      bed.setAttribute("data-kind", kind)
      bed.setAttribute("data-vol", String(volume))
      if (bed.getAttribute("data-src-prev") !== src || bed.paused) {
        bed.src = src
        bed.currentTime = 0
      }
      bed.setAttribute("data-src-prev", src)
      void bed.play().catch(() => {
        /* autoplay policy */
      })
    } catch {
      /* ignore */
    }
  })
}

export function playPracticeBed(kind: PracticeBedKind = "meditate", enabled = readPracticeBedOn()) {
  ensureDuckWatch()
  if (!enabled) {
    stopPracticeBed()
    return
  }
  bedDesired = true
  bedKind = kind
  const volume = kind === "read" ? 0.2 : 0.28
  startBed(kind, volume)
}

export function duckPracticeBed() {
  if (!bed || !bedDesired) return
  bedDucked = true
  const base = Number(bed.getAttribute("data-vol") || "0.28")
  bed.volume = Math.min(0.08, base * 0.35)
}

export function unduckPracticeBed() {
  if (!bed || !bedDesired) return
  bedDucked = false
  const base = Number(bed.getAttribute("data-vol") || "0.28")
  bed.volume = base
  if (bed.paused && bedKind) startBed(bedKind, base)
}

/** Load canonical URLs from public/audio/practice/manifest.json (once). */
export function ensurePracticeManifest(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (!manifestPromise) {
    manifestPromise = fetch(manifestUrl)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<PracticeManifest>
      })
      .then(applyManifest)
      .catch(() => {
        /* keep fallbacks */
      })
  }
  return manifestPromise
}

export function guideSrcFor(sessionId: string, sessionAudio?: string | null) {
  return practiceGuideSrc[sessionId] ?? sessionAudio ?? null
}

export function letterSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export function letterClipSrc(nameOrSlug: string) {
  const slug = letterSlug(nameOrSlug)
  return practiceLetterSrc[slug] ?? `/audio/practice/letter-${slug}.mp3`
}

export function nameClipSrc(name: string) {
  const slug = letterSlug(name)
  return practiceNameSrc[slug] ?? `/audio/practice/name-${slug}.mp3`
}

function ensureShared() {
  if (typeof window === "undefined") return null
  if (!shared) {
    shared = new Audio()
    shared.preload = "auto"
  }
  return shared
}

function ensureClip() {
  if (typeof window === "undefined") return null
  if (!clip) {
    clip = new Audio()
    clip.preload = "auto"
  }
  return clip
}

export function stopPracticeCues() {
  if (!shared) return
  shared.pause()
  shared.removeAttribute("src")
  shared.load()
}

export function stopPracticeGuide() {
  if (!guide) return
  guide.pause()
  guide.currentTime = 0
}

export function stopPracticeClip() {
  if (!clip) return
  clip.pause()
  clip.removeAttribute("src")
  clip.load()
  unduckPracticeBed()
}

/** Stop cues/guides/clips without touching the instrumental bed. */
export function stopPracticeVoiceAudio() {
  stopPracticeCues()
  stopPracticeGuide()
  stopPracticeClip()
}

export function stopAllPracticeAudio() {
  stopPracticeVoiceAudio()
  stopPracticeBed()
}

export function playPracticeCue(id: PracticeCueId, enabled = readPracticeCuesOn()) {
  if (!enabled) return
  void ensurePracticeManifest().then(() => {
    const src = practiceCueSrc[id]
    if (!src) return
    const audio = ensureShared()
    if (!audio) return
    try {
      duckPracticeBed()
      audio.pause()
      audio.src = src
      audio.currentTime = 0
      audio.onended = () => unduckPracticeBed()
      void audio.play().catch(() => {
        unduckPracticeBed()
      })
    } catch {
      unduckPracticeBed()
    }
  })
}

/** Play an offline letter/name clip. Resolves true if playback started, false to allow TTS fallback. */
export async function playPracticeClip(src: string | null | undefined): Promise<boolean> {
  if (!src || typeof window === "undefined") return false
  await ensurePracticeManifest()
  const audio = ensureClip()
  if (!audio) return false
  try {
    duckPracticeBed()
    audio.pause()
    audio.onended = null
    audio.src = src
    audio.currentTime = 0
    audio.onended = () => unduckPracticeBed()
    await audio.play()
    return true
  } catch {
    unduckPracticeBed()
    return false
  }
}

export async function playLetterClip(nameOrSlug: string): Promise<boolean> {
  await ensurePracticeManifest()
  const slug = letterSlug(nameOrSlug)
  const src = practiceLetterSrc[slug]
  if (!src) return false
  return playPracticeClip(src)
}

export async function playNameClip(name: string): Promise<boolean> {
  await ensurePracticeManifest()
  const slug = letterSlug(name)
  const src = practiceNameSrc[slug]
  if (!src) return false
  return playPracticeClip(src)
}

export function createGuideAudio(src: string) {
  if (typeof window === "undefined") return null
  stopPracticeGuide()
  const audio = new Audio(src)
  audio.preload = "auto"
  guide = audio
  audio.addEventListener("play", () => duckPracticeBed())
  audio.addEventListener("ended", () => unduckPracticeBed())
  audio.addEventListener("pause", () => {
    if (audio.ended || audio.currentTime === 0) unduckPracticeBed()
  })
  return audio
}

export function activeGuideAudio() {
  return guide
}

export function formatAudioClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function practiceBedAvailable(kind: PracticeBedKind = "meditate") {
  return Boolean(practiceBedSrc[kind])
}

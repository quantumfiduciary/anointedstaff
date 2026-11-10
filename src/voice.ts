export type RecognitionResult = { isFinal: boolean; length: number; [index: number]: { transcript: string } }
export type RecognitionEvent = { resultIndex: number; results: { length: number; [index: number]: RecognitionResult } }

export type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort?: () => void
}

type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | null {
  const host = window as Window & { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null
}

let preferredVoice = ""
let voiceRate = 0.95
let speaking = false
let speakGeneration = 0
const watchers = new Set<(value: boolean) => void>()

const CHUNK = 2800

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

export function canListen() {
  return recognitionCtor() != null && canSpeak()
}

/** Rough man / woman hint from common English voice names; unknown otherwise. */
export function voiceGenderHint(name: string): "woman" | "man" | "other" {
  if (/\b(female|woman|zira|susan|hazel|karen|moira|samantha|victoria|fiona|martha|tessa|veena|serena|siri|aria|jenny|sonia|libby|emma|ava|sara|kate|allison|amy|joanna|ivy|kimberly|kendra|salli|nicole|raveena)\b/i.test(name)) {
    return "woman"
  }
  if (/\b(male|man|david|mark|daniel|thomas|fred|bruce|alex|tom|lee|james|matthew|justin|joey|kevin|brian|guy|eric|ryan|nathan|arthur)\b/i.test(name)) {
    return "man"
  }
  return "other"
}

export function voiceOptionLabel(voice: SpeechSynthesisVoice) {
  const hint = voiceGenderHint(voice.name)
  const tag = hint === "woman" ? "woman" : hint === "man" ? "man" : "voice"
  return `${voice.name} · ${tag} · ${voice.lang}`
}

/** Split long text into speakable chunks on sentence / clause boundaries. */
export function chunkForSpeech(text: string, max = CHUNK): string[] {
  const clean = text.replace(/\s+/g, " ").trim()
  if (!clean) return []
  if (clean.length <= max) return [clean]
  const parts: string[] = []
  let rest = clean
  while (rest.length > max) {
    let cut = rest.lastIndexOf(". ", max)
    if (cut < max * 0.4) cut = rest.lastIndexOf("; ", max)
    if (cut < max * 0.4) cut = rest.lastIndexOf(", ", max)
    if (cut < max * 0.4) cut = rest.lastIndexOf(" ", max)
    if (cut < max * 0.3) cut = max
    else cut += 1
    parts.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) parts.push(rest)
  return parts.filter(Boolean)
}

export function setPreferredVoice(name: string) {
  preferredVoice = name
}

export function setVoiceRate(rate: number) {
  voiceRate = Math.min(1.6, Math.max(0.6, rate))
}

export function currentVoiceRate() {
  return voiceRate
}

export function watchSpeaking(listener: (value: boolean) => void) {
  watchers.add(listener)
  listener(speaking)
  return () => {
    watchers.delete(listener)
  }
}

function emitSpeaking(value: boolean) {
  speaking = value
  watchers.forEach((listener) => listener(value))
}

export function listVoices() {
  const voices = window.speechSynthesis?.getVoices() ?? []
  return voices
    .filter((voice) => voice.lang.toLowerCase().startsWith("en"))
    .sort((left, right) => {
      const rank = (voice: SpeechSynthesisVoice) => (/natural|neural|aria|jenny|guy|sonia|libby/i.test(voice.name) ? 0 : voice.localService ? 1 : 2)
      return rank(left) - rank(right) || left.name.localeCompare(right.name)
    })
}

export function recognitionSupported() {
  return recognitionCtor() != null
}

export function newRecognition() {
  const Ctor = recognitionCtor()
  return Ctor ? new Ctor() : null
}

export function chooseVoice() {
  const voices = window.speechSynthesis?.getVoices() ?? []
  return (
    voices.find((voice) => voice.name === preferredVoice) ??
    voices.find((voice) => /natural|aria|jenny|guy|sonia|libby|neural/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en") && voice.localService) ??
    null
  )
}

function utter(text: string, generation: number, onDone: (ok: boolean) => void) {
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 3500))
  utterance.rate = voiceRate
  const voice = chooseVoice()
  if (voice) utterance.voice = voice
  utterance.onstart = () => {
    if (generation === speakGeneration) emitSpeaking(true)
  }
  utterance.onend = () => onDone(generation === speakGeneration)
  utterance.onerror = () => onDone(false)
  window.speechSynthesis.speak(utterance)
}

export function speak(text: string, onEnd?: () => void) {
  if (!text.trim() || !canSpeak()) {
    onEnd?.()
    return
  }
  const generation = ++speakGeneration
  window.speechSynthesis.cancel()
  emitSpeaking(true)
  utter(text, generation, (ok) => {
    if (generation !== speakGeneration) return
    emitSpeaking(false)
    if (ok) onEnd?.()
  })
}

/** Read a long passage by queuing sentence-sized chunks (chapters, study pages). */
export function speakChunks(text: string, onEnd?: () => void) {
  if (!canSpeak()) {
    onEnd?.()
    return
  }
  const chunks = chunkForSpeech(text)
  if (!chunks.length) {
    onEnd?.()
    return
  }
  const generation = ++speakGeneration
  window.speechSynthesis.cancel()
  emitSpeaking(true)
  let index = 0
  const next = () => {
    if (generation !== speakGeneration) return
    if (index >= chunks.length) {
      emitSpeaking(false)
      onEnd?.()
      return
    }
    const piece = chunks[index++]
    utter(piece, generation, (ok) => {
      if (!ok || generation !== speakGeneration) {
        if (generation === speakGeneration) emitSpeaking(false)
        return
      }
      next()
    })
  }
  next()
}

export function stopSpeaking() {
  speakGeneration += 1
  window.speechSynthesis?.cancel()
  emitSpeaking(false)
}

export function listenOnce(onText: (text: string) => void, onEnd: () => void) {
  const Ctor = recognitionCtor()
  if (!Ctor) {
    onEnd()
    return () => undefined
  }
  const recognition = new Ctor()
  recognition.lang = "en-US"
  recognition.continuous = false
  recognition.interimResults = false
  recognition.onresult = (event) => {
    const text = event.results[0]?.[0]?.transcript?.trim()
    if (text) onText(text)
  }
  recognition.onerror = () => onEnd()
  recognition.onend = () => onEnd()
  try {
    recognition.start()
  } catch {
    onEnd()
  }
  return () => recognition.stop()
}

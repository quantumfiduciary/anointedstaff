import { chooseVoice, currentVoiceRate, newRecognition, recognitionSupported, type Recognition, type RecognitionEvent } from "./voice"
import { modelHostLeavesDevice } from "./settings"

export type VoicePhase = "off" | "starting" | "listening" | "hearing" | "thinking" | "speaking" | "paused" | "error"

export type VoiceCommand =
  | { kind: "next-verse" | "previous-verse" | "next-chapter" | "previous-chapter" | "read-verse" | "read-chapter" | "save-verse" | "write-study" }
  | { kind: "open"; reference: string }
  | { kind: "rate"; step: number }

export type VoiceLatency = { totalSecs: number; answerSecs: number; voiceSecs: number }

export type VoiceEar = "browser" | "server"

export type VoiceServer = { url: string; model: string; key: string }

export type VoiceState = {
  phase: VoicePhase
  /** What turns speech into words this session. */
  ear: VoiceEar | null
  /** Microphone level, 0 to 1, for the meter. */
  level: number
  /** What the person is saying now, before the turn ends. */
  caption: string
  /** The piece of the answer being spoken. */
  saying: string
  latency: VoiceLatency | null
  note: string
  error: string
}

export type VoiceOptions = {
  /** Seconds of quiet after the last words before the turn is sent. */
  pauseSecs: number
  /** Speaking while the answer plays stops it and takes the turn. */
  bargeIn: boolean
  /** Whole-utterance commands are handled on the desk and never reach the model. */
  commands: boolean
  /** auto uses the browser's recognizer and falls back to the server when the browser has none or it stops answering. */
  earMode: "auto" | VoiceEar
  server: VoiceServer
  onTurn: (text: string) => void
  onCommand: (command: VoiceCommand) => string | void
  onState: (state: VoiceState) => void
}

const HOLD_WORDS = new Set(["wait", "hold on", "pause", "wait a moment", "wait a second", "one moment"])
const STOP_WORDS = new Set(["stop", "stop it", "stop that", "stop talking", "quiet", "be quiet", "cancel", "cancel that", "enough", "thats enough"])
const RESUME_WORDS = new Set(["resume", "continue", "go on", "carry on", "keep going", "im back", "go ahead"])
const REPEAT_WORDS = new Set(["repeat", "repeat that", "say that again", "again", "come again", "pardon"])
const END_WORDS = new Set(["end voice chat", "stop voice chat", "goodbye", "good bye", "thats all", "thats all for now", "end the chat", "hang up"])
const SLOWER_WORDS = new Set(["slower", "speak slower", "slow down", "talk slower"])
const FASTER_WORDS = new Set(["faster", "speak faster", "speed up", "talk faster"])

/** How long a hold word waits for more words before it counts. */
const HOLD_GRACE_MS = 650
/** The first spoken piece may end at a comma once it has this much in it. */
const FIRST_PIECE_WORDS = 4
const FIRST_PIECE_CHARS = 18
/** Words of the answer that come back through the microphone are not the person. */
const ECHO_SHARE = 0.6

export const NO_ANSWER = "I have no answer for that yet. Ask it another way, or open a verse first."
const STILL_WRITING = "One moment, I am still writing the last answer."

export function normalizeSpeech(text: string) {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9: ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** The desk command a whole utterance names, if any. */
export function deskCommand(text: string): VoiceCommand | null {
  const words = normalizeSpeech(text)
  if (/^(next|the next) verse$/.test(words)) return { kind: "next-verse" }
  if (/^(previous|last|the previous) verse$|^go back a verse$/.test(words)) return { kind: "previous-verse" }
  if (/^(next|the next) chapter$/.test(words)) return { kind: "next-chapter" }
  if (/^(previous|last|the previous) chapter$/.test(words)) return { kind: "previous-chapter" }
  if (/^(read|read me) (this|the) verse( aloud)?$/.test(words)) return { kind: "read-verse" }
  if (/^(read|read me) (this|the) chapter( aloud)?$/.test(words)) return { kind: "read-chapter" }
  if (/^(save|keep) (this|the) verse$/.test(words)) return { kind: "save-verse" }
  if (/^(write|run) (a|the) study$|^study this( verse)?$/.test(words)) return { kind: "write-study" }
  if (/^(open )?(extra canon|extra canonical|writings|outside)$/.test(words)) return { kind: "open", reference: "extra-canon" }
  if (/^(open )?(strongs|strong s)$/.test(words)) return { kind: "open", reference: "strongs" }
  const look = words.match(/^(?:look up|open|strongs|strong s) ((?:h|g)\s*\d{1,5})$/)
  if (look) return { kind: "open", reference: look[1].replace(/\s/g, "").toUpperCase() }
  const open = words.match(/^(?:open|go to|turn to|take me to) (.+)$/)
  if (open) return { kind: "open", reference: open[1].replace(/ verse /, ":").replace(/ (\d+) (\d+)$/, " $1:$2") }
  return null
}

/** Text a voice can say: no thoughts, no markup, no lone symbols. */
export function speakableText(text: string) {
  return text
    .replace(/<(think|thinking|thought|reasoning)>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/?(think|thinking|thought|reasoning)>/gi, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+(.+?)[.:]?\s*$/gm, "$1.")
    .replace(/[*_~]+/g, "")
    .replace(/^\s*(?:[-•]|\d+[.)])\s+/gm, "")
    .replace(/[>|]+/g, " ")
    .replace(/(^|\s)[-•–—](?=\s)/g, "$1")
    .replace(/[ \t]*:?[ \t]*\n+/g, (_gap, offset: number, whole: string) => (/[.!?,;]$/.test(whole.slice(0, offset).trimEnd()) ? " " : ". "))
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim()
}

/** Pieces to speak: the first may end at a pause so the voice starts sooner, the rest end at sentences. */
export function speechPieces(text: string) {
  const clean = speakableText(text)
  const sentences = clean.match(/[^.!?]+(?:[.!?]+["”’)]*|$)/g)?.map((item) => item.trim()).filter(Boolean) ?? []
  const pieces: string[] = []
  sentences.forEach((sentence, index) => {
    if (index === 0) {
      const comma = sentence.search(/[,;:]\s/)
      const head = comma > 0 ? sentence.slice(0, comma + 1) : ""
      if (head.length >= FIRST_PIECE_CHARS && head.split(" ").length >= FIRST_PIECE_WORDS && head.length < sentence.length - 8) {
        pieces.push(head, sentence.slice(comma + 1).trim())
        return
      }
    }
    if (sentence.length > 260) {
      const parts = sentence.match(/.{1,220}(?:\s|$)/g) ?? [sentence]
      pieces.push(...parts.map((item) => item.trim()))
    } else pieces.push(sentence)
  })
  return pieces.filter((piece) => /[a-z0-9]/i.test(piece))
}

function echoOf(heard: string, said: string) {
  const words = normalizeSpeech(heard).split(" ").filter((word) => word.length > 2)
  if (!words.length) return true
  const spoken = new Set(normalizeSpeech(said).split(" "))
  return words.filter((word) => spoken.has(word)).length / words.length >= ECHO_SHARE
}

/** Brave ships the speech API without the service behind it, so recognition always fails there. */
export function isBrave() {
  return typeof navigator !== "undefined" && "brave" in navigator
}

export const BRAVE_NOTE = "Brave turns off the browser's speech recognition. Open the desk in Edge or Chrome, or add a speech-to-text server in Settings, Voice."

function micError(error: string | undefined) {
  if (error === "not-allowed" || error === "service-not-allowed") return "The microphone is blocked. Allow it for this page in the browser's site settings, then start again."
  if (error === "audio-capture") return "No microphone was found. Plug one in or choose it in the system sound settings, then start again."
  if (error === "network") return isBrave() ? BRAVE_NOTE : "This browser's speech recognition did not answer. Edge and Chrome work, or add a speech-to-text server in Settings, Voice."
  if (error === "language-not-supported") return "This browser does not recognize English speech."
  return "The microphone stopped. Start voice chat again."
}

/** Whisper-style models write these for silence or noise. */
const PHANTOM = new Set(["you", "thank you", "thanks for watching", "thank you for watching", "thank you so much for watching", "bye", "subtitles by the amaraorg community"])

const VAD_LEAD_SECS = 0.5
const VAD_ONSET_SECS = 0.12
const VAD_MAX_SECS = 30

function wavFrom(chunks: Float32Array[], rate: number, target = 16000) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const joined = new Float32Array(total)
  let offset = 0
  for (const chunk of chunks) {
    joined.set(chunk, offset)
    offset += chunk.length
  }
  const step = rate / target
  const count = Math.floor(total / step)
  const buffer = new ArrayBuffer(44 + count * 2)
  const view = new DataView(buffer)
  const text = (at: number, value: string) => [...value].forEach((char, index) => view.setUint8(at + index, char.charCodeAt(0)))
  text(0, "RIFF")
  view.setUint32(4, 36 + count * 2, true)
  text(8, "WAVE")
  text(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, target, true)
  view.setUint32(28, target * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  text(36, "data")
  view.setUint32(40, count * 2, true)
  for (let index = 0; index < count; index += 1) {
    const start = Math.floor(index * step)
    const end = Math.min(total, Math.floor((index + 1) * step))
    let sum = 0
    for (let at = start; at < end; at += 1) sum += joined[at]
    const sample = Math.max(-1, Math.min(1, sum / Math.max(1, end - start)))
    view.setInt16(44 + index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
  }
  return new Blob([buffer], { type: "audio/wav" })
}

export class VoiceChat {
  private options: VoiceOptions
  private state: VoiceState = { phase: "off", ear: null, level: 0, caption: "", saying: "", latency: null, note: "", error: "" }
  private recognition: Recognition | null = null
  private stream: MediaStream | null = null
  private audio: AudioContext | null = null
  private ear: VoiceEar = "browser"
  private sampleRate = 48000
  private shownLevel = 0
  private vad = { active: false, floor: 0.008, loud: 0, quiet: 0, secs: 0, lead: [] as Float32Array[], chunks: [] as Float32Array[] }
  private transcribing = false
  private finalText = ""
  private interimText = ""
  private turnTimer = 0
  private holdTimer = 0
  private queue: string[] = []
  private lastAnswer = ""
  private turnEndedAt = 0
  private answerAt = 0
  private soundStarted = false
  private waitingTold = false
  private pendingTurn = ""
  private pausedPieces: string[] = []
  private alive = false
  private busy = false
  private skipAnswer = false
  /** What was left of an answer when the person spoke over it, kept in case they only said “wait”. */
  private cutPieces: string[] = []
  private networkMisses = 0
  private gotSpeech = false
  private readyTimer = 0

  constructor(options: VoiceOptions) {
    this.options = options
  }

  /** The browser can speak and reach a microphone; hearing comes from its recognizer or a server. */
  static supported() {
    return "speechSynthesis" in window && Boolean(navigator.mediaDevices?.getUserMedia)
  }

  /** Which ear a session would use, or the sentence that says why none can. */
  static pickEar(mode: VoiceOptions["earMode"], server: VoiceServer): VoiceEar | { error: string } {
    const hasServer = Boolean(server.url.trim())
    const browserWorks = recognitionSupported() && !isBrave()
    if (mode === "server") return hasServer ? "server" : { error: "Add the speech-to-text server address in Settings, Voice." }
    if (mode === "browser") return browserWorks ? "browser" : { error: isBrave() ? BRAVE_NOTE : "This browser has no speech recognition. Open the desk in Edge or Chrome." }
    if (browserWorks) return "browser"
    if (hasServer) return "server"
    return { error: isBrave() ? BRAVE_NOTE : "This browser has no speech recognition. Open the desk in Edge or Chrome, or add a speech-to-text server in Settings, Voice." }
  }

  update(options: Partial<Omit<VoiceOptions, "onTurn" | "onCommand" | "onState">>) {
    this.options = { ...this.options, ...options }
  }

  setHandlers(handlers: Pick<VoiceOptions, "onTurn" | "onCommand" | "onState">) {
    this.options = { ...this.options, ...handlers }
  }

  get phase() {
    return this.state.phase
  }

  snapshot() {
    return this.state
  }

  private set(patch: Partial<VoiceState>) {
    this.state = { ...this.state, ...patch }
    this.options.onState(this.state)
  }

  async start() {
    if (this.alive) return
    const ear = VoiceChat.supported() ? VoiceChat.pickEar(this.options.earMode, this.options.server) : { error: "This browser cannot speak or reach a microphone." }
    if (typeof ear !== "string") {
      this.set({ phase: "error", ear: null, error: ear.error, note: "" })
      return
    }
    if (
      ear === "server" &&
      modelHostLeavesDevice(this.options.server.url) &&
      !window.confirm(
        "Send microphone audio to your speech-to-text server?\n\nThis leaves the device. Cancel to keep listening on this machine only.",
      )
    ) {
      this.set({ phase: "error", ear: null, error: "Speech server left off — listening stays on this device.", note: "" })
      return
    }
    this.ear = ear
    this.alive = true
    this.set({ phase: "starting", ear, error: "", note: "Asking for the microphone…", caption: "", saying: "" })
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
    } catch (error) {
      this.alive = false
      const name = error instanceof DOMException ? error.name : ""
      this.set({ phase: "error", error: micError(name === "NotFoundError" ? "audio-capture" : "not-allowed"), note: "" })
      return
    }
    if (!this.alive) return
    this.startAudio(this.stream)
    this.networkMisses = 0
    this.gotSpeech = false
    if (ear === "browser") this.startRecognition()
    this.set({
      phase: "listening",
      note: ear === "server" ? "Listening through the speech server. Speak when you are ready." : "Microphone is on. Connecting speech recognition…",
    })
    window.clearTimeout(this.readyTimer)
    this.readyTimer = window.setTimeout(() => {
      if (!this.alive || this.state.phase !== "listening" || this.state.error) return
      this.set({ note: ear === "server" ? "Listening through the speech server. Speak when you are ready." : "Live. The microphone is on — speak when you are ready." })
    }, 900)
  }

  /** The browser's recognizer stopped answering: carry on through the server when there is one. */
  private switchToServer() {
    if (
      modelHostLeavesDevice(this.options.server.url) &&
      !window.confirm(
        "The browser speech recognizer stopped. Send microphone audio to your speech-to-text server?\n\nThis leaves the device. Cancel to end voice chat.",
      )
    ) {
      this.stop()
      this.set({
        phase: "error",
        ear: null,
        error: "Speech server left off after the browser recognizer stopped. Start again, or use a local STT host.",
        note: "",
      })
      return
    }
    const recognition = this.recognition
    this.recognition = null
    try {
      recognition?.abort?.()
    } catch {
      /* already stopped */
    }
    this.ear = "server"
    this.set({ ear: "server", phase: "listening", note: "The browser's recognizer did not answer, so the speech server is listening now." })
  }

  stop() {
    this.alive = false
    this.busy = false
    this.pendingTurn = ""
    window.clearTimeout(this.turnTimer)
    window.clearTimeout(this.holdTimer)
    window.clearTimeout(this.readyTimer)
    this.queue = []
    this.pausedPieces = []
    window.speechSynthesis?.cancel()
    const recognition = this.recognition
    this.recognition = null
    try {
      recognition?.abort?.()
      recognition?.stop()
    } catch {
      /* already stopped */
    }
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    void this.audio?.close().catch(() => undefined)
    this.audio = null
    this.vad = { active: false, floor: 0.008, loud: 0, quiet: 0, secs: 0, lead: [], chunks: [] }
    this.transcribing = false
    this.finalText = ""
    this.interimText = ""
    this.set({ phase: "off", ear: null, level: 0, caption: "", saying: "", note: "" })
  }

  /** The person paused the session: the voice stops where it is and resumes there. */
  hold() {
    if (!this.alive || this.state.phase === "paused") return
    if (this.state.phase === "speaking") {
      this.pausedPieces = [this.state.saying, ...this.queue].filter(Boolean)
      this.queue = []
      window.speechSynthesis.cancel()
    } else if (this.cutPieces.length) this.pausedPieces = this.cutPieces
    this.cutPieces = []
    this.set({ phase: "paused", saying: "", note: "Paused. Say “continue” or press Resume." })
  }

  resume() {
    if (!this.alive || this.state.phase !== "paused") return
    if (this.pausedPieces.length) {
      const pieces = this.pausedPieces
      this.pausedPieces = []
      this.queue = pieces
      this.set({ phase: "speaking", note: "" })
      this.speakNext()
      return
    }
    this.set({ phase: "listening", note: "Listening." })
  }

  /** Stop the answer and listen. */
  interrupt() {
    if (!this.alive) return
    this.skipAnswer = this.busy
    this.pendingTurn = ""
    this.cutPieces = []
    this.queue = []
    this.pausedPieces = []
    window.speechSynthesis.cancel()
    this.set({ phase: "listening", saying: "", note: "Go ahead." })
  }

  /** The model is writing. */
  thinking() {
    if (!this.alive) return
    this.set({ phase: "thinking", note: "Writing the answer…" })
  }

  /** The answer arrived: speak it, then listen again. */
  answer(text: string) {
    if (!this.alive) return
    this.busy = false
    this.answerAt = performance.now()
    this.waitingTold = false
    this.lastAnswer = text
    if (this.skipAnswer) {
      this.skipAnswer = false
      this.set({ phase: "listening", note: "The answer is in the chat. Say “repeat that” to hear it." })
      return
    }
    if (this.pendingTurn) {
      const next = this.pendingTurn
      this.pendingTurn = ""
      this.sendTurn(next)
      return
    }
    const pieces = speechPieces(text)
    this.say(pieces.length ? pieces : [NO_ANSWER], true)
  }

  /** The model could not answer: say why in a sentence and listen again. */
  failed(message: string) {
    if (!this.alive) return
    this.busy = false
    this.pendingTurn = ""
    this.say(speechPieces(message || NO_ANSWER), false)
  }

  /** Speak a line from the desk (a verse, a confirmation). */
  sayLine(text: string) {
    if (!this.alive) return
    this.say(speechPieces(text), false)
  }

  private say(pieces: string[], timed: boolean) {
    window.speechSynthesis.cancel()
    this.queue = [...pieces]
    this.soundStarted = !timed
    if (!this.queue.length) {
      this.set({ phase: "listening", saying: "" })
      return
    }
    this.set({ phase: "speaking", note: "" })
    this.speakNext()
  }

  private speakNext() {
    if (!this.alive || this.state.phase === "paused") return
    const piece = this.queue.shift()
    if (!piece) {
      if (this.busy) this.set({ phase: "thinking", saying: "", note: "Writing the answer…" })
      else this.set({ phase: "listening", saying: "", note: "Listening." })
      return
    }
    const utterance = new SpeechSynthesisUtterance(piece)
    utterance.rate = currentVoiceRate()
    const voice = chooseVoice()
    if (voice) utterance.voice = voice
    utterance.onstart = () => {
      if (!this.soundStarted) {
        this.soundStarted = true
        const now = performance.now()
        if (this.turnEndedAt) {
          this.set({
            latency: {
              totalSecs: (now - this.turnEndedAt) / 1000,
              answerSecs: (this.answerAt - this.turnEndedAt) / 1000,
              voiceSecs: (now - this.answerAt) / 1000,
            },
          })
        }
      }
    }
    utterance.onend = () => {
      if (this.state.phase === "speaking" && this.state.saying === piece) this.speakNext()
    }
    utterance.onerror = () => {
      if (this.state.phase === "speaking" && this.state.saying === piece) this.speakNext()
    }
    this.set({ saying: piece })
    window.speechSynthesis.speak(utterance)
  }

  /** One audio tap feeds the level meter and, for the server ear, the speech detector. It runs on the audio thread, so a background tab keeps hearing. */
  private startAudio(stream: MediaStream) {
    try {
      const audio = new AudioContext()
      this.audio = audio
      this.sampleRate = audio.sampleRate
      void audio.resume().catch(() => undefined)
      const source = audio.createMediaStreamSource(stream)
      const tap = audio.createScriptProcessor(2048, 1, 1)
      const silent = audio.createGain()
      silent.gain.value = 0
      source.connect(tap)
      tap.connect(silent)
      silent.connect(audio.destination)
      tap.onaudioprocess = (event) => this.onAudio(new Float32Array(event.inputBuffer.getChannelData(0)))
    } catch {
      if (this.ear === "server") {
        this.stop()
        this.set({ phase: "error", error: "This browser could not open the microphone audio for the speech server." })
      }
    }
  }

  private onAudio(frame: Float32Array) {
    if (!this.alive) return
    let sum = 0
    for (const value of frame) sum += value * value
    const rms = Math.sqrt(sum / frame.length)
    const next = this.shownLevel * 0.6 + Math.min(1, rms * 9) * 0.4
    if (Math.abs(next - this.shownLevel) > 0.03) {
      this.shownLevel = next
      this.set({ level: next })
    }
    if (this.ear === "server") this.detect(frame, rms)
  }

  /** Energy speech detector: an adaptive noise floor, a short onset, a lead-in so first words survive, and the quiet pause as the end of the turn. */
  private detect(frame: Float32Array, rms: number) {
    const vad = this.vad
    const secs = frame.length / this.sampleRate
    const voiceOn = this.state.phase === "speaking"
    if (!vad.active) {
      vad.floor = vad.floor * 0.97 + Math.min(rms, 0.05) * 0.03
      vad.lead.push(frame)
      while (vad.lead.length * secs > VAD_LEAD_SECS) vad.lead.shift()
      const threshold = Math.max(vad.floor * (voiceOn ? 4 : 2.6), voiceOn ? 0.035 : 0.012)
      vad.loud = rms > threshold ? vad.loud + secs : 0
      if (vad.loud < VAD_ONSET_SECS || this.transcribing) return
      vad.active = true
      vad.chunks = [...vad.lead]
      vad.secs = vad.chunks.length * secs
      vad.quiet = 0
      this.speechBegan()
      return
    }
    vad.chunks.push(frame)
    vad.secs += secs
    vad.quiet = rms < Math.max(vad.floor * 2, 0.01) ? vad.quiet + secs : 0
    if (vad.quiet < this.options.pauseSecs && vad.secs < VAD_MAX_SECS) return
    vad.active = false
    vad.loud = 0
    const chunks = vad.chunks
    vad.chunks = []
    vad.lead = []
    void this.transcribe(chunks, vad.secs - vad.quiet)
  }

  private speechBegan() {
    if (this.state.phase === "speaking") {
      if (!this.options.bargeIn) return
      this.cutPieces = [this.state.saying, ...this.queue].filter(Boolean)
      this.queue = []
      window.speechSynthesis.cancel()
      this.set({ phase: "hearing", saying: "", caption: "…", note: "" })
      return
    }
    if (this.state.phase === "paused" || this.busy) this.set({ caption: "…" })
    else this.set({ phase: "hearing", caption: "…", note: "" })
  }

  /** Spoken over the answer, but it was only noise or the voice itself: carry on from where it stopped. */
  private carryOn() {
    const rest = this.cutPieces
    this.cutPieces = []
    if (rest.length && this.state.phase === "hearing") {
      this.queue = rest
      this.set({ phase: "speaking", caption: "" })
      this.speakNext()
      return
    }
    this.set({ caption: "", ...(this.state.phase === "hearing" ? { phase: this.busy ? "thinking" : "listening" } : {}) })
  }

  private async transcribe(chunks: Float32Array[], speechSecs: number) {
    if (speechSecs < 0.25) {
      this.carryOn()
      return
    }
    const { url, model, key } = this.options.server
    this.transcribing = true
    this.set({ note: "Writing down what you said…" })
    try {
      const form = new FormData()
      form.append("file", wavFrom(chunks, this.sampleRate), "speech.wav")
      form.append("model", model.trim() || "whisper-1")
      form.append("language", "en")
      form.append("response_format", "json")
      const headers: Record<string, string> = {}
      if (key.trim()) headers.Authorization = `Bearer ${key.trim()}`
      const response = await fetch(`${url.trim().replace(/\/$/, "")}/audio/transcriptions`, { method: "POST", headers, body: form, signal: AbortSignal.timeout(30000) })
      if (!response.ok) throw new Error(`it answered ${response.status}`)
      const data = (await response.json()) as { text?: string }
      if (!this.alive) return
      const text = (data.text ?? "").replace(/\[[^\]]*\]|\([^)]*\)/g, " ").replace(/\s+/g, " ").trim()
      const spoken = normalizeSpeech(text)
      if (!spoken || PHANTOM.has(spoken) || (this.cutPieces.length && echoOf(text, this.cutPieces.join(" ")))) {
        this.carryOn()
        return
      }
      this.cutPieces = this.cutPieces.length && (HOLD_WORDS.has(spoken) || STOP_WORDS.has(spoken)) ? this.cutPieces : []
      this.finalText = text
      this.interimText = ""
      this.set({ caption: text, note: "" })
      this.endTurn()
    } catch (error) {
      if (!this.alive) return
      const reason = error instanceof Error && error.name === "TimeoutError" ? "it took longer than 30 seconds" : error instanceof Error && error.message.startsWith("it answered") ? error.message : "it could not be reached (is it running, and does it allow this page?)"
      this.stop()
      this.set({ phase: "error", error: `The speech server at ${url.trim()} did not write down your words: ${reason}. Check the address in Settings, Voice.` })
    } finally {
      this.transcribing = false
    }
  }

  private startRecognition() {
    const recognition = newRecognition()
    if (!recognition) return
    this.recognition = recognition
    recognition.lang = "en-US"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => this.heard(event)
    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return
      if (event.error === "network") {
        if (this.gotSpeech) return
        this.networkMisses += 1
        if (this.options.earMode === "auto" && this.options.server.url.trim() && this.networkMisses >= 2) {
          this.switchToServer()
          return
        }
        if (this.networkMisses < 4) {
          this.set({ note: "Speech recognition is connecting… try speaking after the Live tag stays on." })
          window.setTimeout(() => {
            if (!this.alive || this.recognition !== recognition) return
            try {
              recognition.stop()
            } catch {
              this.startRecognition()
            }
          }, 350 * this.networkMisses)
          return
        }
      }
      if ((event.error === "network" || event.error === "service-not-allowed") && this.options.earMode === "auto" && this.options.server.url.trim()) {
        this.switchToServer()
        return
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed" || event.error === "audio-capture" || event.error === "network") {
        const message = micError(event.error)
        this.stop()
        this.set({ phase: "error", error: message })
      }
    }
    recognition.onend = () => {
      if (!this.alive || this.recognition !== recognition) return
      window.setTimeout(() => {
        if (!this.alive || this.recognition !== recognition) return
        try {
          recognition.start()
        } catch {
          this.startRecognition()
        }
      }, 150)
    }
    try {
      recognition.start()
    } catch {
      /* a start while one is running; onend restarts */
    }
  }

  private heard(event: RecognitionEvent) {
    if (!this.alive) return
    let interim = ""
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index]
      const text = result[0]?.transcript ?? ""
      if (result.isFinal) this.finalText = `${this.finalText} ${text}`.trim()
      else interim += text
    }
    this.interimText = interim.trim()
    const words = `${this.finalText} ${this.interimText}`.trim()
    if (!words) return
    this.gotSpeech = true
    this.networkMisses = 0

    if (this.state.phase === "speaking") {
      if (echoOf(words, `${this.state.saying} ${this.queue[0] ?? ""}`)) {
        this.finalText = ""
        this.interimText = ""
        return
      }
      const normalized = normalizeSpeech(words)
      if (STOP_WORDS.has(normalized) || HOLD_WORDS.has(normalized) || this.options.bargeIn) {
        this.cutPieces = [this.state.saying, ...this.queue].filter(Boolean)
        this.queue = []
        window.speechSynthesis.cancel()
        this.set({ phase: "hearing", saying: "", note: "" })
      } else return
    }

    if (this.state.phase === "paused" || this.busy) this.set({ caption: words })
    else this.set({ phase: "hearing", caption: words })

    window.clearTimeout(this.turnTimer)
    this.turnTimer = window.setTimeout(() => this.endTurn(), Math.round(this.options.pauseSecs * 1000))
  }

  private endTurn() {
    const text = `${this.finalText} ${this.interimText}`.trim()
    this.finalText = ""
    this.interimText = ""
    if (!text || !this.alive) return
    const words = normalizeSpeech(text)

    if (this.state.phase === "paused") {
      this.set({ caption: "" })
      if (RESUME_WORDS.has(words)) this.resume()
      else if (END_WORDS.has(words)) this.stop()
      return
    }

    if (HOLD_WORDS.has(words)) {
      window.clearTimeout(this.holdTimer)
      this.holdTimer = window.setTimeout(() => {
        this.set({ caption: "" })
        this.hold()
      }, HOLD_GRACE_MS)
      return
    }
    if (STOP_WORDS.has(words)) {
      this.set({ caption: "" })
      this.interrupt()
      return
    }
    if (END_WORDS.has(words)) {
      this.stop()
      return
    }
    if (REPEAT_WORDS.has(words) && this.lastAnswer) {
      this.set({ caption: "" })
      this.say(speechPieces(this.lastAnswer), false)
      return
    }
    if (SLOWER_WORDS.has(words) || FASTER_WORDS.has(words)) {
      this.set({ caption: "" })
      const reply = this.options.onCommand({ kind: "rate", step: SLOWER_WORDS.has(words) ? -0.1 : 0.1 })
      if (reply) this.sayLine(reply)
      return
    }
    if (this.options.commands) {
      const command = deskCommand(text)
      if (command) {
        this.set({ caption: "" })
        const reply = this.options.onCommand(command)
        if (reply) this.sayLine(reply)
        else this.set({ phase: "listening", note: "Done." })
        return
      }
    }
    this.sendTurn(text)
  }

  private sendTurn(text: string) {
    if (this.busy) {
      this.pendingTurn = `${this.pendingTurn} ${text}`.trim()
      this.set({ caption: "" })
      if (!this.waitingTold) {
        this.waitingTold = true
        this.sayLine(STILL_WRITING)
      }
      return
    }
    this.busy = true
    this.skipAnswer = false
    this.cutPieces = []
    this.turnEndedAt = performance.now()
    this.set({ phase: "thinking", caption: "", saying: "", note: `“${text}”` })
    this.options.onTurn(text)
  }
}

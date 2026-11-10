/** Soft desk UI tones via Web Audio — no asset files. Honors Settings → Desk sounds. */

export type UiTone = "tap" | "open" | "ok" | "send" | "mark"

type ToneSpec = { freq: number; freq2?: number; dur: number; gain: number; type?: OscillatorType }

const tones: Record<UiTone, ToneSpec> = {
  tap: { freq: 620, dur: 0.045, gain: 0.035, type: "triangle" },
  open: { freq: 440, freq2: 660, dur: 0.09, gain: 0.04, type: "sine" },
  ok: { freq: 520, freq2: 780, dur: 0.11, gain: 0.045, type: "sine" },
  send: { freq: 380, freq2: 560, dur: 0.08, gain: 0.038, type: "triangle" },
  mark: { freq: 700, dur: 0.06, gain: 0.032, type: "sine" },
}

let ctx: AudioContext | null = null
let enabled = true

export function setUiSoundEnabled(on: boolean) {
  enabled = on
}

function context() {
  if (typeof window === "undefined") return null
  const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  return ctx
}

function beep(spec: ToneSpec) {
  const audio = context()
  if (!audio || !enabled) return
  if (audio.state === "suspended") void audio.resume()
  const now = audio.currentTime
  const master = audio.createGain()
  master.gain.setValueAtTime(0.0001, now)
  master.gain.exponentialRampToValueAtTime(spec.gain, now + 0.012)
  master.gain.exponentialRampToValueAtTime(0.0001, now + spec.dur)
  master.connect(audio.destination)

  const play = (freq: number, delay = 0) => {
    const osc = audio.createOscillator()
    osc.type = spec.type ?? "sine"
    osc.frequency.setValueAtTime(freq, now + delay)
    osc.connect(master)
    osc.start(now + delay)
    osc.stop(now + delay + spec.dur + 0.02)
  }

  play(spec.freq)
  if (spec.freq2) play(spec.freq2, 0.03)
}

export function playUi(tone: UiTone = "tap") {
  if (!enabled) return
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // Still allow a softer tap when motion is reduced — sounds are not motion.
  }
  try {
    beep(tones[tone])
  } catch {
    /* autoplay / audio policy */
  }
}

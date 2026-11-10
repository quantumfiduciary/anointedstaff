import { useEffect, useMemo, useState } from "react"
import { Pause, Volume2 } from "lucide-react"
import { PracticeBedToggle } from "./PracticeBedToggle"
import {
  canSpeak,
  listVoices,
  setPreferredVoice,
  setVoiceRate,
  speakChunks,
  stopSpeaking,
  voiceOptionLabel,
  watchSpeaking,
} from "../voice"
import { Pop, Tip } from "./ui/tip"

type ChapterListenProps = {
  chapterLabel: string
  verses: string[]
  voiceName: string
  voiceRate: number
  onVoice: (patch: { voiceName?: string; voiceRate?: number }) => void
}

export function ChapterListen({ chapterLabel, verses, voiceName, voiceRate, onVoice }: ChapterListenProps) {
  const [speaking, setSpeaking] = useState(false)
  const [voices, setVoices] = useState(() => (canSpeak() ? listVoices() : []))
  const supported = canSpeak()

  useEffect(() => watchSpeaking(setSpeaking), [])
  useEffect(() => {
    if (!supported) return
    const refresh = () => setVoices(listVoices())
    refresh()
    window.speechSynthesis.addEventListener("voiceschanged", refresh)
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh)
  }, [supported])

  const script = useMemo(() => {
    if (!verses.length) return ""
    const body = verses.map((line, index) => `${index + 1}. ${line}`).join(" ")
    return `${chapterLabel}. ${body}`
  }, [chapterLabel, verses])

  function toggle() {
    if (!supported || !script) return
    if (speaking) {
      stopSpeaking()
      return
    }
    speakChunks(script)
  }

  if (!supported) {
    return (
      <Tip content="This browser has no speech voices. Open Settings → Voice on Chrome or Edge.">
        <button type="button" disabled aria-label="Listen unavailable">
          Listen
        </button>
      </Tip>
    )
  }

  return (
    <div className="listen-pair">
      <Tip content={speaking ? "Stop reading this chapter" : "Read this chapter aloud"}>
        <button type="button" aria-pressed={speaking} aria-label={speaking ? "Stop listening" : "Listen to chapter"} onClick={toggle} disabled={!script}>
          {speaking ? <Pause size={14} aria-hidden /> : <Volume2 size={14} aria-hidden />}
          {speaking ? "Stop" : "Listen"}
        </button>
      </Tip>
      <PracticeBedToggle kind="read" tipOn="Mute quiet music · soft instrumental under reading · local only" tipOff="Soft instrumental under reading · local only" />
      <Pop
        align="end"
        className="listen-pop"
        trigger={
          <button type="button" className="listen-gear" aria-label="Listening voice and speed" title="Voice and speed">
            Voice
          </button>
        }
      >
        <b>Listening</b>
        <label className="setting-field">
          Voice
          <select
            aria-label="Reading voice"
            value={voiceName}
            onChange={(event) => {
              const name = event.target.value
              setPreferredVoice(name)
              onVoice({ voiceName: name })
            }}
          >
            <option value="">Natural English, when available</option>
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.name}>
                {voiceOptionLabel(voice)}
              </option>
            ))}
          </select>
        </label>
        <label className="setting-field">
          Speed · {voiceRate.toFixed(2)}×
          <input
            type="range"
            min={0.6}
            max={1.6}
            step={0.05}
            value={voiceRate}
            aria-label="Speaking speed"
            onChange={(event) => {
              const rate = Number(event.target.value)
              setVoiceRate(rate)
              onVoice({ voiceRate: rate })
            }}
          />
        </label>
        <p className="quiet m-0">Same voice settings as Settings → Voice. Full options live there.</p>
      </Pop>
    </div>
  )
}

import { useEffect, useRef, useState } from "react"
import { Headphones, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react"
import {
  createGuideAudio,
  formatAudioClock,
  stopPracticeGuide,
} from "../study/practiceAudio"
import { stopSpeaking } from "../voice"
import { Button } from "./ui/button"
import { Tip } from "./ui/tip"

type PracticeGuideBarProps = {
  src: string | null
  title: string
  /** When guide starts, optionally start the session timer. */
  onGuidePlay?: () => void
  /** When guide ends naturally. */
  onGuideEnded?: () => void
}

export function PracticeGuideBar({ src, title, onGuidePlay, onGuideEnded }: PracticeGuideBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const onPlayRef = useRef(onGuidePlay)
  const onEndedRef = useRef(onGuideEnded)
  onPlayRef.current = onGuidePlay
  onEndedRef.current = onGuideEnded
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [ready, setReady] = useState(false)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    stopPracticeGuide()
    audioRef.current = null
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
    setReady(false)
    setError(false)
    if (!src) return

    const audio = createGuideAudio(src)
    if (!audio) return
    audioRef.current = audio

    const onMeta = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
      setReady(true)
    }
    const onTime = () => setCurrent(audio.currentTime)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => {
      setPlaying(false)
      setCurrent(0)
      onEndedRef.current?.()
    }
    const onErr = () => {
      setError(true)
      setReady(false)
      setPlaying(false)
    }

    audio.addEventListener("loadedmetadata", onMeta)
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("error", onErr)
    audio.load()

    return () => {
      audio.removeEventListener("loadedmetadata", onMeta)
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("error", onErr)
      audio.pause()
      if (audioRef.current === audio) audioRef.current = null
    }
  }, [src])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.muted = muted
  }, [muted])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio || !src) return
    if (playing) {
      audio.pause()
      return
    }
    stopSpeaking()
    void audio.play().then(() => onPlayRef.current?.()).catch(() => setError(true))
  }

  function restart() {
    const audio = audioRef.current
    if (!audio || !src) return
    audio.currentTime = 0
    setCurrent(0)
    stopSpeaking()
    void audio.play().then(() => onPlayRef.current?.()).catch(() => setError(true))
  }

  function seek(value: number) {
    const audio = audioRef.current
    if (!audio || !duration) return
    audio.currentTime = value
    setCurrent(value)
  }

  if (!src) {
    return (
      <div className="practice-guide" data-empty="true">
        <Headphones size={16} aria-hidden="true" />
        <p className="quiet">No spoken guide for this session yet — use the timer and steps below.</p>
      </div>
    )
  }

  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0

  return (
    <div className="practice-guide" role="region" aria-label={`Spoken guide: ${title}`}>
      <div className="practice-guide-head">
        <Headphones size={16} aria-hidden="true" />
        <div>
          <strong>Spoken guide</strong>
          <small>River · offline · start guide to hear the steps</small>
        </div>
      </div>
      {error ? <p className="parse-bad">Guide could not load. Check the Practice audio files, or use the timer only.</p> : null}
      <div className="practice-guide-controls">
        <Tip content={playing ? "Pause guide" : "Play spoken guide"}>
          <Button type="button" size="sm" onClick={togglePlay} disabled={error && !ready} aria-label={playing ? "Pause guide" : "Play guide"}>
            {playing ? <Pause size={14} /> : <Play size={14} />}
            {playing ? "Pause guide" : "Play guide"}
          </Button>
        </Tip>
        <Tip content="Restart guide from the beginning">
          <Button type="button" size="sm" variant="outline" onClick={restart} disabled={error && !ready} aria-label="Restart guide">
            <RotateCcw size={14} /> Restart
          </Button>
        </Tip>
        <Tip content={muted ? "Unmute guide" : "Mute guide"}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={muted}
            aria-label={muted ? "Unmute guide" : "Mute guide"}
            onClick={() => setMuted((on) => !on)}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {muted ? "Unmute" : "Mute"}
          </Button>
        </Tip>
        <span className="practice-guide-clock" aria-live="polite">
          {formatAudioClock(current)} / {formatAudioClock(duration)}
        </span>
      </div>
      <label className="practice-guide-scrub">
        <span className="sr-only">Guide position</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          disabled={!duration}
          aria-valuetext={`${formatAudioClock(current)} of ${formatAudioClock(duration)}`}
          onChange={(event) => seek(Number(event.target.value))}
        />
        <i style={{ width: `${progress}%` }} aria-hidden="true" />
      </label>
    </div>
  )
}

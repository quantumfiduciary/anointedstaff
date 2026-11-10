import { useEffect, useState } from "react"
import { Music2 } from "lucide-react"
import {
  ensurePracticeManifest,
  playPracticeBed,
  practiceBedAvailable,
  practiceBedSrc,
  readPracticeBedOn,
  stopPracticeBedIfKind,
  type PracticeBedKind,
  writePracticeBedOn,
} from "../study/practiceAudio"
import { Tip } from "./ui/tip"

type PracticeBedToggleProps = {
  kind: PracticeBedKind
  /** When false, stop this bed without clearing the preference. */
  active?: boolean
  className?: string
  tipOn?: string
  tipOff?: string
}

/** Shared Quiet music on/off for Meditate / Scripture / Extra-canon. Preference is one desk-wide flag. */
export function PracticeBedToggle({
  kind,
  active = true,
  className = "practice-voice-toggle",
  tipOn,
  tipOff,
}: PracticeBedToggleProps) {
  const [bedOn, setBedOn] = useState(() => readPracticeBedOn())
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    void ensurePracticeManifest().then(() => setAvailable(practiceBedAvailable(kind) || Boolean(practiceBedSrc[kind])))
  }, [kind])

  useEffect(() => {
    if (active && bedOn && available) playPracticeBed(kind, true)
    else if (!active) stopPracticeBedIfKind(kind)
  }, [active, bedOn, available, kind])

  if (!available) return null

  const onTip =
    tipOn ??
    (kind === "read" ? "Mute quiet music · soft instrumental under reading · local only" : "Mute quiet music under Meditate · local only")
  const offTip =
    tipOff ??
    (kind === "read" ? "Soft instrumental under reading · local only" : "Soft instrumental under Meditate · local only")

  return (
    <Tip content={bedOn ? onTip : offTip}>
      <button
        type="button"
        className={className}
        aria-pressed={bedOn}
        aria-label={bedOn ? "Quiet music on" : "Quiet music off"}
        onClick={() => {
          const next = !bedOn
          writePracticeBedOn(next)
          setBedOn(next)
          if (active && next) playPracticeBed(kind, true)
          else stopPracticeBedIfKind(kind)
        }}
      >
        <Music2 size={14} />
        <span>{bedOn ? "Quiet music on" : "Quiet music off"}</span>
      </button>
    </Tip>
  )
}

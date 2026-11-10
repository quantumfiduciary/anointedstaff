import { motion } from "motion/react"
import { HelpCircle, Maximize2, Mic, MicOff, Pause, Play, Settings2, Square, X } from "lucide-react"
import { Button } from "./ui/button"
import { Menu, MenuCheck, MenuItem, MenuLabel, MenuSeparator } from "./ui/menu"
import { Pop, Tip } from "./ui/tip"
import type { VoiceState } from "../voiceChat"

export type VoicePanelOptions = { pauseSecs: number; bargeIn: boolean; commands: boolean; rate: number }

const phaseLabel: Record<VoiceState["phase"], string> = {
  off: "Voice chat is off",
  starting: "Starting",
  listening: "Listening",
  hearing: "Hearing you",
  thinking: "Writing the answer",
  speaking: "Speaking",
  paused: "Paused",
  error: "Voice chat stopped",
}

const sayings: { group: string; items: string[] }[] = [
  { group: "Talk with the voice", items: ["stop · cancel · quiet", "wait · hold on · pause", "continue · go on", "repeat that", "slower · faster", "goodbye · end voice chat"] },
  { group: "Move in the Bible", items: ["next verse · previous verse", "next chapter · previous chapter", "open John 3 16", "read this verse · read the chapter", "save this verse", "study this"] },
  { group: "Study windows", items: ["open Strong's", "look up H7225", "open Extra-canon", "extra-canon watchers", "study notes"] },
]

const speeds = [0.8, 0.95, 1.1, 1.25]
const pauses = [0.6, 0.9, 1.3, 1.8]

type VoicePanelProps = {
  state: VoiceState
  options: VoicePanelOptions
  onOptions: (patch: Partial<{ voicePause: number; voiceBargeIn: boolean; voiceCommands: boolean; voiceRate: number }>) => void
  onPause: () => void
  onResume: () => void
  onInterrupt: () => void
  onEnd: () => void
  onRetry: () => void
  onOpenWindow?: () => void
}

/** Windows opens this address in Edge, whose speech recognition works where Brave's does not. */
export function edgeLink() {
  return `microsoft-edge:${window.location.href}`
}

export function VoicePanel({ state, options, onOptions, onPause, onResume, onInterrupt, onEnd, onRetry, onOpenWindow }: VoicePanelProps) {
  const { phase } = state
  const live = phase !== "off" && phase !== "error"
  const ring = phase === "hearing" || phase === "listening" ? 1 + state.level * 0.55 : 1
  return (
    <motion.section
      className="voice-panel"
      data-phase={phase}
      aria-label="Voice chat"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
    >
      <div className="voice-orb" aria-hidden="true">
        <motion.span className="voice-ring" animate={{ scale: ring }} transition={{ duration: 0.08 }} />
        <span className="voice-core">{phase === "error" ? <MicOff size={16} /> : phase === "paused" ? <Pause size={16} /> : <Mic size={16} />}</span>
      </div>
      <div className="voice-main">
        <div className="voice-status" role="status" aria-live="polite">
          <b>{phaseLabel[phase]}</b>
          {state.latency && live ? (
            <Tip content={`Answer ${state.latency.answerSecs.toFixed(1)} s · voice ${state.latency.voiceSecs.toFixed(1)} s`}>
              <span className="voice-latency">{state.latency.totalSecs.toFixed(1)} s to first word</span>
            </Tip>
          ) : null}
        </div>
        <p
          key={state.error ? "error" : state.caption ? "you" : state.saying || state.note}
          className="voice-line"
          data-kind={state.error ? "error" : state.caption ? "you" : state.saying ? "agent" : "note"}
        >
          {state.error || state.caption || state.saying || state.note || "Speak when you are ready."}
        </p>
      </div>
      <div className="voice-controls">
        {phase === "error" && /Edge/.test(state.error) ? (
          <Button asChild size="sm" variant="outline">
            <a href={edgeLink()}>Open in Edge</a>
          </Button>
        ) : null}
        {phase === "error" ? (
          <Button type="button" size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        {onOpenWindow ? (
          <Tip content="Open the Voice window" keys="V">
            <Button type="button" size="sm" variant="outline" onClick={onOpenWindow} aria-label="Open the Voice window">
              <Maximize2 size={13} />
            </Button>
          </Tip>
        ) : null}
        {phase === "speaking" || phase === "thinking" ? (
          <Tip content="Stop the answer and listen" keys="say “stop”">
            <Button type="button" size="sm" variant="outline" onClick={onInterrupt} aria-label="Interrupt">
              <Square size={13} />
            </Button>
          </Tip>
        ) : null}
        {live ? (
          phase === "paused" ? (
            <Tip content="Resume" keys="say “continue”">
              <Button type="button" size="sm" variant="outline" onClick={onResume} aria-label="Resume">
                <Play size={13} />
              </Button>
            </Tip>
          ) : (
            <Tip content="Pause" keys="say “wait”">
              <Button type="button" size="sm" variant="outline" onClick={onPause} aria-label="Pause">
                <Pause size={13} />
              </Button>
            </Tip>
          )
        ) : null}
        <Menu label={<Settings2 size={14} />} caret={false} ariaLabel="Voice chat settings" align="end" className="soft-menu">
          <MenuLabel>Speaking speed</MenuLabel>
          {speeds.map((rate) => (
            <MenuCheck key={rate} checked={Math.abs(options.rate - rate) < 0.03} onSelect={() => onOptions({ voiceRate: rate })}>
              {rate < 0.9 ? "Slow" : rate < 1 ? "Steady" : rate < 1.2 ? "Brisk" : "Fast"} · {rate.toFixed(2)}×
            </MenuCheck>
          ))}
          <MenuSeparator />
          <MenuLabel>Send my words after</MenuLabel>
          {pauses.map((secs) => (
            <MenuCheck key={secs} checked={Math.abs(options.pauseSecs - secs) < 0.05} onSelect={() => onOptions({ voicePause: secs })}>
              {secs.toFixed(1)} s of quiet
            </MenuCheck>
          ))}
          <MenuSeparator />
          <MenuCheck checked={options.bargeIn} onSelect={() => onOptions({ voiceBargeIn: !options.bargeIn })}>
            Speaking over the answer stops it
          </MenuCheck>
          <MenuCheck checked={options.commands} onSelect={() => onOptions({ voiceCommands: !options.commands })}>
            Spoken Bible commands
          </MenuCheck>
          <MenuSeparator />
          <MenuItem icon={<X size={14} />} onSelect={onEnd}>
            End voice chat
          </MenuItem>
        </Menu>
        <Pop
          side="bottom"
          align="end"
          className="voice-help"
          trigger={
            <Button type="button" size="sm" variant="outline" aria-label="Things you can say">
              <HelpCircle size={14} />
            </Button>
          }
        >
          {sayings.map((group) => (
            <div key={group.group}>
              <b>{group.group}</b>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>“{item}”</li>
                ))}
              </ul>
            </div>
          ))}
          <p>Say a command on its own. Anything else goes to the chat as a question.</p>
        </Pop>
        <Tip content="End voice chat" keys="say “goodbye”">
          <Button type="button" size="sm" onClick={onEnd} aria-label="End voice chat">
            End
          </Button>
        </Tip>
      </div>
    </motion.section>
  )
}

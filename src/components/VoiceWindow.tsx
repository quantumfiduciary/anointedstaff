import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { AudioLines, Copy, Eraser, Mic, MicOff, Pause, Play, Server, Settings2, Square } from "lucide-react"
import { Button } from "./ui/button"
import { Menu, MenuCheck, MenuLabel, MenuSeparator } from "./ui/menu"
import { Tip } from "./ui/tip"
import { edgeLink, type VoicePanelOptions } from "./VoicePanel"
import { VoiceChat, isBrave, type VoiceServer } from "../voiceChat"
import { clearVoiceLog, useVoice, voice, voiceLive } from "../voiceSession"

const phaseTitle = {
  off: "Voice chat is off",
  starting: "Starting",
  listening: "Listening",
  hearing: "Hearing you",
  thinking: "Writing the answer",
  speaking: "Speaking",
  paused: "Paused",
  error: "Voice chat stopped",
} as const

const phaseHint = {
  off: "Press Start and speak. The answer is read aloud, and you can talk over it.",
  starting: "Allow the microphone when the browser asks.",
  listening: "Speak when you are ready. A short pause sends your words.",
  hearing: "Keep going. A short pause sends it.",
  thinking: "The study agent is writing. Say “stop” to drop it.",
  speaking: "Talk over the voice to cut in, or say “wait”.",
  paused: "Say “continue” or press Resume.",
  error: "",
} as const

const sayings = [
  { group: "The voice", items: ["stop", "wait, hold on", "continue", "repeat that", "slower, faster", "goodbye"] },
  { group: "The Bible", items: ["next verse", "previous chapter", "open John 3 16", "read this verse", "read the chapter", "save this verse", "study this"] },
  { group: "Study windows", items: ["open Strong's", "look up H7225", "open Extra-canon", "extra-canon watchers", "study notes"] },
]

const speeds = [0.8, 0.95, 1.1, 1.25]
const pauses = [0.6, 0.9, 1.3, 1.8]

type VoiceWindowProps = {
  enabled: boolean
  options: VoicePanelOptions
  earMode: "auto" | "browser" | "server"
  server: VoiceServer
  readingWhere: string
  onOptions: (patch: Partial<{ voicePause: number; voiceBargeIn: boolean; voiceCommands: boolean; voiceRate: number }>) => void
  onOpenSettings: () => void
  onCopy: (text: string) => void
  onAsk: (text: string) => void
}

export function VoiceWindow({ enabled, options, earMode, server, readingWhere, onOptions, onOpenSettings, onCopy, onAsk }: VoiceWindowProps) {
  const { state, log } = useVoice()
  const [draft, setDraft] = useState("")
  const phase = state?.phase ?? "off"
  const live = voiceLive(state)
  const ear = VoiceChat.pickEar(earMode, server)
  const blocked = typeof ear === "string" ? "" : ear.error
  const list = useRef<HTMLOListElement>(null)
  const ring = phase === "hearing" || phase === "listening" ? 1 + (state?.level ?? 0) * 0.7 : 1

  useEffect(() => {
    const node = list.current
    if (node) node.scrollTop = node.scrollHeight
  }, [log.length])

  const earLabel = (state?.ear ?? (typeof ear === "string" ? ear : null)) === "server" ? `Speech server · ${server.model || "whisper-1"}` : "This browser's speech recognition"

  return (
    <div className="voice-window" data-phase={phase} data-live={live ? "true" : "false"}>
      <section className="voice-hero" aria-label="Voice chat status">
        <div className="voice-big-orb" aria-hidden="true">
          <motion.span className="voice-big-ring" animate={{ scale: ring }} transition={{ duration: 0.08 }} />
          <motion.span className="voice-big-ring outer" animate={{ scale: live ? ring * 1.15 : 1 }} transition={{ duration: 0.12 }} />
          <span className="voice-big-core">{phase === "error" ? <MicOff size={30} /> : phase === "paused" ? <Pause size={30} /> : phase === "speaking" ? <AudioLines size={30} /> : <Mic size={30} />}</span>
        </div>
        <div className="voice-hero-text" role="status" aria-live="polite">
          <span className="voice-live-tag" data-on={live ? "true" : phase === "error" ? "error" : "false"}>
            <i aria-hidden="true" />
            {live ? "Live" : phase === "error" ? "Stopped" : "Off"}
          </span>
          <h2>{phaseTitle[phase]}</h2>
          <p className="voice-hint">{state?.error || phaseHint[phase]}</p>
          <p className="voice-caption" data-kind={state?.caption ? "you" : state?.saying ? "agent" : "note"}>
            {state?.caption || state?.saying || state?.note || `Talking about ${readingWhere}.`}
          </p>
          <div className="voice-meta">
            <span>
              <Server size={12} /> {earLabel}
            </span>
            {state?.latency ? (
              <Tip content={`Answer ${state.latency.answerSecs.toFixed(1)} s, voice ${state.latency.voiceSecs.toFixed(1)} s`}>
                <span>{state.latency.totalSecs.toFixed(1)} s to first word</span>
              </Tip>
            ) : null}
          </div>
        </div>
        <div className="voice-hero-controls">
          {live ? (
            <>
              {phase === "paused" ? (
                <Button type="button" variant="outline" onClick={voice.resume}>
                  <Play /> Resume
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={voice.hold}>
                  <Pause /> Pause
                </Button>
              )}
              <Button type="button" variant="outline" onClick={voice.interrupt} disabled={phase !== "speaking" && phase !== "thinking"}>
                <Square /> Interrupt
              </Button>
              <Button type="button" onClick={voice.end}>
                End
              </Button>
            </>
          ) : (
            <Button type="button" size="lg" className="voice-start" onClick={voice.start} disabled={!enabled || Boolean(blocked)}>
              <Mic /> {phase === "error" ? "Try again" : "Start voice chat"}
            </Button>
          )}
          <Menu label={<Settings2 size={16} />} caret={false} ariaLabel="Voice chat settings" align="end" className="icon-btn">
            <MenuLabel>Speaking speed</MenuLabel>
            {speeds.map((rate) => (
              <MenuCheck key={rate} checked={Math.abs(options.rate - rate) < 0.03} onSelect={() => onOptions({ voiceRate: rate })}>
                {rate.toFixed(2)}×
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
          </Menu>
        </div>
      </section>

      {!enabled ? (
        <div className="voice-setup">
          <b>Voice is turned off</b>
          <p>Turn on the Voice plugin in Settings to talk with the desk.</p>
          <Button type="button" size="sm" variant="outline" onClick={onOpenSettings}>
            Open Settings
          </Button>
        </div>
      ) : blocked || (phase === "error" && /Edge|server/.test(state?.error ?? "")) ? (
        <div className="voice-setup">
          <b>{isBrave() ? "Brave cannot hear you" : "This browser cannot hear you yet"}</b>
          <p>{blocked || state?.error}</p>
          <p>
            Two ways in: open the desk in Edge, which hears through Microsoft's speech service, or point Settings, Voice at a speech-to-text server. Any server with an OpenAI-style audio transcriptions address works, local or in the cloud.
          </p>
          <div className="voice-setup-actions">
            <Button asChild size="sm">
              <a href={edgeLink()}>Open in Edge</a>
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onOpenSettings}>
              Set up a speech server
            </Button>
          </div>
        </div>
      ) : null}

      <div className="voice-body">
        <section className="voice-convo" aria-label="Voice conversation">
          <header>
            <b>Conversation</b>
            <Button type="button" size="sm" variant="ghost" onClick={clearVoiceLog} disabled={!log.length} aria-label="Clear the voice conversation">
              <Eraser size={14} />
            </Button>
          </header>
          {log.length ? (
            <ol ref={list}>
              {log.map((entry) => (
                <li key={entry.id} data-role={entry.role}>
                  <small>
                    {entry.role === "you" ? "You" : entry.role === "agent" ? "Study agent" : "Desk"} · {new Date(entry.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </small>
                  <p>{entry.text}</p>
                  {entry.role !== "you" ? (
                    <button type="button" className="link-btn" onClick={() => onCopy(entry.text)}>
                      <Copy size={12} /> Copy
                    </button>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <div className="brand-empty-block voice-empty">
              <img className="brand-empty" src="/brand/empty-voice.png" alt="" width={140} height={140} />
              <p>What you say and what the desk answers shows here. Press Start to talk, or type a question below. The same answers land in the AI chat.</p>
            </div>
          )}
          <form
            className="voice-compose"
            onSubmit={(event) => {
              event.preventDefault()
              const text = draft.trim()
              if (!text) return
              setDraft("")
              onAsk(text)
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={live ? "Type while you talk, or just speak" : "Type a question, or press Start and speak"}
              aria-label="Ask by text in the Voice window"
            />
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              Send
            </Button>
          </form>
        </section>
        <aside className="voice-sayings" aria-label="Things you can say">
          <b>Things you can say</b>
          {sayings.map((group) => (
            <div key={group.group}>
              <small>{group.group}</small>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>“{item}”</li>
                ))}
              </ul>
            </div>
          ))}
          <p>Say a command on its own. Anything else is a question for the study agent.</p>
        </aside>
      </div>
    </div>
  )
}

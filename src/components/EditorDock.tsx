import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { AudioLines, Copy, Eraser, FileDown, FileText, MessageSquare, Mic, Square, Volume2 } from "lucide-react"
import { chatSkills, deskQuickTools } from "../agent/skills"
import { ChatCitedText, followUpsFor } from "../chatCite"
import { motionDuration, motionTokens } from "../lib/motionTokens"
import { Button } from "./ui/button"
import { Menu, MenuItem, MenuSeparator } from "./ui/menu"
import { Tip } from "./ui/tip"
import { canListen, listenOnce, speak, stopSpeaking, watchSpeaking } from "../voice"
import { useVoice, voiceLive } from "../voiceSession"

export type ChatStage = "thinking" | "reading" | "writing" | "done"

export type AgentMessage = {
  role: "you" | "agent"
  text: string
  /** What the desk packed with the question (agent replies). */
  receipt?: string[]
  streaming?: boolean
  stage?: ChatStage
}

type EditorDockProps = {
  report: string
  messages: AgentMessage[]
  busy: boolean
  modelOn: boolean
  modelName: string
  onReport: (value: string) => void
  onAsk: (command: string) => void
  onDeskCommand?: (command: string) => void
  onSaveNote: (text: string) => void
  onSaveWiki?: (text: string) => void
  hasNotebook: boolean
  onShare: () => void
  spoken: string
  voice: boolean
  onOpenVoice: () => void
  modelState: string
  modelReady?: boolean
  onOpenSettings: () => void
  readingWhere: string
  readingLine: string
  paneRequest: "chat" | "report"
  onExportPdf: (kind: "report" | "chat") => void
  onClear: () => void
  onOpenRef?: (reference: string) => void
  onCancelAsk?: () => void
}

export function EditorDock({
  report,
  messages,
  busy,
  modelOn,
  modelName,
  onReport,
  onAsk,
  onDeskCommand,
  onSaveNote,
  onSaveWiki,
  hasNotebook,
  onShare,
  spoken,
  voice,
  onOpenVoice,
  modelState,
  modelReady = false,
  onOpenSettings,
  readingWhere,
  readingLine,
  paneRequest,
  onExportPdf,
  onClear,
  onOpenRef,
  onCancelAsk,
}: EditorDockProps) {
  const [draft, setDraft] = useState("")
  const [pane, setPane] = useState<"report" | "chat">(paneRequest)
  const [reading, setReading] = useState(false)
  const [hearing, setHearing] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(() => {
    if (typeof window === "undefined") return true
    return !window.matchMedia("(max-width: 960px)").matches
  })
  const askField = useRef<HTMLInputElement>(null)
  const { state: voiceState } = useVoice()
  const talking = voiceLive(voiceState)
  const lastAgent = [...messages].reverse().find((message) => message.role === "agent")
  const lastYou = [...messages].reverse().find((message) => message.role === "you")
  const followUps = useMemo(
    () => (lastAgent && !busy && !lastAgent.streaming ? followUpsFor(readingWhere, lastAgent.text) : []),
    [lastAgent, busy, readingWhere],
  )
  const stageLabel =
    lastAgent?.streaming && lastAgent.stage === "writing"
      ? "Writing"
      : lastAgent?.streaming && lastAgent.stage === "reading"
        ? "Reading the desk"
        : busy
          ? "Gathering context"
          : null

  useEffect(() => {
    setPane(paneRequest)
  }, [paneRequest])

  useEffect(() => watchSpeaking(setReading), [])

  const log = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = log.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, busy])

  function openChat() {
    setPane("chat")
    window.setTimeout(() => askField.current?.focus(), 0)
  }

  function listen() {
    if (hearing) {
      stopSpeaking()
      setHearing(false)
      return
    }
    setHearing(true)
    listenOnce(
      (text) => {
        setDraft("")
        onAsk(text)
      },
      () => setHearing(false),
    )
  }

  const canVoice = voice && canListen()
  const reduce = useReducedMotion()
  const lightState = !modelOn ? "off" : modelReady ? "ready" : modelState.toLowerCase().includes("check") ? "checking" : modelState.toLowerCase().includes("missing") ? "missing" : "stopped"
  const skillButtons = chatSkills.filter((skill) => (skill.id === "notebook" ? hasNotebook : true))

  return (
    <div className="chat" aria-label="AI" data-pane={pane}>
      <div className="chat-tools">
        <div className="pane-switch">
          <div className="segmented small" role="tablist" aria-label="AI pane">
            <button type="button" role="tab" aria-selected={pane === "chat"} aria-pressed={pane === "chat"} onClick={openChat}>
              <MessageSquare size={14} /> Chat
            </button>
            <button type="button" role="tab" aria-selected={pane === "report"} aria-pressed={pane === "report"} onClick={() => setPane("report")}>
              <FileText size={14} /> Study
            </button>
          </div>
          <p className="pane-legend">
            {pane === "chat"
              ? "Chat packs the open verse and study context, then streams a reply. Add to study keeps a finished answer on your page."
              : "Study is your written page. Chat does not fill it on its own."}
          </p>
        </div>
        <Menu label={<>{talking ? <Mic size={14} /> : <Volume2 size={14} />} Voice</>} ariaLabel="Voice" disabled={!voice} className="soft-menu" align="center">
          <MenuItem icon={<Volume2 size={14} />} disabled={!reading && !report.trim() && !spoken} onSelect={() => (reading ? stopSpeaking() : speak(report.trim() || spoken))}>
            {reading ? "Stop reading" : report.trim() ? "Read the study aloud" : "Read the verse aloud"}
          </MenuItem>
          <MenuItem icon={<Mic size={14} />} disabled={!canVoice || busy} onSelect={listen}>
            {hearing ? "Stop listening" : "Ask once by voice"}
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<AudioLines size={14} />} onSelect={onOpenVoice} hint="V">
            Open the Voice window
          </MenuItem>
        </Menu>
        {voice ? (
          <Tip content={talking ? "Voice chat is live in its own window" : "Hands-free voice chat is its own window, next to AI in the sidebar"} keys="V">
            <Button type="button" size="sm" variant={talking ? "default" : "outline"} onClick={onOpenVoice} aria-label={talking ? "Voice chat is live. Open the Voice window" : "Open the Voice window"} data-live={talking ? "true" : undefined}>
              <AudioLines size={14} /> {talking ? `Voice · ${voiceState?.phase === "speaking" ? "speaking" : voiceState?.phase === "hearing" ? "hearing you" : "live"}` : "Voice"}
            </Button>
          </Tip>
        ) : null}
        {reading && !talking ? (
          <Button type="button" size="sm" onClick={stopSpeaking}>
            Stop
          </Button>
        ) : null}
        {hearing ? <span className="listening">Listening…</span> : null}
        <Menu label={<FileDown size={14} />} caret={false} ariaLabel="Export" align="end" className="soft-menu">
          <MenuItem icon={<Copy size={14} />} disabled={!report.trim()} onSelect={onShare}>
            Copy the study
          </MenuItem>
          <MenuItem icon={<FileDown size={14} />} disabled={!report.trim()} onSelect={() => onExportPdf("report")}>
            Study as PDF
          </MenuItem>
          <MenuItem icon={<FileDown size={14} />} disabled={!messages.length} onSelect={() => onExportPdf("chat")}>
            Chat as PDF
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Eraser size={14} />} disabled={!messages.length || busy} onSelect={onClear}>
            Clear the chat
          </MenuItem>
        </Menu>
      </div>
      <textarea
        className="report"
        aria-label="Study page"
        value={report}
        placeholder="Add a reply here, or write the page yourself. Chat does not fill this on its own."
        onChange={(event) => onReport(event.target.value)}
      />
      <div className="agent" aria-label="Chat">
        <div className="chat-reading">
          <b>{readingWhere}</b>
          <span>{readingLine || "Open a chapter and the chat follows it."}</span>
        </div>
        <div className="chat-tools-wrap">
          <button
            type="button"
            className="chat-tools-toggle"
            aria-expanded={toolsOpen}
            onClick={() => setToolsOpen((open) => !open)}
          >
            Study tools
          </button>
          {toolsOpen ? (
            <div className="chat-quick" role="toolbar" aria-label="Quick study tools">
              {skillButtons.map((skill) => (
                <Tip key={skill.id} content={skill.harness ?? skill.prompt}>
                  <button type="button" disabled={busy} onClick={() => onAsk(skill.prompt)}>
                    {skill.label}
                  </button>
                </Tip>
              ))}
              {onDeskCommand
                ? deskQuickTools.map((tool) => (
                    <Tip key={tool.id} content={tool.tip}>
                      <button type="button" data-kind="desk" disabled={busy} onClick={() => onDeskCommand(tool.command)}>
                        {tool.label}
                      </button>
                    </Tip>
                  ))
                : null}
            </div>
          ) : null}
        </div>
        <div className="agent-log" ref={log}>
          {messages.length === 0 ? (
            <div className="starters">
              <img className="brand-empty" src="/brand/empty-chat.png" alt="" width={160} height={160} />
              <p>
                Ask about {readingWhere}. The desk packs the open verse, cross-refs, originals, Strong’s, and notes with your question — then streams the reply. Use a quick tool above, or type freely.
              </p>
              {!modelOn ? (
                <div className="model-off-banner" role="status">
                  <p>The model is off, so Chat stays quiet. Turn it on in Settings, then Test connection.</p>
                  <Button type="button" size="sm" variant="outline" onClick={onOpenSettings}>
                    Open Settings
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={`${message.role}-${index}-${message.streaming ? "live" : message.text.slice(0, 24)}`}
                  className="bubble-row"
                  data-role={message.role}
                  data-streaming={message.streaming ? "true" : undefined}
                  initial={{ opacity: 0, y: reduce ? 0 : motionTokens.distance.sm }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: motionDuration("fast", !!reduce), ease: motionTokens.easing.smooth }}
                >
                  {message.role === "you" && message.receipt?.length ? (
                    <p className="chat-receipt" title="What the desk sent with this question">
                      <span>Packed</span> {message.receipt.join(" · ")}
                    </p>
                  ) : null}
                  <p
                    className={`bubble${message.streaming && !message.text ? " thinking" : ""}${message.streaming && message.text ? " writing" : ""}`}
                    data-role={message.role}
                    data-stage={message.stage}
                  >
                    {message.role === "agent" ? (
                      message.text ? (
                        <>
                          <ChatCitedText text={message.text} onOpenRef={onOpenRef} />
                          {message.streaming ? <span className="stream-caret" aria-hidden="true" /> : null}
                        </>
                      ) : (
                        <>
                          <i />
                          <i />
                          <i />
                        </>
                      )
                    ) : (
                      message.text
                    )}
                  </p>
                  {message.role === "agent" && !message.streaming && message.text ? (
                    <span className="bubble-actions">
                      <button
                        type="button"
                        onClick={() => {
                          onReport(report.trim() ? `${report.trim()}\n\n${message.text}` : message.text)
                          setPane("report")
                        }}
                      >
                        Add to study
                      </button>
                      <button type="button" onClick={() => onSaveNote(message.text)}>
                        Save as a note
                      </button>
                      {onSaveWiki ? (
                        <button type="button" onClick={() => onSaveWiki(message.text)}>
                          Add to wiki
                        </button>
                      ) : null}
                      <button type="button" onClick={() => void navigator.clipboard?.writeText(message.text)}>
                        Copy
                      </button>
                    </span>
                  ) : null}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {!busy && followUps.length ? (
            <div className="chat-followups" role="group" aria-label="Follow-up questions">
              {followUps.map((prompt) => (
                <button key={prompt} type="button" disabled={!modelOn} onClick={() => onAsk(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}
          {busy && stageLabel && !(lastAgent?.streaming && lastAgent.text) ? (
            <p className="chat-stage" data-stage={lastAgent?.stage ?? "thinking"} role="status">
              {stageLabel}
              {lastYou?.receipt?.length ? <span> · {lastYou.receipt.slice(0, 3).join(" · ")}</span> : null}
            </p>
          ) : null}
        </div>
        <form
          className="agent-form"
          onSubmit={(event) => {
            event.preventDefault()
            const command = draft.trim()
            if (!command || busy) return
            setDraft("")
            onAsk(command)
          }}
        >
          <input
            ref={askField}
            value={draft}
            placeholder="Ask about this verse, a named ref, or your notes"
            aria-label="Ask about this verse"
            onChange={(event) => setDraft(event.target.value)}
            disabled={busy}
          />
          {busy && onCancelAsk ? (
            <Tip content="Stop the model reply">
              <button type="button" className="send send-stop" onClick={onCancelAsk} aria-label="Stop reply">
                <Square size={12} fill="currentColor" /> Stop
              </button>
            </Tip>
          ) : (
            <button type="submit" className="send" disabled={busy || !draft.trim()}>
              Send
            </button>
          )}
        </form>
        <p className="model-settings">
          <i className="ai-dot" data-state={lightState} aria-hidden="true" />
          <span>
            {modelState}
            {modelName ? ` · ${modelName.split("/").pop()?.replace(/:.*$/, "") ?? modelName}` : ""}
            {modelOn ? " · On" : " · Off"}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={onOpenSettings}>
            Settings
          </Button>
        </p>
      </div>
    </div>
  )
}

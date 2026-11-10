import { useEffect, useSyncExternalStore } from "react"
import { NO_ANSWER, VoiceChat, type VoiceCommand, type VoiceOptions, type VoiceState } from "./voiceChat"

export type VoiceEntry = { id: number; role: "you" | "agent" | "desk"; text: string; at: number }

type Store = { state: VoiceState | null; log: VoiceEntry[] }

let store: Store = { state: null, log: [] }
let chat: VoiceChat | null = null
let nextId = 1
const listeners = new Set<() => void>()

function emit(patch: Partial<Store>) {
  store = { ...store, ...patch }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The live voice session and its conversation, for any window that shows them. */
export function useVoice() {
  return useSyncExternalStore(subscribe, () => store)
}

export function voiceLive(state: VoiceState | null) {
  return state != null && state.phase !== "error" && state.phase !== "off"
}

function remember(role: VoiceEntry["role"], text: string) {
  const entry = { id: nextId++, role, text, at: Date.now() }
  emit({ log: [...store.log, entry].slice(-200) })
}

export function clearVoiceLog() {
  emit({ log: [] })
}

type Settings = Pick<VoiceOptions, "pauseSecs" | "bargeIn" | "commands" | "earMode" | "server">

type Bridge = {
  settings: Settings
  busy: boolean
  messages: { role: "you" | "agent"; text: string }[]
  onAsk: (text: string) => void
  onCommand: (command: VoiceCommand) => string | void
}

let bridge: Bridge | null = null
let waiting: { count: number; sawBusy: boolean } | null = null

export const voice = {
  start() {
    if (!bridge) return
    window.speechSynthesis?.cancel()
    chat?.stop()
    const link = bridge
    chat = new VoiceChat({
      ...link.settings,
      onState: (state) => emit({ state: state.phase === "off" ? null : state }),
      onCommand: (command) => {
        const reply = bridge?.onCommand(command)
        if (reply) remember("desk", reply)
        return reply
      },
      onTurn: (text) => {
        if (!bridge) return
        remember("you", text)
        const count = bridge.messages.length
        waiting = { count, sawBusy: false }
        bridge.onAsk(text)
        window.setTimeout(() => {
          const turn = waiting
          if (!turn || !bridge || turn.sawBusy || bridge.busy || bridge.messages.length > turn.count) return
          waiting = null
          chat?.failed("The desk could not take that question yet. Try again in a moment.")
        }, 2500)
      },
    })
    void chat.start()
  },
  end() {
    waiting = null
    chat?.stop()
    chat = null
    emit({ state: null })
  },
  hold: () => chat?.hold(),
  resume: () => chat?.resume(),
  interrupt: () => chat?.interrupt(),
  say: (text: string) => chat?.sayLine(text),
  /** A typed line in the Voice window uses the same path as a spoken turn. */
  ask(text: string) {
    const spoken = text.trim()
    if (!spoken || !bridge) return
    remember("you", spoken)
    const count = bridge.messages.length
    waiting = { count, sawBusy: false }
    if (chat && voiceLive(store.state)) chat.thinking()
    bridge.onAsk(spoken)
  },
}

/** App mounts this once: it hands each spoken turn to the chat and each answer back to the voice. */
export function useVoiceBridge(next: Bridge) {
  bridge = next
  const { busy, messages, settings } = next

  useEffect(() => {
    chat?.update(settings)
  }, [settings.pauseSecs, settings.bargeIn, settings.commands, settings.earMode, settings.server.url, settings.server.model, settings.server.key])

  useEffect(() => {
    const turn = waiting
    if (!turn || !chat) return
    if (busy) {
      turn.sawBusy = true
      return
    }
    const reply = messages
      .slice(turn.count)
      .reverse()
      .find((message) => message.role === "agent")
    if (reply) {
      waiting = null
      remember("agent", reply.text)
      chat?.answer(reply.text)
    } else if (turn.sawBusy) {
      waiting = null
      chat?.failed(NO_ANSWER)
    }
  }, [busy, messages])

  useEffect(() => () => voice.end(), [])
}

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { AudioLines, BookOpen, Bot, Columns3, Command, FileDown, HeartHandshake, Highlighter, KanbanSquare, Music2, type LucideIcon } from "lucide-react"
import { donateUrl } from "../settings"
import { motionDuration, motionTokens } from "../lib/motionTokens"
import { Button } from "./ui/button"

const steps: { icon: LucideIcon; title: string; body: string; keys?: string; image?: string; donate?: boolean }[] = [
  {
    icon: BookOpen,
    title: "The chapter is the center of the desk",
    body: "The Bible and the AI are separate windows. Drag the handle between them to resize. Close either with the X on its title bar.",
    image: "/brand/poster-cream-editorial.png",
  },
  {
    icon: Columns3,
    title: "Every pane resizes",
    body: "Drag the thin handle between panes to give a window more room. A window title is a menu: choose another window for that pane, swap panes, or expand one. The side pane keeps tabs of the windows you opened.",
    image: "/brand/poster-mono-grunge.png",
  },
  {
    icon: Highlighter,
    title: "Select a verse to act on it",
    body: "A bar appears under the verse with highlight colors, a bookmark, a note, copy, Strong's numbers, Extra-canon, cross-references, Ask the AI, and Save to notebook.",
  },
  {
    icon: KanbanSquare,
    title: "Notes become a board and a wiki",
    body: "In Notes, each saved verse is a card. The Wiki view holds markdown pages you write, linked with [[Page]] or [[John 3:16]]. Export a study pack to share or import on another desk. The AI can ingest the open passage into the wiki, or Add to wiki from a chat reply.",
  },
  {
    icon: Command,
    title: "One key opens everything",
    body: "Press Ctrl K for the command palette. Type a reference, a Strong's number, Roots, Extra-canon, a study, or a question for the AI. The top bar Go field opens places and windows; use Ctrl K when you want to ask. Number keys 1 through 0 open windows. E opens Roots.",
    keys: "Ctrl K",
  },
  {
    icon: Bot,
    title: "The AI is optional",
    body: "Chat stays quiet until you turn on a model in Settings. Use a local address such as Ollama at 127.0.0.1:11434, then Test connection. Chat answers about the open verse; the Study tab is your written page—use Add to study on a reply to move it there.",
  },
  {
    icon: AudioLines,
    title: "Voice is its own window",
    body: "Open Voice from the Study group in the sidebar, or press V. A Live tag, a pulsing red dot on the Voice icon, and a pill in the top bar stay on while the microphone is working. Press Start, then speak.",
    keys: "V",
  },
  {
    icon: Music2,
    title: "Practice has quiet sound",
    body: "Open Practice for a Temple spoken walk, letter Hear clips on Gematria Learn and Roots names, and Quiet music under Meditate, Scripture Listen, or Extra-canon. All of it is local — no cloud call while you study.",
  },
  {
    icon: FileDown,
    title: "Take the study with you",
    body: "The Study menu exports the written study and your notes as a PDF. Notebooks and the AI report export as PDF too.",
    image: "/brand/wordmark-dark.png",
  },
  {
    icon: HeartHandshake,
    title: "Support the desk",
    body: "Anointed Staff is free local software. If it helps your study, a gift through PayPal keeps the desk maintained. Scan the code or open the same page from the heart in the top bar or the Support row under the sidebar.",
    image: "/donate-qr.png",
    donate: true,
  },
]

export function Tour({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [index, setIndex] = useState(0)
  const reduce = useReducedMotion()
  const step = steps[index]
  const last = index === steps.length - 1
  const slide = reduce ? 0 : motionTokens.distance.md

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setIndex(0)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="palette-overlay" />
        <Dialog.Content className="tour" aria-describedby="tour-body">
          <div className="tour-steps" aria-hidden="true">
            {steps.map((item, at) => (
              <i key={item.title} data-on={at <= index ? "true" : "false"} />
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step.title}
              className="tour-card"
              initial={{ opacity: 0, x: slide }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -slide }}
              transition={{ duration: motionDuration("fast", !!reduce), ease: motionTokens.easing.smooth }}
            >
              {step.image ? (
                <img
                  className={
                    step.donate
                      ? "tour-hero tour-donate"
                      : step.image.includes("wordmark")
                        ? "tour-hero tour-wordmark"
                        : "tour-hero"
                  }
                  src={step.image}
                  alt={step.donate ? "PayPal donation QR code" : ""}
                  width={420}
                  height={220}
                />
              ) : (
                <span className="tour-icon">
                  <step.icon size={26} />
                </span>
              )}
              <Dialog.Title className="tour-title">{step.title}</Dialog.Title>
              <Dialog.Description id="tour-body" className="tour-body">
                {step.body}
              </Dialog.Description>
              {step.keys ? <kbd className="tour-keys">{step.keys}</kbd> : null}
              {step.donate ? (
                <Button type="button" variant="default" size="sm" className="tour-donate" onClick={() => window.open(donateUrl, "_blank", "noopener")}>
                  Open PayPal
                </Button>
              ) : null}
            </motion.div>
          </AnimatePresence>
          <div className="tour-actions">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" size="sm">
                Skip
              </Button>
            </Dialog.Close>
            <span>
              {index + 1} of {steps.length}
            </span>
            <Button type="button" variant="outline" size="sm" disabled={index === 0} onClick={() => setIndex((at) => at - 1)}>
              Back
            </Button>
            {last ? (
              <Dialog.Close asChild>
                <Button type="button" variant="default" size="sm">
                  Begin studying
                </Button>
              </Dialog.Close>
            ) : (
              <Button type="button" variant="default" size="sm" onClick={() => setIndex((at) => at + 1)}>
                Next
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

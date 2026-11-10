import { useState } from "react"
import { Command } from "cmdk"
import { BookOpen, Bot, CornerDownLeft, Search, Sparkles, type LucideIcon } from "lucide-react"
import { books } from "../catalog"

export type PaletteAction = { id: string; label: string; detail?: string; hint?: string; icon?: LucideIcon; onSelect: () => void }

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  windows: { id: string; title: string; hint: string; icon: LucideIcon; key?: string }[]
  actions: PaletteAction[]
  recent: string[]
  onWindow: (id: string) => void
  onCommand: (text: string) => void
  onAsk: (text: string) => void
}

export function CommandPalette({ open, onOpenChange, windows, actions, recent, onWindow, onCommand, onAsk }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const typed = query.trim()

  function run(task: () => void) {
    onOpenChange(false)
    setQuery("")
    task()
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setQuery("")
      }}
      label="Command palette"
      overlayClassName="palette-overlay"
      contentClassName="palette"
    >
      <div className="palette-input">
        <Search size={18} aria-hidden="true" />
        <Command.Input value={query} onValueChange={setQuery} placeholder="Go to John 3:16, open a window, or ask the chat" />
        <kbd>Esc</kbd>
      </div>
      <Command.List className="palette-list">
        <Command.Empty className="palette-empty">Press Enter on a line above, or keep typing.</Command.Empty>
        {typed ? (
          <Command.Group heading="This text">
            <Command.Item forceMount value={`go ${typed}`} onSelect={() => run(() => onCommand(typed))}>
              <CornerDownLeft size={16} aria-hidden="true" />
              <span>Open “{typed}”</span>
              <small>Verse, Strong's number, Extra-canon, or window</small>
            </Command.Item>
            <Command.Item forceMount value={`ask ${typed}`} onSelect={() => run(() => onAsk(typed))}>
              <Bot size={16} aria-hidden="true" />
              <span>Ask the AI</span>
              <small>About the open chapter</small>
            </Command.Item>
            <Command.Item forceMount value={`topic ${typed}`} onSelect={() => run(() => onAsk(`What does the word “${typed}” mean in this passage?`))}>
              <Sparkles size={16} aria-hidden="true" />
              <span>Ask about “{typed}”</span>
              <small>Sends it to the chat with this verse</small>
            </Command.Item>
          </Command.Group>
        ) : null}
        {recent.length && !typed ? (
          <Command.Group heading="Recent places">
            {recent.map((label) => (
              <Command.Item key={label} value={`recent ${label}`} onSelect={() => run(() => onCommand(label))}>
                <BookOpen size={16} aria-hidden="true" />
                <span>{label}</span>
              </Command.Item>
            ))}
          </Command.Group>
        ) : null}
        <Command.Group heading="Windows">
          {windows.map((item) => (
            <Command.Item key={item.id} value={`window ${item.title}`} keywords={[item.hint, item.id, item.id === "writings" ? "writings writing extra-canonical enoch sophia" : ""]} onSelect={() => run(() => onWindow(item.id))}>
              <item.icon size={16} aria-hidden="true" />
              <span>{item.title}</span>
              <small>{item.hint}</small>
              {item.key ? <kbd>{item.key}</kbd> : null}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Desk">
          {actions.map((item) => {
            const Icon = item.icon ?? Sparkles
            return (
              <Command.Item key={item.id} value={`action ${item.label}`} keywords={item.detail ? [item.detail] : undefined} onSelect={() => run(item.onSelect)}>
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
                {item.detail ? <small>{item.detail}</small> : null}
                {item.hint ? <kbd>{item.hint}</kbd> : null}
              </Command.Item>
            )
          })}
        </Command.Group>
        {typed ? (
          <Command.Group heading="Books">
            {books.map((book) => (
              <Command.Item key={book.name} value={`book ${book.name} ${book.abbrev}`} onSelect={() => run(() => onCommand(`${book.name} 1`))}>
                <BookOpen size={16} aria-hidden="true" />
                <span>{book.name}</span>
                <small>{book.section}</small>
              </Command.Item>
            ))}
          </Command.Group>
        ) : null}
      </Command.List>
      <p className="palette-foot">
        <kbd>↑</kbd>
        <kbd>↓</kbd> move · <kbd>Enter</kbd> open · <kbd>Ctrl</kbd>
        <kbd>K</kbd> anywhere
      </p>
    </Command.Dialog>
  )
}

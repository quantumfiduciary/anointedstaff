import { useMemo, useState, type ReactNode } from "react"
import { Bot, ExternalLink, Sparkles } from "lucide-react"
import { shemAngels, shemThreads, type ShemThread } from "../study/shemHaMephorash"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

type ShemNamesPanelProps = {
  onOpenRef?: (ref: string) => void
  onAsk?: (question: string) => void
  onOpenOutside?: (query: string) => void
}

export function ShemNamesPanel({ onOpenRef, onAsk, onOpenOutside }: ShemNamesPanelProps): ReactNode {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return shemAngels
    return shemAngels.filter(
      (angel) =>
        angel.name.toLowerCase().includes(q) ||
        angel.triad.toLowerCase().includes(q) ||
        String(angel.n) === q ||
        angel.verseRef.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <section className="shem-panel" aria-label="Seventy-two names">
      <p className="eyebrow">
        <Sparkles size={12} aria-hidden="true" /> Seventy-two names
      </p>
      <p className="quiet">
        Shem HaMephorash from Exodus 14:19–21, angel endings, Goetia pairing history, quinances vs Mazzaroth, and
        72+72 beside Revelation’s 144,000. Scripture first; tradition labeled. No seals, no birth-angel calendar.
      </p>

      <ul className="anth-list">
        {shemThreads.map((thread) => (
          <li key={thread.id}>
            <ShemThreadCard thread={thread} onOpenRef={onOpenRef} onAsk={onAsk} onOpenOutside={onOpenOutside} />
          </li>
        ))}
      </ul>

      <div className="shem-catalog">
        <p className="eyebrow">Catalog · 72</p>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter name, triad, number, or verse"
          aria-label="Filter Shem angels"
        />
        <ul className="shem-angel-list">
          {filtered.map((angel) => (
            <li key={angel.n}>
              <span className="shem-n">{angel.n}</span>
              <span className="shem-triad" title="Three-letter root">
                {angel.triad}
              </span>
              <strong>{angel.name}</strong>
              {onOpenRef ? (
                <button type="button" className="chip" onClick={() => onOpenRef(angel.verseRef)}>
                  {angel.verseRef}
                </button>
              ) : (
                <span className="chip">{angel.verseRef}</span>
              )}
            </li>
          ))}
        </ul>
        {!filtered.length ? <p className="quiet">No names match.</p> : null}
      </div>

      <p className="rights">
        Seventy-two names are a study table beside Scripture · Extra-canon Goetia is history, not a summoning desk.
      </p>
    </section>
  )
}

function ShemThreadCard({
  thread,
  onOpenRef,
  onAsk,
  onOpenOutside,
}: {
  thread: ShemThread
} & ShemNamesPanelProps) {
  return (
    <article className="anth-card" data-id={thread.id}>
      <p className="eyebrow">{thread.eyebrow}</p>
      <h3>{thread.title}</h3>
      <p>{thread.summary}</p>
      {thread.hypothesis ? <p className="anth-hypothesis">{thread.hypothesis}</p> : null}

      <div className="anth-refs" role="group" aria-label="Scripture">
        {thread.refs.map((ref) =>
          onOpenRef ? (
            <button key={ref} type="button" className="chip" onClick={() => onOpenRef(ref)}>
              {ref}
            </button>
          ) : (
            <span key={ref} className="chip">
              {ref}
            </span>
          ),
        )}
      </div>

      <div className="anth-actions">
        {thread.libraryIds.map((id) =>
          onOpenOutside ? (
            <Button key={id} type="button" size="sm" variant="outline" onClick={() => onOpenOutside(id)}>
              Extra-canon · {id}
            </Button>
          ) : null,
        )}
        {onAsk ? (
          <Button type="button" size="sm" onClick={() => onAsk(thread.askPrompt)}>
            <Bot size={14} /> Ask
          </Button>
        ) : null}
      </div>

      {thread.furtherReading.length ? (
        <ul className="anth-further">
          {thread.furtherReading.map((item) => (
            <li key={item.url}>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={12} aria-hidden="true" /> {item.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

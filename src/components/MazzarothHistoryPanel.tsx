import type { ReactNode } from "react"
import { Bot, ExternalLink, Stars } from "lucide-react"
import { mazzarothHistoryThreads, type MazzarothHistoryThread } from "../study/mazzarothHistory"
import { Button } from "./ui/button"

type Props = {
  onOpenRef?: (ref: string) => void
  onAsk?: (question: string) => void
  onOpenOutside?: (query: string) => void
}

export function MazzarothHistoryPanel({ onOpenRef, onAsk, onOpenOutside }: Props): ReactNode {
  return (
    <section className="anth-panel" aria-label="Mazzaroth history">
      <p className="eyebrow">
        <Stars size={12} aria-hidden="true" /> Mazzaroth history
      </p>
      <p className="quiet">
        Job’s ordinances, Rolleston (1862) as Extra-canon PD, and Heavens Decans / Camp typology. Cast stays clocks —
        not fortunes.
      </p>
      <ul className="anth-list">
        {mazzarothHistoryThreads.map((thread) => (
          <li key={thread.id}>
            <HistoryCard thread={thread} onOpenRef={onOpenRef} onAsk={onAsk} onOpenOutside={onOpenOutside} />
          </li>
        ))}
      </ul>
      <p className="rights">Mazzaroth study notes · Rolleston (1862) Extra-canon · Cast stays clocks.</p>
    </section>
  )
}

function HistoryCard({
  thread,
  onOpenRef,
  onAsk,
  onOpenOutside,
}: {
  thread: MazzarothHistoryThread
} & Props) {
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
        {thread.furtherReading.map((item) => (
          <a key={item.url} className="chip" href={item.url} target="_blank" rel="noreferrer">
            <ExternalLink size={12} aria-hidden="true" /> {item.label}
          </a>
        ))}
        {onAsk ? (
          <Button type="button" size="sm" onClick={() => onAsk(thread.askPrompt)}>
            <Bot size={14} /> Ask
          </Button>
        ) : null}
      </div>
    </article>
  )
}

import type { ReactNode } from "react"
import { Bot, ExternalLink, Users } from "lucide-react"
import { anthropologyThreads, type AnthropologyThread } from "../study/biblicalAnthropology"
import { Button } from "./ui/button"

type AnthropologyPanelProps = {
  onOpenRef?: (ref: string) => void
  onStrong?: (id: string) => void
  onAsk?: (question: string) => void
  onOpenOutside?: (query: string) => void
  /** Jump to Study Letters Habiru / emet focus. */
  onOpenLetters?: (focus?: string) => void
}

export function AnthropologyPanel({
  onOpenRef,
  onStrong,
  onAsk,
  onOpenOutside,
  onOpenLetters,
}: AnthropologyPanelProps): ReactNode {
  return (
    <section className="anth-panel" aria-label="Peoples and night names">
      <p className="eyebrow">
        <Users size={12} aria-hidden="true" /> Peoples and night names
      </p>
      <p className="quiet">
        Desk biblical anthropology: Lilith, Habiru/Hebrew, Horites, letter folklore, and shadow study. Scripture first;
        further reading opens off-desk. Not Brill’s Dictionary of Deities and Demons.
      </p>
      <ul className="anth-list">
        {anthropologyThreads.map((thread) => (
          <li key={thread.id}>
            <AnthropologyCard
              thread={thread}
              onOpenRef={onOpenRef}
              onStrong={onStrong}
              onAsk={onAsk}
              onOpenOutside={onOpenOutside}
              onOpenLetters={onOpenLetters}
            />
          </li>
        ))}
      </ul>
      <p className="rights">Study notes beside Scripture · further reading opens off-desk.</p>
    </section>
  )
}

function AnthropologyCard({
  thread,
  onOpenRef,
  onStrong,
  onAsk,
  onOpenOutside,
  onOpenLetters,
}: {
  thread: AnthropologyThread
} & AnthropologyPanelProps) {
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

      {thread.strongIds.length ? (
        <div className="anth-strongs" role="group" aria-label="Strong’s">
          {thread.strongIds.map((id) =>
            onStrong ? (
              <button key={id} type="button" className="link-btn" onClick={() => onStrong(id)}>
                {id}
              </button>
            ) : (
              <b key={id}>{id}</b>
            ),
          )}
        </div>
      ) : null}

      <div className="anth-actions">
        {thread.libraryIds.map((id) =>
          onOpenOutside ? (
            <Button key={id} type="button" size="sm" variant="outline" onClick={() => onOpenOutside(id)}>
              Extra-canon · {id}
            </Button>
          ) : null,
        )}
        {thread.id === "habiru" && onOpenLetters ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onOpenLetters("habiru")}>
            Hebrew letter vision
          </Button>
        ) : null}
        {thread.id === "emet-golem" && onOpenLetters ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onOpenLetters("emet")}>
            Letters · אמת
          </Button>
        ) : null}
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

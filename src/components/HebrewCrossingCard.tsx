import type { ReactNode } from "react"
import { Bot, Eye } from "lucide-react"
import { hebrewCrossing } from "../study/hebrewCrossing"
import { Button } from "./ui/button"

type HebrewCrossingCardProps = {
  /** Compact for Word art grid; full for Study → Letters. */
  layout?: "full" | "featured"
  onOpenRef?: (ref: string) => void
  onStrong?: (id: string) => void
  onAsk?: (question: string) => void
  onFillWord?: (hebrew: string) => void
  /** Open Study → Links Habiru / anthropology section. */
  onOpenAnthropology?: () => void
}

export function HebrewCrossingCard({
  layout = "full",
  onOpenRef,
  onStrong,
  onAsk,
  onFillWord,
  onOpenAnthropology,
}: HebrewCrossingCardProps): ReactNode {
  const study = hebrewCrossing
  const featured = layout === "featured"

  return (
    <article className="hebrew-crossing" data-layout={layout} aria-label={study.title}>
      <div className="hebrew-crossing-hero">
        <img src={study.image} alt={study.imageAlt} width={featured ? 420 : 720} height={featured ? 280 : 480} loading="lazy" />
        <div className="hebrew-crossing-title">
          <p className="eyebrow">
            <Eye size={12} aria-hidden="true" /> Letter vision
          </p>
          <h3>
            <span lang="he" dir="rtl">
              {study.hebrew}
            </span>{" "}
            Hebrew
          </h3>
          <p className="quiet">{study.translit} · read letters right to left</p>
        </div>
      </div>

      <ol className="hebrew-crossing-letters" aria-label="Ayin Beth Resh">
        {[...study.letters].reverse().map((letter) => (
          <li key={letter.glyph}>
            <button
              type="button"
              className="hebrew-crossing-glyph"
              lang="he"
              title={`${letter.name} · ${letter.symbol}`}
              onClick={() => onStrong?.(letter.strong)}
            >
              {letter.glyph}
            </button>
            <strong>{letter.name}</strong>
            <span>{letter.english}</span>
            <small>{letter.symbol}</small>
            {onStrong ? (
              <button type="button" className="link-btn" onClick={() => onStrong(letter.strong)}>
                {letter.strong}
              </button>
            ) : (
              <small className="quiet">{letter.strong}</small>
            )}
          </li>
        ))}
      </ol>
      <p className="hebrew-crossing-arrow" aria-hidden="true">
        ← Read from right to left · eye · in · head
      </p>

      <p>{study.lexical}</p>
      <p>{study.symbolic}</p>
      <p className="hebrew-crossing-synthesis">{study.synthesis}</p>

      <div className="hebrew-crossing-strongs" role="group" aria-label="Strong’s for this reading">
        <p className="eyebrow">Strong’s</p>
        <ul>
          {study.roots.map((root) => (
            <li key={root.id}>
              {onStrong ? (
                <button type="button" className="link-btn" onClick={() => onStrong(root.id)}>
                  {root.id}
                </button>
              ) : (
                <b>{root.id}</b>
              )}{" "}
              <span>{root.gloss}</span>
            </li>
          ))}
          {study.letters.map((letter) => (
            <li key={`pic-${letter.strong}`}>
              {onStrong ? (
                <button type="button" className="link-btn" onClick={() => onStrong(letter.strong)}>
                  {letter.strong}
                </button>
              ) : (
                <b>{letter.strong}</b>
              )}{" "}
              <span>
                {letter.name}: {letter.strongNote}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="hebrew-crossing-verses" role="group" aria-label="Scripture anchors">
        <p className="eyebrow">Scripture</p>
        <ul>
          {study.verses.map((item) => (
            <li key={item.ref}>
              {onOpenRef ? (
                <button type="button" className="link-btn" onClick={() => onOpenRef(item.ref)}>
                  {item.ref}
                </button>
              ) : (
                <b>{item.ref}</b>
              )}
              <span className="quiet"> — {item.note}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="quiet hebrew-crossing-habiru">
        Anthropology also asks how Habiru / ‘apiru temple-servant language sits beside Abram the Hebrew (Genesis 14:13).
      </p>

      <div className="hebrew-crossing-actions">
        {onFillWord ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onFillWord(study.hebrew)}>
            Count עבר
          </Button>
        ) : null}
        {onOpenAnthropology ? (
          <Button type="button" size="sm" variant="outline" onClick={onOpenAnthropology}>
            Habiru / Hebrew anthropology
          </Button>
        ) : null}
        {onAsk ? (
          <Button type="button" size="sm" onClick={() => onAsk(study.askPrompt)}>
            <Bot size={14} /> Ask about this
          </Button>
        ) : null}
      </div>
    </article>
  )
}

import { useMemo, useState, type ReactNode } from "react"
import { Bot, Network } from "lucide-react"
import { letterPaths, pathLabel, sephirahOf, sephirot, treeIntro, type TreePath } from "../study/treeOfLife"
import { Button } from "./ui/button"

type TreeOfLifePanelProps = {
  onOpenRef?: (ref: string) => void
  onStrong?: (id: string) => void
  onAsk?: (question: string) => void
  onLetter?: (glyph: string) => void
  onOpenYetzirah?: () => void
}

export function TreeOfLifePanel({ onOpenRef, onAsk, onLetter, onOpenYetzirah }: TreeOfLifePanelProps): ReactNode {
  const [picked, setPicked] = useState<TreePath>(letterPaths[0])
  const mothers = useMemo(() => letterPaths.filter((item) => item.group === "mother"), [])
  const doubles = useMemo(() => letterPaths.filter((item) => item.group === "double"), [])
  const simples = useMemo(() => letterPaths.filter((item) => item.group === "simple"), [])

  function pick(path: TreePath) {
    setPicked(path)
    onLetter?.(path.glyph)
  }

  return (
    <div className="tree-life" aria-label={treeIntro.title}>
      <header className="tree-life-head">
        <p className="eyebrow">
          <Network size={12} aria-hidden="true" /> Kabbalah study map
        </p>
        <h3>{treeIntro.title}</h3>
        <p>{treeIntro.summary}</p>
        <p className="quiet">{treeIntro.genesisNote}</p>
        <p className="quiet">{treeIntro.hermeticNote}</p>
      </header>

      <section className="tree-life-sephirot" aria-label="Ten sefirot">
        <p className="eyebrow">10 Sephirot · Paths 1–10</p>
        <ol>
          {sephirot.map((node) => (
            <li key={node.number} data-pillar={node.pillar}>
              <b>
                {node.number}. {node.name}{" "}
                <span lang="he" dir="rtl">
                  {node.hebrew}
                </span>
              </b>
              <span>{node.gloss}</span>
              <small>
                {onOpenRef ? (
                  <button type="button" className="link-btn" onClick={() => onOpenRef(node.elohim.ref)}>
                    {node.elohim.ref}
                  </button>
                ) : (
                  node.elohim.ref
                )}
                {" — "}
                {node.elohim.note}
              </small>
            </li>
          ))}
        </ol>
      </section>

      <section className="tree-life-channels" aria-label="Twenty-two letter paths">
        <p className="eyebrow">22 letters · Paths 11–32</p>
        <p className="quiet">
          Sefer Yetzirah groups the letters as three mothers, seven doubles, and twelve simples. On the Western Tree they are drawn as channels between sefirot. Sky labels below are the common Hermetic map — clocks and study tags, not Cast fortunes.
        </p>

        <PathGroup title="Mothers · elements" paths={mothers} picked={picked} onPick={pick} />
        <PathGroup title="Doubles · planets" paths={doubles} picked={picked} onPick={pick} />
        <PathGroup title="Simples · zodiac" paths={simples} picked={picked} onPick={pick} />

        <article className="tree-life-detail" aria-live="polite">
          <p className="eyebrow">
            Path {picked.number} · {picked.group}
          </p>
          <h4>
            <span lang="he">{picked.glyph}</span> {picked.name}
          </h4>
          <p>
            {pathLabel(picked)} · {sephirahOf(picked.from).gloss.split("—")[0].trim()} toward{" "}
            {sephirahOf(picked.to).name}
          </p>
          <p className="quiet">
            Sky tag: {picked.sky}. Historical Hermetic title: <i>{picked.hermeticTitle}</i> (label only — this desk does not draw Tarot).
          </p>
        </article>
      </section>

      <div className="tree-life-actions">
        {onOpenYetzirah ? (
          <Button type="button" size="sm" variant="outline" onClick={onOpenYetzirah}>
            Sefer Yetzirah notes
          </Button>
        ) : null}
        {onOpenRef ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onOpenRef("Genesis 1:1")}>
            Open Genesis 1
          </Button>
        ) : null}
        {onAsk ? (
          <Button type="button" size="sm" onClick={() => onAsk(treeIntro.askPrompt)}>
            <Bot size={14} /> Ask about the 32 Paths
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function PathGroup({
  title,
  paths,
  picked,
  onPick,
}: {
  title: string
  paths: TreePath[]
  picked: TreePath
  onPick: (path: TreePath) => void
}) {
  return (
    <div className="tree-life-group" role="group" aria-label={title}>
      <p className="eyebrow">{title}</p>
      <div className="chip-row tree-life-chips">
        {paths.map((path) => (
          <button
            key={path.number}
            type="button"
            className="chip"
            data-picked={path.number === picked.number ? "true" : "false"}
            onClick={() => onPick(path)}
            title={`${path.name} · ${path.sky}`}
          >
            <span lang="he">{path.glyph}</span> {path.number}
          </button>
        ))}
      </div>
    </div>
  )
}

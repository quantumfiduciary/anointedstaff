import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { Frame, Hand, Link2, Maximize, Presentation, Square, StickyNote } from "lucide-react"
import { Button } from "./ui/button"
import { Tip } from "./ui/tip"
import { cardSpot, insideFrame, type NoteCard, type NoteFrame, type Notebook } from "../notebooks"

type Tool = "select" | "pan" | "sticky" | "frame" | "link"

type NoteBoardProps = {
  notebook: Notebook
  cards: NoteCard[]
  onChange: (update: (notebook: Notebook) => Notebook) => void
  onOpen: (book: number, chapter: number, verse: number) => void
  onAddSticky: (x: number, y: number) => void
  onPin: (id: string) => void
  onRemove: (id: string) => void
}

const MIN = 0.35
const MAX = 2.1
const CARD_W = 220
const CARD_H = 148

function clamp(value: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, value))
}

function cameraKey(id: string) {
  return `anointed-staff.board.${id}`
}

function readCamera(id: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(cameraKey(id)) ?? "") as { x?: number; y?: number; scale?: number }
    return { x: saved.x ?? 0, y: saved.y ?? 0, scale: typeof saved.scale === "number" ? clamp(saved.scale, MIN, MAX) : 1 }
  } catch {
    return { x: 0, y: 0, scale: 1 }
  }
}

function bounds(cards: NoteCard[], frames: NoteFrame[]) {
  const points = [
    ...cards.map((card, index) => {
      const spot = cardSpot(card, index)
      return [spot.x, spot.y, spot.x + CARD_W, spot.y + CARD_H] as const
    }),
    ...frames.map((frame) => [frame.x, frame.y, frame.x + frame.w, frame.y + frame.h] as const),
  ]
  if (!points.length) return { x: 0, y: 0, w: 800, h: 520 }
  const left = Math.min(...points.map((item) => item[0]))
  const top = Math.min(...points.map((item) => item[1]))
  const right = Math.max(...points.map((item) => item[2]))
  const bottom = Math.max(...points.map((item) => item[3]))
  return { x: left - 80, y: top - 80, w: right - left + 160, h: bottom - top + 160 }
}

export function NoteBoard({ notebook, cards, onChange, onOpen, onAddSticky, onPin, onRemove }: NoteBoardProps) {
  const surface = useRef<HTMLDivElement>(null)
  const [tool, setTool] = useState<Tool>("select")
  const [cam, setCam] = useState(() => readCamera(notebook.id))
  const [linking, setLinking] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const [frameDrag, setFrameDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const [draw, setDraw] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [present, setPresent] = useState<number | null>(null)
  const space = useRef(false)
  const fitRef = useRef<(area?: { x: number; y: number; w: number; h: number }) => void>(() => undefined)

  useEffect(() => setCam(readCamera(notebook.id)), [notebook.id])
  useEffect(() => localStorage.setItem(cameraKey(notebook.id), JSON.stringify(cam)), [notebook.id, cam])

  useEffect(() => {
    function down(event: KeyboardEvent) {
      const typing = event.target instanceof HTMLElement && Boolean(event.target.closest("input, textarea"))
      if (event.code === "Space") space.current = true
      if (typing) return
      if (event.key === "Escape") {
        setLinking(null)
        setPresent(null)
        setTool("select")
      }
      if (event.key.toLowerCase() === "f") setTool("frame")
      if (event.key.toLowerCase() === "n") setTool("sticky")
      if (event.key === "1") fitRef.current()
      if (event.key === "Delete" && selected) onRemove(selected)
    }
    function up(event: KeyboardEvent) {
      if (event.code === "Space") space.current = false
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [onRemove, selected])

  useEffect(() => {
    const node = surface.current
    if (!node) return
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      const box = node.getBoundingClientRect()
      const mx = event.clientX - box.left
      const my = event.clientY - box.top
      setCam((current) => {
        if (event.ctrlKey || event.metaKey) {
          const next = clamp(current.scale * (event.deltaY < 0 ? 1.08 : 0.92), MIN, MAX)
          const worldX = current.x + mx / current.scale
          const worldY = current.y + my / current.scale
          return { scale: next, x: worldX - mx / next, y: worldY - my / next }
        }
        return { ...current, x: current.x + event.deltaX / current.scale, y: current.y + event.deltaY / current.scale }
      })
    }
    node.addEventListener("wheel", wheel, { passive: false })
    return () => node.removeEventListener("wheel", wheel)
  }, [])

  const frames = (notebook.frames ?? []).map((frame) => (frameDrag?.id === frame.id ? { ...frame, x: frameDrag.x, y: frameDrag.y } : frame))
  const spots = useMemo(() => {
    const origin = (notebook.frames ?? []).find((frame) => frame.id === frameDrag?.id)
    const dx = frameDrag && origin ? frameDrag.x - origin.x : 0
    const dy = frameDrag && origin ? frameDrag.y - origin.y : 0
    return Object.fromEntries(
      cards.map((card, index) => {
        const base = drag?.id === card.id ? { x: drag.x, y: drag.y } : cardSpot(card, index)
        const ride = origin && insideFrame(origin, base.x + CARD_W / 2, base.y + 36)
        return [card.id, ride ? { x: base.x + dx, y: base.y + dy } : base]
      }),
    )
  }, [cards, drag, frameDrag, notebook.frames])
  const world = bounds(cards, frames)
  const panning = () => tool === "pan" || space.current

  function worldOf(event: { clientX: number; clientY: number }) {
    const box = surface.current?.getBoundingClientRect()
    const mx = event.clientX - (box?.left ?? 0)
    const my = event.clientY - (box?.top ?? 0)
    return { x: cam.x + mx / cam.scale, y: cam.y + my / cam.scale, mx, my }
  }

  function fit(area = world) {
    const box = surface.current?.getBoundingClientRect()
    if (!box) return
    const scale = clamp(Math.min((box.width - 48) / Math.max(area.w, 1), (box.height - 48) / Math.max(area.h, 1)), MIN, MAX)
    setCam({ scale, x: area.x - (box.width / scale - area.w) / 2, y: area.y - (box.height / scale - area.h) / 2 })
  }
  fitRef.current = fit

  function showFrame(index: number) {
    const frame = frames[index]
    if (!frame) {
      setPresent(null)
      return
    }
    setPresent(index)
    fit({ x: frame.x - 24, y: frame.y - 24, w: frame.w + 48, h: frame.h + 48 })
  }

  function panStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button === 1 || panning()) {
      const origin = { x: event.clientX, y: event.clientY, camX: cam.x, camY: cam.y }
      const move = (pointer: PointerEvent) => {
        setCam((current) => ({
          ...current,
          x: origin.camX - (pointer.clientX - origin.x) / current.scale,
          y: origin.camY - (pointer.clientY - origin.y) / current.scale,
        }))
      }
      const finish = () => {
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", finish)
      }
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", finish)
      event.preventDefault()
      return true
    }
    return false
  }

  function onSurfaceDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest(".board-card, .board-frame, .board-tools, .board-mini, .board-present")) return
    if (panStart(event)) return
    const point = worldOf(event)
    if (tool === "sticky") {
      onAddSticky(Math.round(point.x), Math.round(point.y))
      setTool("select")
      return
    }
    if (tool === "frame") {
      const origin = point
      const move = (pointer: PointerEvent) => {
        const now = worldOf(pointer)
        setDraw({
          x: Math.min(origin.x, now.x),
          y: Math.min(origin.y, now.y),
          w: Math.abs(now.x - origin.x),
          h: Math.abs(now.y - origin.y),
        })
      }
      const finish = (pointer: PointerEvent) => {
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", finish)
        const now = worldOf(pointer)
        const next = {
          x: Math.min(origin.x, now.x),
          y: Math.min(origin.y, now.y),
          w: Math.abs(now.x - origin.x),
          h: Math.abs(now.y - origin.y),
        }
        setDraw(null)
        if (next.w < 80 || next.h < 80) return
        onChange((page) => ({
          ...page,
          frames: [...(page.frames ?? []), { id: crypto.randomUUID(), title: `Scene ${(page.frames ?? []).length + 1}`, ...next }],
        }))
        setTool("select")
      }
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", finish)
      return
    }
    setSelected(null)
    setLinking(null)
  }

  function beginCard(event: ReactPointerEvent<HTMLElement>, card: NoteCard, index: number) {
    if ((event.target as HTMLElement).closest("button, input, textarea")) return
    if (panning()) return
    event.stopPropagation()
    setSelected(card.id)
    if (tool === "link") {
      chooseLink(card.id)
      return
    }
    const origin = spots[card.id] ?? cardSpot(card, index)
    const startX = event.clientX
    const startY = event.clientY
    const move = (pointer: PointerEvent) => {
      setDrag({
        id: card.id,
        x: Math.round(origin.x + (pointer.clientX - startX) / cam.scale),
        y: Math.round(origin.y + (pointer.clientY - startY) / cam.scale),
      })
    }
    const finish = (pointer: PointerEvent) => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", finish)
      setDrag(null)
      const x = Math.round(origin.x + (pointer.clientX - startX) / cam.scale)
      const y = Math.round(origin.y + (pointer.clientY - startY) / cam.scale)
      onChange((page) => ({ ...page, cards: page.cards.map((item) => (item.id === card.id ? { ...item, x, y } : item)) }))
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", finish)
  }

  function beginFrame(event: ReactPointerEvent<HTMLElement>, frame: NoteFrame) {
    if ((event.target as HTMLElement).closest("input, button")) return
    if (panning()) return
    event.stopPropagation()
    const startX = event.clientX
    const startY = event.clientY
    const riders = cards.filter((card, index) => {
      const spot = spots[card.id] ?? cardSpot(card, index)
      return insideFrame(frame, spot.x + CARD_W / 2, spot.y + 36)
    })
    const move = (pointer: PointerEvent) => {
      setFrameDrag({
        id: frame.id,
        x: Math.round(frame.x + (pointer.clientX - startX) / cam.scale),
        y: Math.round(frame.y + (pointer.clientY - startY) / cam.scale),
      })
    }
    const finish = (pointer: PointerEvent) => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", finish)
      setFrameDrag(null)
      const dx = Math.round((pointer.clientX - startX) / cam.scale)
      const dy = Math.round((pointer.clientY - startY) / cam.scale)
      const rider = new Set(riders.map((card) => card.id))
      onChange((page) => ({
        ...page,
        frames: (page.frames ?? []).map((item) => (item.id === frame.id ? { ...item, x: frame.x + dx, y: frame.y + dy } : item)),
        cards: page.cards.map((card, index) => {
          if (!rider.has(card.id)) return card
          const spot = cardSpot(card, index)
          return { ...card, x: spot.x + dx, y: spot.y + dy }
        }),
      }))
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", finish)
  }

  function chooseLink(id: string) {
    if (!linking) {
      setLinking(id)
      setTool("link")
      return
    }
    if (linking !== id) {
      const from = linking
      onChange((page) => {
        const exists = page.links.some((link) => (link.from === from && link.to === id) || (link.from === id && link.to === from))
        return {
          ...page,
          links: exists
            ? page.links.filter((link) => !((link.from === from && link.to === id) || (link.from === id && link.to === from)))
            : [...page.links, { from, to: id }],
        }
      })
    }
    setLinking(null)
    setTool("select")
  }

  const mini = { w: 168, h: 104 }
  const miniScale = Math.min(mini.w / Math.max(world.w, 1), mini.h / Math.max(world.h, 1))

  return (
    <div className="note-board" data-tool={tool} data-present={present != null ? "true" : "false"}>
      <div className="board-tools" role="toolbar" aria-label="Study board">
        <Tip content="Select and move cards">
          <Button type="button" size="sm" variant={tool === "select" ? "default" : "outline"} aria-label="Select" aria-pressed={tool === "select"} onClick={() => setTool("select")}>
            <Square size={14} />
          </Button>
        </Tip>
        <Tip content="Pan the board" keys="Space">
          <Button type="button" size="sm" variant={tool === "pan" ? "default" : "outline"} aria-label="Pan" aria-pressed={tool === "pan"} onClick={() => setTool("pan")}>
            <Hand size={14} />
          </Button>
        </Tip>
        <Tip content="Click the board to drop a sticky">
          <Button type="button" size="sm" variant={tool === "sticky" ? "default" : "outline"} aria-label="Sticky" aria-pressed={tool === "sticky"} onClick={() => setTool("sticky")}>
            <StickyNote size={14} />
          </Button>
        </Tip>
        <Tip content="Drag a frame around a scene" keys="F">
          <Button type="button" size="sm" variant={tool === "frame" ? "default" : "outline"} aria-label="Frame" aria-pressed={tool === "frame"} onClick={() => setTool("frame")}>
            <Frame size={14} />
          </Button>
        </Tip>
        <Tip content="Click two cards to link or unlink them">
          <Button type="button" size="sm" variant={tool === "link" ? "default" : "outline"} aria-label="Link" aria-pressed={tool === "link"} onClick={() => setTool("link")}>
            <Link2 size={14} />
          </Button>
        </Tip>
        <Tip content="Fit every card and frame" keys="1">
          <Button type="button" size="sm" variant="outline" aria-label="Fit" onClick={() => fit()}>
            <Maximize size={14} />
          </Button>
        </Tip>
        <Tip content="Present frames as slides">
          <Button type="button" size="sm" variant="outline" aria-label="Present" disabled={!frames.length} onClick={() => showFrame(0)}>
            <Presentation size={14} />
          </Button>
        </Tip>
        <span className="board-zoom">{Math.round(cam.scale * 100)}%</span>
      </div>
      <div
        ref={surface}
        className="board-surface"
        onPointerDown={onSurfaceDown}
        onDoubleClick={(event) => {
          if ((event.target as HTMLElement).closest(".board-card, .board-frame")) return
          const point = worldOf(event)
          onAddSticky(Math.round(point.x), Math.round(point.y))
        }}
      >
        <div className="board-world" style={{ transform: `translate(${-cam.x * cam.scale}px, ${-cam.y * cam.scale}px) scale(${cam.scale})` }}>
          {frames.map((frame) => (
            <article
              key={frame.id}
              className="board-frame"
              style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}
              onPointerDown={(event) => beginFrame(event, frame)}
            >
              <header>
                <input
                  value={frame.title}
                  aria-label="Frame title"
                  onChange={(event) => onChange((page) => ({ ...page, frames: (page.frames ?? []).map((item) => (item.id === frame.id ? { ...item, title: event.target.value.slice(0, 48) } : item)) }))}
                />
                <button
                  type="button"
                  aria-label={`Remove ${frame.title}`}
                  onClick={() => onChange((page) => ({ ...page, frames: (page.frames ?? []).filter((item) => item.id !== frame.id) }))}
                >
                  ×
                </button>
              </header>
            </article>
          ))}
          {draw ? <div className="board-draw" style={{ left: draw.x, top: draw.y, width: draw.w, height: draw.h }} /> : null}
          <svg className="board-links" width={Math.max(world.w + world.x, 1)} height={Math.max(world.h + world.y, 1)} aria-hidden="true">
            <defs>
              <marker id="board-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {notebook.links.map((link) => {
              const start = spots[link.from]
              const end = spots[link.to]
              if (!start || !end) return null
              const x1 = start.x + CARD_W / 2
              const y1 = start.y + 28
              const x2 = end.x + CARD_W / 2
              const y2 = end.y + 28
              const mx = (x1 + x2) / 2
              const my = (y1 + y2) / 2 - 24
              return (
                <g key={`${link.from}:${link.to}`}>
                  <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} markerEnd="url(#board-arrow)" />
                  {link.label ? (
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle">
                      {link.label}
                    </text>
                  ) : null}
                </g>
              )
            })}
          </svg>
          {cards.map((card, index) => {
            const place = spots[card.id] ?? cardSpot(card, index)
            return (
              <article
                key={card.id}
                className="board-card"
                data-color={card.color ?? "none"}
                data-kind={card.kind ?? "verse"}
                data-pinned={card.pinned ? "true" : "false"}
                data-selected={selected === card.id ? "true" : "false"}
                data-linking={linking === card.id ? "true" : "false"}
                style={{ left: place.x, top: place.y }}
                onPointerDown={(event) => beginCard(event, card, index)}
              >
                <header>
                  <button type="button" onClick={() => (card.kind === "note" ? undefined : onOpen(card.book, card.chapter, card.verse))}>
                    {card.label}
                  </button>
                  <button type="button" aria-pressed={card.pinned} onClick={() => onPin(card.id)}>
                    {card.pinned ? "Pinned" : "Pin"}
                  </button>
                </header>
                {card.kind === "note" ? (
                  <textarea
                    value={card.annotation}
                    placeholder="Write here"
                    aria-label={`Sticky ${card.label}`}
                    onChange={(event) =>
                      onChange((page) => ({
                        ...page,
                        cards: page.cards.map((item) => (item.id === card.id ? { ...item, annotation: event.target.value, text: event.target.value || "Write here" } : item)),
                      }))
                    }
                  />
                ) : (
                  <p>{card.annotation || card.text}</p>
                )}
              </article>
            )
          })}
        </div>
        <button
          type="button"
          className="board-mini"
          aria-label="Jump on the board"
          onClick={(event) => {
            const box = event.currentTarget.getBoundingClientRect()
            const mx = event.clientX - box.left
            const my = event.clientY - box.top
            const view = surface.current?.getBoundingClientRect()
            setCam((current) => ({
              ...current,
              x: world.x + mx / miniScale - (view?.width ?? 0) / 2 / current.scale,
              y: world.y + my / miniScale - (view?.height ?? 0) / 2 / current.scale,
            }))
          }}
        >
          <i style={{ width: world.w * miniScale, height: world.h * miniScale }}>
            {frames.map((frame) => (
              <em key={frame.id} className="mini-frame" style={{ left: (frame.x - world.x) * miniScale, top: (frame.y - world.y) * miniScale, width: frame.w * miniScale, height: frame.h * miniScale }} />
            ))}
            {cards.map((card, index) => {
              const spot = spots[card.id] ?? cardSpot(card, index)
              return <em key={card.id} className="mini-card" style={{ left: (spot.x - world.x) * miniScale, top: (spot.y - world.y) * miniScale }} />
            })}
          </i>
        </button>
      </div>
      {linking ? <p className="board-hint">Choose a second card to link, or press Escape.</p> : null}
      {tool === "sticky" ? <p className="board-hint">Click the board to drop a sticky, or double-click anywhere.</p> : null}
      {tool === "frame" ? <p className="board-hint">Drag a rectangle around a scene. Cards inside it move with the frame.</p> : null}
      {present != null ? (
        <div className="board-present">
          <b>{frames[present]?.title ?? "Scene"}</b>
          <span>
            {present + 1} / {frames.length}
          </span>
          <Button type="button" size="sm" variant="outline" disabled={present === 0} onClick={() => showFrame(present - 1)}>
            Previous
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={present >= frames.length - 1} onClick={() => showFrame(present + 1)}>
            Next
          </Button>
          <Button type="button" size="sm" onClick={() => setPresent(null)}>
            Leave
          </Button>
        </div>
      ) : null}
    </div>
  )
}

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { Minus, Plus, RotateCcw } from "lucide-react"
import { type SkyAspect } from "../study/aspects"
import { mazzaroth, skyAngle, stationElement } from "../study/mazzaroth"
import { type SkyHouse } from "../study/houses"
import { bodyGlyph, formatDegree, shortestDelta, type SkyBody, type SkyBodyId } from "../study/skyBodies"
import { Button } from "./ui/button"
import { Tip } from "./ui/tip"

type SkyWheelProps = {
  bodies: SkyBody[]
  aspects: SkyAspect[]
  houses: SkyHouse[]
  ascendant: number | null
  midheaven: number | null
  highlightName: string
  highlightBody: SkyBodyId | null
  onStation: (name: string) => void
  onBody: (id: SkyBodyId) => void
}

const cx = 210
const cy = 210
const rSignOut = 200
const rSignIn = 166
const rHouseIn = 136
const rPlanet = 148
const rAspect = 118
const rHouseLabel = 158
const rTickOuter = 206
const rTickMajor = 198
const rTickMinor = 202
const rDegreeLabel = 214

const ZOOM_MIN = 1
const ZOOM_MAX = 2.75
const ZOOM_STEP = 0.25

const elementFill: Record<ReturnType<typeof stationElement>, string> = {
  fire: "url(#sky-el-fire)",
  earth: "url(#sky-el-earth)",
  air: "url(#sky-el-air)",
  water: "url(#sky-el-water)",
}

const bodyBase: Record<SkyBodyId, string> = {
  sun: "#e8b84a",
  moon: "#f4f1ea",
  mercury: "#7d9b86",
  venus: "#d08b84",
  mars: "#c45c4e",
  jupiter: "#c9a06a",
  saturn: "#8a847c",
  uranus: "#6a9eae",
  neptune: "#5b7ea8",
  pluto: "#6b5344",
  node: "#9a7b4f",
  southNode: "#7a6b55",
}

function point(radius: number, longitude: number, rotate: number) {
  const angle = skyAngle(longitude - rotate)
  return { x: cx + radius * Math.cos(angle), y: cy - radius * Math.sin(angle) }
}

function wedge(inner: number, outer: number, start: number, end: number, rotate: number) {
  const a = point(outer, start, rotate)
  const b = point(outer, end, rotate)
  const c = point(inner, end, rotate)
  const d = point(inner, start, rotate)
  return `M ${a.x} ${a.y} A ${outer} ${outer} 0 0 0 ${b.x} ${b.y} L ${c.x} ${c.y} A ${inner} ${inner} 0 0 1 ${d.x} ${d.y} Z`
}

function planetRadius(body: SkyBody, bodies: SkyBody[]) {
  const near = bodies.filter((item) => Math.abs(shortestDelta(item.longitude, body.longitude)) < 7)
  return rPlanet + near.findIndex((item) => item.id === body.id) * 10
}

function clampZoom(value: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value / ZOOM_STEP) * ZOOM_STEP))
}

function chartSignature(bodies: SkyBody[], aspects: SkyAspect[], ascendant: number | null, midheaven: number | null) {
  return [
    ascendant?.toFixed(3) ?? "x",
    midheaven?.toFixed(3) ?? "x",
    aspects.length,
    ...bodies.map((body) => `${body.id}:${body.longitude.toFixed(2)}`),
  ].join("|")
}

export const SkyWheel = forwardRef<SVGSVGElement, SkyWheelProps>(function SkyWheel(
  {
    bodies,
    aspects,
    houses,
    ascendant,
    midheaven,
    highlightName,
    highlightBody,
    onStation,
    onBody,
  },
  ref,
) {
  const rotate = ascendant ?? 0
  const sun = bodies.find((body) => body.id === "sun")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [settle, setSettle] = useState(0)
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const signature = useMemo(
    () => chartSignature(bodies, aspects, ascendant, midheaven),
    [bodies, aspects, ascendant, midheaven],
  )
  const zoomed = zoom > ZOOM_MIN

  useEffect(() => {
    setSettle((n) => n + 1)
  }, [signature])

  const bumpZoom = useCallback((delta: number) => {
    setZoom((current) => {
      const next = clampZoom(current + delta)
      if (next <= ZOOM_MIN) setPan({ x: 0, y: 0 })
      return next
    })
  }, [])

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  /* Ctrl/Cmd+wheel zooms; plain wheel scrolls the page. Non-passive so preventDefault works. */
  useEffect(() => {
    const node = viewportRef.current
    if (!node) return
    const onWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      event.preventDefault()
      const step = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      const next = clampZoom(zoomRef.current + step)
      setZoom(next)
      if (next <= ZOOM_MIN) setPan({ x: 0, y: 0 })
    }
    node.addEventListener("wheel", onWheel, { passive: false })
    return () => node.removeEventListener("wheel", onWheel)
  }, [])

  /* Two-finger pinch zoom for touch (phones/tablets). */
  useEffect(() => {
    const node = viewportRef.current
    if (!node) return
    let startDist = 0
    let startZoom = 1
    const distance = (touches: TouchList) => {
      if (touches.length < 2) return 0
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.hypot(dx, dy)
    }
    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return
      startDist = distance(event.touches)
      startZoom = zoomRef.current
    }
    const onMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || startDist <= 0) return
      event.preventDefault()
      const scale = distance(event.touches) / startDist
      const next = clampZoom(startZoom * scale)
      setZoom(next)
      if (next <= ZOOM_MIN) setPan({ x: 0, y: 0 })
    }
    const onEnd = () => {
      startDist = 0
    }
    node.addEventListener("touchstart", onStart, { passive: true })
    node.addEventListener("touchmove", onMove, { passive: false })
    node.addEventListener("touchend", onEnd)
    node.addEventListener("touchcancel", onEnd)
    return () => {
      node.removeEventListener("touchstart", onStart)
      node.removeEventListener("touchmove", onMove)
      node.removeEventListener("touchend", onEnd)
      node.removeEventListener("touchcancel", onEnd)
    }
  }, [])

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!zoomed || event.button !== 0) return
    drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    const dx = event.clientX - drag.current.x
    const dy = event.clientY - drag.current.y
    setPan({ x: drag.current.panX + dx, y: drag.current.panY + dy })
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    drag.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
  }

  const ticks = Array.from({ length: 72 }, (_, index) => index * 5)
  const layerPct = `${zoom * 100}%`

  return (
    <div className="sky-wheel-stage">
      <div className="sky-wheel-toolbar" role="toolbar" aria-label="Chart zoom">
        <Tip content="Zoom out">
          <Button type="button" size="sm" variant="outline" aria-label="Zoom out" disabled={zoom <= ZOOM_MIN} onClick={() => bumpZoom(-ZOOM_STEP)}>
            <Minus size={14} />
          </Button>
        </Tip>
        <span className="sky-zoom-label" aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
        <Tip content="Zoom in">
          <Button type="button" size="sm" variant="outline" aria-label="Zoom in" disabled={zoom >= ZOOM_MAX} onClick={() => bumpZoom(ZOOM_STEP)}>
            <Plus size={14} />
          </Button>
        </Tip>
        <Tip content="Reset zoom">
          <Button type="button" size="sm" variant="outline" aria-label="Reset zoom" disabled={zoom === 1 && pan.x === 0 && pan.y === 0} onClick={resetView}>
            <RotateCcw size={14} />
          </Button>
        </Tip>
        <small className="quiet">+/− or pinch · Ctrl+scroll · drag to pan when zoomed</small>
      </div>
      <div
        ref={viewportRef}
        className="sky-wheel-viewport sky-wheel-3d"
        data-zoomed={zoomed ? "true" : "false"}
        data-settle={settle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="sky-wheel-depth-plate" aria-hidden="true" />
        <div
          className="sky-wheel-zoom-layer"
          style={{
            width: layerPct,
            height: layerPct,
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
          }}
        >
          <svg
            ref={ref}
            key={settle}
            className="sky-wheel sky-wheel-animated"
            viewBox="-8 -8 436 436"
            role="img"
            aria-label={`Natal wheel, sun in the ${sun ? formatDegree(sun.longitude) : "sky"}`}
          >
            <defs>
              <radialGradient id="sky-paper-grad" cx="36%" cy="28%" r="78%">
                <stop offset="0%" stopColor="#fffefb" />
                <stop offset="42%" stopColor="#f7efe0" />
                <stop offset="100%" stopColor="#e2d3bc" />
              </radialGradient>
              <radialGradient id="sky-hub-grad" cx="42%" cy="38%" r="70%">
                <stop offset="0%" stopColor="#fffdf8" />
                <stop offset="55%" stopColor="#f3e8d6" />
                <stop offset="100%" stopColor="#d9c7a8" />
              </radialGradient>
              <radialGradient id="sky-specular" cx="32%" cy="24%" r="55%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
                <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="sky-el-fire" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f6c994" />
                <stop offset="55%" stopColor="#e09355" />
                <stop offset="100%" stopColor="#b86a35" />
              </linearGradient>
              <linearGradient id="sky-el-earth" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#dfc08a" />
                <stop offset="55%" stopColor="#b8925c" />
                <stop offset="100%" stopColor="#8a6840" />
              </linearGradient>
              <linearGradient id="sky-el-air" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#b8dde8" />
                <stop offset="55%" stopColor="#6aa8bc" />
                <stop offset="100%" stopColor="#457a90" />
              </linearGradient>
              <linearGradient id="sky-el-water" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#aed4b6" />
                <stop offset="55%" stopColor="#5f9a6e" />
                <stop offset="100%" stopColor="#3d6f4c" />
              </linearGradient>
              <linearGradient id="sky-rim-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f0d78a" />
                <stop offset="35%" stopColor="#c9a06a" />
                <stop offset="70%" stopColor="#8f5e24" />
                <stop offset="100%" stopColor="#e8c878" />
              </linearGradient>
              <linearGradient id="sky-bevel-light" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#1c1917" stopOpacity="0.2" />
              </linearGradient>
              <filter id="sky-soft-shadow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#1c1917" floodOpacity="0.28" />
              </filter>
              <filter id="sky-inner-recess" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#1c1917" floodOpacity="0.22" />
              </filter>
              <filter id="sky-body-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#8f5e24" floodOpacity="0.55" />
              </filter>
              {(Object.keys(bodyBase) as SkyBodyId[]).map((id) => (
                <radialGradient key={id} id={`sky-body-${id}`} cx="32%" cy="28%" r="68%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="35%" stopColor={bodyBase[id]} />
                  <stop offset="100%" stopColor={bodyBase[id]} stopOpacity="0.75" />
                </radialGradient>
              ))}
            </defs>

            {/* Ground shadow disk for lift */}
            <ellipse className="sky-ground-shadow" cx={cx + 2} cy={cy + 10} rx="198" ry="188" />

            <circle className="sky-paper" cx={cx} cy={cy} r="208" fill="url(#sky-paper-grad)" filter="url(#sky-soft-shadow)" />
            <circle className="sky-rim" cx={cx} cy={cy} r="208" fill="none" stroke="url(#sky-rim-gold)" strokeWidth="3.2" />
            <circle className="sky-rim-inner" cx={cx} cy={cy} r="204.5" fill="none" stroke="url(#sky-bevel-light)" strokeWidth="1.4" />
            <circle className="sky-house-band" cx={cx} cy={cy} r={rSignIn} />

            <g className="sky-ticks" aria-hidden="true">
              {ticks.map((deg) => {
                const major = deg % 30 === 0
                const ten = deg % 10 === 0
                const outer = point(rTickOuter, deg, rotate)
                const inner = point(major ? rTickMajor : rTickMinor, deg, rotate)
                return (
                  <line
                    key={deg}
                    className={major ? "sky-tick-major" : ten ? "sky-tick-ten" : "sky-tick-minor"}
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                  />
                )
              })}
              {Array.from({ length: 12 }, (_, index) => {
                const deg = index * 30
                const place = point(rDegreeLabel, deg, rotate)
                return (
                  <text
                    key={`deg-${deg}`}
                    className="sky-degree-label"
                    x={place.x}
                    y={place.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {deg}°
                  </text>
                )
              })}
            </g>

            {mazzaroth.map((station, index) => {
              const start = index * 30
              const mid = start + 15
              const label = point((rSignOut + rSignIn) / 2, mid, rotate)
              const on = station.name === highlightName
              return (
                <g key={station.name} className="sky-station" style={{ animationDelay: `${index * 28}ms` }}>
                  <path
                    className="sky-wedge"
                    d={wedge(rSignIn, rSignOut, start, start + 30, rotate)}
                    fill={on ? "#d9b06a" : elementFill[stationElement(index)]}
                    data-on={on ? "true" : "false"}
                    tabIndex={0}
                    role="button"
                    aria-label={`${station.name}, ${station.tribe}`}
                    onClick={() => onStation(station.name)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        onStation(station.name)
                      }
                    }}
                  >
                    <title>{`${station.name} · ${station.tribe} · ${station.latin}`}</title>
                  </path>
                  <text
                    className="sky-station-name"
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={station.name.length > 8 ? 8.5 : 10.5}
                  >
                    {station.name}
                  </text>
                </g>
              )
            })}

            <circle className="sky-ring" cx={cx} cy={cy} r={rSignIn} />
            {(houses.length ? houses : mazzaroth.map((station, index) => ({ n: index + 1, cusp: index * 30, station }))).map((house) => {
              const inner = point(rHouseIn, house.cusp, rotate)
              const outer = point(rSignIn, house.cusp, rotate)
              const label = point(rHouseLabel, house.cusp + 15, rotate)
              return (
                <g key={house.n}>
                  <line className="sky-house" x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />
                  <text className="sky-house-n" x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle">
                    {house.n}
                  </text>
                </g>
              )
            })}

            <circle className="sky-inner" cx={cx} cy={cy} r={rAspect} fill="url(#sky-hub-grad)" filter="url(#sky-inner-recess)" />
            <circle className="sky-hub-ring" cx={cx} cy={cy} r={rAspect} fill="none" />
            <circle className="sky-specular" cx={cx} cy={cy} r={rAspect - 2} fill="url(#sky-specular)" pointerEvents="none" />

            {ascendant != null ? <Axis longitude={ascendant} rotate={rotate} label="AS" kind="asc" /> : null}
            {midheaven != null ? <Axis longitude={midheaven} rotate={rotate} label="MC" kind="mc" /> : null}

            {aspects.map((hit, index) => {
              const a = point(rAspect - 4, hit.left.longitude, rotate)
              const b = point(rAspect - 4, hit.right.longitude, rotate)
              const on = highlightBody != null && (hit.left.id === highlightBody || hit.right.id === highlightBody)
              return (
                <line
                  key={`${hit.left.id}-${hit.right.id}-${hit.kind.id}`}
                  className="sky-aspect sky-aspect-draw"
                  data-kind={hit.kind.id}
                  data-on={on ? "true" : "false"}
                  style={{ animationDelay: `${180 + index * 35}ms` }}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                />
              )
            })}

            {bodies.map((body, index) => {
              const radius = planetRadius(body, bodies)
              const place = point(radius, body.longitude, rotate)
              const degLabel = point(radius + 16, body.longitude, rotate)
              const on = highlightBody === body.id
              const inSign = Math.floor((((body.longitude % 360) + 360) % 360) % 30)
              const minutes = Math.round(((((body.longitude % 360) + 360) % 360) % 30 - inSign) * 60)
              const minutePart = minutes === 60 ? 0 : minutes
              const degreePart = minutes === 60 ? inSign + 1 : inSign
              return (
                <g key={body.id} className="sky-body-group" style={{ animationDelay: `${120 + index * 45}ms` }}>
                  <g
                    className="sky-body"
                    data-id={body.id}
                    data-on={on ? "true" : "false"}
                    data-light={body.id === "sun" || body.id === "moon" ? "true" : "false"}
                    transform={`translate(${place.x} ${place.y})`}
                    filter={on ? "url(#sky-body-glow)" : undefined}
                  >
                    <circle className="sky-body-halo" r={on ? 15 : 12.5} />
                    <circle
                      className="sky-body-orb"
                      r={on ? 11.5 : 10}
                      fill={`url(#sky-body-${body.id})`}
                      onClick={() => onBody(body.id)}
                    >
                      <title>{`${body.name} ${formatDegree(body.longitude)}`}</title>
                    </circle>
                    <text textAnchor="middle" dominantBaseline="middle" onClick={() => onBody(body.id)}>
                      {bodyGlyph[body.id]}
                    </text>
                  </g>
                  <text
                    className="sky-body-degree"
                    data-on={on ? "true" : "false"}
                    x={degLabel.x}
                    y={degLabel.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    onClick={() => onBody(body.id)}
                  >
                    {degreePart}°{String(Math.max(0, minutePart)).padStart(2, "0")}'
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
})

function Axis({ longitude, rotate, label, kind }: { longitude: number; rotate: number; label: string; kind: "asc" | "mc" }) {
  const inner = point(rAspect, longitude, rotate)
  const outer = point(rSignOut + 6, longitude, rotate)
  const tip = point(rSignOut + 18, longitude, rotate)
  return (
    <g className="sky-axis sky-axis-in" data-kind={kind}>
      <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />
      <circle cx={tip.x} cy={tip.y} r="9.5" className="sky-axis-badge" />
      <text x={tip.x} y={tip.y} textAnchor="middle" dominantBaseline="middle">
        {label}
      </text>
    </g>
  )
}

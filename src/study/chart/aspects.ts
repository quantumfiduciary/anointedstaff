import { shortestDelta, type SkyBody } from "./ephemeris"

/** Ptolemaic spans. Public-domain geometry, not a copyrighted aspectarian. */
export const aspectKinds = [
  { id: "conjunction", label: "Together", angle: 0, orb: 8 },
  { id: "sextile", label: "Sixty", angle: 60, orb: 4 },
  { id: "square", label: "Square", angle: 90, orb: 6 },
  { id: "trine", label: "One-twenty", angle: 120, orb: 6 },
  { id: "opposition", label: "Opposite", angle: 180, orb: 8 },
] as const

export type AspectId = (typeof aspectKinds)[number]["id"]

export const aspectMark: Record<AspectId, string> = {
  conjunction: "☌",
  sextile: "⚹",
  square: "□",
  trine: "△",
  opposition: "☍",
}

export type AspectMotion = "applying" | "separating" | "exact"

export type SkyAspect = {
  left: SkyBody
  right: SkyBody
  kind: (typeof aspectKinds)[number]
  delta: number
  orb: number
  motion: AspectMotion
  note: string
}

const notes: Record<AspectId, string> = {
  conjunction: "These two stand in the same stretch of the year. A meeting, not a verdict.",
  sextile: "Sixty degrees — two stations apart. The old tables call this a helping span.",
  square: "A right angle on the wheel. Tension in the geometry, not a ruling over a life.",
  trine: "Four stations apart. An easy span in the old tables.",
  opposition: "Across the wheel, face to face. Genesis 1:14 still only sets them for signs and seasons.",
}

export function findAspects(bodies: SkyBody[]): SkyAspect[] {
  const hits: SkyAspect[] = []
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const separation = shortestDelta(bodies[i].longitude, bodies[j].longitude)
      const delta = Math.abs(separation)
      let best: SkyAspect | null = null
      for (const kind of aspectKinds) {
        const off = Math.abs(delta - kind.angle)
        if (off > kind.orb) continue
        if (!best || off < best.orb) {
          let motion: AspectMotion = "exact"
          if (off >= 0.05) {
            // Sample one day ahead from longitude speeds to label applying vs separating.
            const futureSep = Math.abs(
              shortestDelta(bodies[i].longitude + bodies[i].speed, bodies[j].longitude + bodies[j].speed),
            )
            const futureOff = Math.abs(futureSep - kind.angle)
            motion = futureOff < off - 0.001 ? "applying" : futureOff > off + 0.001 ? "separating" : "exact"
          }
          best = {
            left: bodies[i],
            right: bodies[j],
            kind,
            delta: Math.round(delta * 10) / 10,
            orb: Math.round(off * 10) / 10,
            motion,
            note: notes[kind.id],
          }
        }
      }
      if (best) hits.push(best)
    }
  }
  return hits.sort((a, b) => a.kind.angle - b.kind.angle || a.orb - b.orb || a.delta - b.delta)
}

export function aspectsOf(hits: SkyAspect[], id: string) {
  return hits.filter((hit) => hit.left.id === id || hit.right.id === id)
}

export function otherBody(hit: SkyAspect, id: string) {
  return hit.left.id === id ? hit.right : hit.left
}

export function motionLabel(motion: AspectMotion) {
  if (motion === "applying") return "applying"
  if (motion === "separating") return "separating"
  return "exact"
}

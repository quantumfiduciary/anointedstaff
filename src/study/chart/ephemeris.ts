/**
 * Desk ephemeris: Meeus / VSOP87-lite style formulas in original TypeScript.
 * Target ~arcminute–degree class for modern dates — not Swiss Ephemeris parity.
 */

export type SkyBodyId =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "node"
  | "southNode"

export type SkyBody = {
  id: SkyBodyId
  name: string
  kind: "light" | "wanderer" | "mark"
  longitude: number
  speed: number
  retrograde: boolean
}

export const bodyGlyph: Record<SkyBodyId, string> = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
  node: "☊",
  southNode: "☋",
}

type Orbit = { L0: number; n: number; a: number; e: number; peri: number }

const earth: Orbit = { L0: 100.4645718, n: 0.9856091125, a: 1.000001018, e: 0.01670862, peri: 102.9376819 }

type PlanetId = Exclude<SkyBodyId, "sun" | "moon" | "node" | "southNode">

/** Mean orbital elements near J2000 (deg / AU). Public algorithms, desk-tuned. */
const orbits: Record<PlanetId, Orbit> = {
  mercury: { L0: 252.2503235, n: 4.0923344368, a: 0.38709893, e: 0.20563069, peri: 77.4577963 },
  venus: { L0: 181.9790995, n: 1.60213034, a: 0.72333199, e: 0.00677323, peri: 131.6024672 },
  mars: { L0: 355.433275, n: 0.5240206819, a: 1.52366231, e: 0.09341233, peri: 336.060234 },
  jupiter: { L0: 34.351484, n: 0.0830852942, a: 5.20336301, e: 0.04839266, peri: 14.331309 },
  saturn: { L0: 50.077471, n: 0.0334442282, a: 9.53707032, e: 0.0541506, peri: 93.056787 },
  uranus: { L0: 314.055005, n: 0.0117280343, a: 19.19126393, e: 0.04716771, peri: 170.96424 },
  neptune: { L0: 304.348665, n: 0.0059810921, a: 30.06896348, e: 0.00858587, peri: 44.97135 },
  pluto: { L0: 238.92881, n: 0.003964376, a: 39.48168677, e: 0.24880766, peri: 224.06676 },
}

function wrap(value: number) {
  const next = value % 360
  return next < 0 ? next + 360 : next
}

function rad(value: number) {
  return (value * Math.PI) / 180
}

export function daysFromJ2000(date: Date) {
  return (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000
}

/** Apparent geocentric ecliptic longitude of the Sun (Meeus low-precision). */
export function sunLongitude(days: number) {
  const T = days / 36525
  const mean = wrap(280.46646 + 36000.76983 * T + 0.0003032 * T * T)
  const anomaly = rad(wrap(357.52911 + 35999.05029 * T - 0.0001537 * T * T))
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(anomaly) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * anomaly) +
    0.000289 * Math.sin(3 * anomaly)
  return wrap(mean + C)
}

/** Geocentric ecliptic longitude of the Moon (truncated ELP / Meeus Ch. 47 terms). */
export function moonLongitude(days: number) {
  const T = days / 36525
  const Lp = wrap(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T)
  const D = rad(wrap(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T))
  const M = rad(wrap(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T))
  const Mp = rad(wrap(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T))
  const F = rad(wrap(93.272095 + 483202.0175233 * T - 0.0036539 * T * T))
  const lon =
    Lp +
    6.288774 * Math.sin(Mp) +
    1.274027 * Math.sin(2 * D - Mp) +
    0.658314 * Math.sin(2 * D) +
    0.213618 * Math.sin(2 * Mp) -
    0.185116 * Math.sin(M) -
    0.114332 * Math.sin(2 * F) +
    0.058793 * Math.sin(2 * D - 2 * Mp) +
    0.057066 * Math.sin(2 * D - M - Mp) +
    0.053322 * Math.sin(2 * D + Mp) +
    0.045758 * Math.sin(2 * D - M)
  return wrap(lon)
}

function heliocentric(orbit: Orbit, days: number) {
  const mean = rad(wrap(orbit.L0 - orbit.peri + orbit.n * days))
  let eccentric = mean
  for (let step = 0; step < 8; step += 1) eccentric = mean + orbit.e * Math.sin(eccentric)
  const trueAnomaly =
    (2 *
      Math.atan2(Math.sqrt(1 + orbit.e) * Math.sin(eccentric / 2), Math.sqrt(1 - orbit.e) * Math.cos(eccentric / 2)) *
      180) /
    Math.PI
  const radius = orbit.a * (1 - orbit.e * Math.cos(eccentric))
  const longitude = wrap(orbit.peri + trueAnomaly)
  return {
    longitude,
    x: radius * Math.cos(rad(longitude)),
    y: radius * Math.sin(rad(longitude)),
  }
}

function planetLongitude(id: PlanetId, days: number) {
  const body = heliocentric(orbits[id], days)
  const home = heliocentric(earth, days)
  return wrap((Math.atan2(body.y - home.y, body.x - home.x) * 180) / Math.PI)
}

/** Mean longitude of the ascending (north) lunar node. */
export function nodeLongitude(days: number) {
  const T = days / 36525
  return wrap(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T)
}

export function southNodeLongitude(days: number) {
  return wrap(nodeLongitude(days) + 180)
}

export function shortestDelta(from: number, to: number) {
  let delta = to - from
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return delta
}

const catalog: { id: SkyBodyId; name: string; kind: SkyBody["kind"] }[] = [
  { id: "sun", name: "Sun", kind: "light" },
  { id: "moon", name: "Moon", kind: "light" },
  { id: "mercury", name: "Mercury", kind: "wanderer" },
  { id: "venus", name: "Venus", kind: "wanderer" },
  { id: "mars", name: "Mars", kind: "wanderer" },
  { id: "jupiter", name: "Jupiter", kind: "wanderer" },
  { id: "saturn", name: "Saturn", kind: "wanderer" },
  { id: "uranus", name: "Uranus", kind: "wanderer" },
  { id: "neptune", name: "Neptune", kind: "wanderer" },
  { id: "pluto", name: "Pluto", kind: "wanderer" },
  { id: "node", name: "North Node", kind: "mark" },
  { id: "southNode", name: "South Node", kind: "mark" },
]

export function longitudeOf(id: SkyBodyId, days: number) {
  if (id === "sun") return sunLongitude(days)
  if (id === "moon") return moonLongitude(days)
  if (id === "node") return nodeLongitude(days)
  if (id === "southNode") return southNodeLongitude(days)
  return planetLongitude(id, days)
}

export function castSky(date: Date, includeSouthNode = true): SkyBody[] {
  const days = daysFromJ2000(date)
  const list = includeSouthNode ? catalog : catalog.filter((item) => item.id !== "southNode")
  return list.map((item) => {
    const longitude = longitudeOf(item.id, days)
    const later = longitudeOf(item.id, days + 1)
    const speed = Math.round(shortestDelta(longitude, later) * 1000) / 1000
    return {
      ...item,
      longitude: Math.round(longitude * 100) / 100,
      speed,
      retrograde: item.kind === "wanderer" && speed < -0.02,
    }
  })
}

export function formatDegree(longitude: number) {
  const wrapped = wrap(longitude)
  const whole = Math.floor(wrapped)
  const minutes = Math.round((wrapped - whole) * 60)
  if (minutes === 60) return `${whole + 1}° 00'`
  return `${whole}° ${String(minutes).padStart(2, "0")}'`
}

export const EPHEMERIS_ACCURACY =
  "Anointed Staff sky math (~arcminute–degree for modern dates). Study beside Scripture — the lights keep time; they do not rule a life."

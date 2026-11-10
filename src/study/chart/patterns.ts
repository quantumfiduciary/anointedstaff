/**
 * Natal pattern notes for denser Cast reports — geometry labels, not fortunes.
 */

import { stationAt } from "../mazzaroth"
import { chartBalance } from "../mazzaroth"
import { houseOf } from "./houses"
import type { NatalChart } from "./types"
import { measureArc } from "./circleMeasure"

export type PatternNote = {
  id: string
  title: string
  body: string
}

/** Stelliums, opposition pairs, and simple multi-span clusters. */
export function findAspectPatterns(chart: NatalChart): PatternNote[] {
  const notes: PatternNote[] = []
  const byStation = new Map<string, string[]>()
  for (const body of chart.bodies) {
    const station = stationAt(body.longitude).name
    const list = byStation.get(station) ?? []
    list.push(body.name)
    byStation.set(station, list)
  }
  for (const [station, names] of byStation) {
    if (names.length >= 3) {
      notes.push({
        id: `stellium-${station}`,
        title: `Meeting in the ${station}`,
        body: `${names.join(", ")} share the ${station} station (${names.length} lights). A crowded stretch of the year-clock — study the season, not a fate.`,
      })
    }
  }

  const oppositions = chart.aspects.filter((hit) => hit.kind.id === "opposition")
  for (const hit of oppositions.slice(0, 4)) {
    notes.push({
      id: `opp-${hit.left.id}-${hit.right.id}`,
      title: "Across the wheel",
      body: `${hit.left.name} and ${hit.right.name} face each other (${measureArc(hit.delta).label}, orb ${measureArc(hit.orb).label}). Opposition is geometry — Genesis 1:14 still only sets signs and seasons.`,
    })
  }

  const squares = chart.aspects.filter((hit) => hit.kind.id === "square")
  if (squares.length >= 2 && oppositions.length >= 1) {
    notes.push({
      id: "tension-cluster",
      title: "Right angles on the wheel",
      body: `${squares.length} square spans and ${oppositions.length} opposition(s). Tension in the old tables means a hard angle on the clock, not a ruling over a life.`,
    })
  }

  const trines = chart.aspects.filter((hit) => hit.kind.id === "trine")
  if (trines.length >= 3) {
    notes.push({
      id: "trine-cluster",
      title: "Easy spans",
      body: `${trines.length} one-twenty (trine) spans. Soft geometry on the wheel — still study, never a guarantee.`,
    })
  }

  return notes
}

export function houseListing(chart: NatalChart): string[] {
  if (!chart.houses.length) return ["Houses — none (check birth time and place)."]
  const lines: string[] = []
  for (const house of chart.houses) {
    const guests = chart.bodies.filter((body) => houseOf(body.longitude, chart.houses)?.n === house.n)
    const guestText = guests.length
      ? guests.map((body) => `${body.name}`).join(", ")
      : "empty"
    lines.push(
      `House ${house.n} · cusp ${house.station.name} · ${guestText}`,
    )
  }
  return lines
}

export function balanceListing(chart: NatalChart): string[] {
  const balance = chartBalance(chart.bodies)
  return [
    `Elements · ${balance.elements.map((item) => `${item.id} ${item.percent}%`).join(" · ")}`,
    `Qualities · ${balance.qualities.map((item) => `${item.id} ${item.percent}%`).join(" · ")}`,
  ]
}

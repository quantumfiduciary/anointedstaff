import { motionLabel } from "./aspects"
import { circleStudyBlurb, measureArc } from "./circleMeasure"
import { formatDegree } from "./ephemeris"
import { HOUSE_SYSTEM_LABEL } from "./houses"
import { balanceListing, findAspectPatterns, houseListing } from "./patterns"
import { formatZoneOffset } from "./time"
import type { NatalChart } from "./types"
import { stationAt } from "../mazzaroth"

/** Human report for notes / PDF. */
export function chartReport(chart: NatalChart): string {
  const { subject, bodies, angles, houses, aspects, warnings, meta } = chart
  const sun = bodies.find((body) => body.id === "sun")
  const moon = bodies.find((body) => body.id === "moon")
  const rising = angles.ascendant != null ? stationAt(angles.ascendant) : null
  const when = new Date(meta.utcIso)
  const offset = formatZoneOffset(subject.timeZone, when)

  const bigThree = [
    sun ? `Sun ${formatDegree(sun.longitude)} · ${stationAt(sun.longitude).name} (${stationAt(sun.longitude).tribe})` : "",
    moon ? `Moon ${formatDegree(moon.longitude)} · ${stationAt(moon.longitude).name} (${stationAt(moon.longitude).tribe})` : "",
    rising && angles.ascendant != null
      ? `Rising ${formatDegree(angles.ascendant)} · ${rising.name} (${rising.tribe})`
      : subject.timeUnknown
        ? "Rising — time unknown"
        : "",
  ].filter(Boolean)

  const bodyLines = bodies.map((body) => {
    const station = stationAt(body.longitude)
    const house = houses.length
      ? (() => {
          const start = houses[0].cusp
          const wrapped = ((body.longitude - start) % 360 + 360) % 360
          const n = Math.floor(wrapped / 30) + 1
          return ` · house ${n}`
        })()
      : ""
    return `${body.name} ${formatDegree(body.longitude)} · ${station.name} · ${station.tribe}${house}${body.retrograde ? " · turning back" : ""}`
  })

  const aspectLines = aspects.map(
    (hit) =>
      `${hit.left.name} · ${hit.right.name}: ${hit.kind.label} (${measureArc(hit.delta).label}, orb ${measureArc(hit.orb).label}, ${motionLabel(hit.motion)})`,
  )

  return [
    subject.name ? `${subject.name} · Cast chart` : "Cast chart",
    `${subject.placeLabel} · ${subject.lat}°, ${subject.lon}° · ${subject.timeZone} (${offset})`,
    `${subject.date}${subject.time ? ` ${subject.time}` : " (time unknown)"} · ${HOUSE_SYSTEM_LABEL[subject.houseSystem]} houses`,
    "",
    "Big Three",
    ...bigThree,
    "",
    "Genesis 1:14 sets the lights for signs, seasons, days, and years. Job 38:32 names Mazzaroth in his season.",
    circleStudyBlurb(),
    "",
    "Positions",
    ...bodyLines,
    angles.midheaven != null ? `Midheaven ${formatDegree(angles.midheaven)} · ${stationAt(angles.midheaven).name}` : "",
    "",
    aspects.length ? "Spans on the wheel" : "",
    ...aspectLines,
    "",
    "Balance on the wheel",
    ...balanceListing(chart),
    "",
    "Houses",
    ...houseListing(chart),
    "",
    ...(() => {
      const patterns = findAspectPatterns(chart)
      if (!patterns.length) return []
      return ["Patterns (geometry, not fortune)", ...patterns.map((item) => `· ${item.title}: ${item.body}`)]
    })(),
    "",
    warnings.length ? ["Warnings", ...warnings.map((line) => `· ${line}`)].join("\n") : "",
    "",
    meta.accuracy,
  ]
    .filter((line) => line !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Compact JSON-ish summary for AI chat. */
export function chartStudySummary(chart: NatalChart): string {
  const sun = chart.bodies.find((body) => body.id === "sun")
  const moon = chart.bodies.find((body) => body.id === "moon")
  const rising = chart.angles.ascendant != null ? stationAt(chart.angles.ascendant) : null
  const facts = {
    name: chart.subject.name || null,
    date: chart.subject.date,
    time: chart.subject.timeUnknown ? null : chart.subject.time,
    place: chart.subject.placeLabel,
    timeZone: chart.subject.timeZone,
    houseSystem: chart.subject.houseSystem,
    sun: sun ? { lon: sun.longitude, station: stationAt(sun.longitude).name, tribe: stationAt(sun.longitude).tribe } : null,
    moon: moon ? { lon: moon.longitude, station: stationAt(moon.longitude).name, tribe: stationAt(moon.longitude).tribe } : null,
    rising: rising && chart.angles.ascendant != null ? { lon: chart.angles.ascendant, station: rising.name, tribe: rising.tribe } : null,
    aspects: chart.aspects.slice(0, 12).map((hit) => ({
      a: hit.left.name,
      b: hit.right.name,
      kind: hit.kind.id,
      orb: hit.orb,
      motion: hit.motion,
    })),
    balance: balanceListing(chart),
    houses: houseListing(chart).slice(0, 12),
    patterns: findAspectPatterns(chart).map((item) => ({ title: item.title, body: item.body })),
    warnings: chart.warnings,
    measure: circleStudyBlurb(),
    note: "Desk ephemeris for Scripture study — not a fortune.",
  }
  return JSON.stringify(facts)
}

export function chartMarkdown(chart: NatalChart): string {
  return chartReport(chart)
}

/**
 * Sexagesimal sky measure — Anointed Staff original study copy.
 * Public geometry (360°, 60′, 12×30°) for Cast literacy beside Genesis 1:14.
 * Not a third-party academy lesson and not a fortune table.
 */

import { shortestDelta, type SkyBody } from "./ephemeris"

/** Full ecliptic circle in degrees. */
export const CIRCLE_DEGREES = 360

/** Arc minutes in one degree (base-60). */
export const MINUTES_PER_DEGREE = 60

/** Arc seconds in one minute. */
export const SECONDS_PER_MINUTE = 60

/** Twelve equal stations × 30° each. */
export const STATIONS = 12
export const STATION_WIDTH = 30

/** Arc minutes in the whole zodiac circle (360 × 60). */
export const CIRCLE_ARC_MINUTES = CIRCLE_DEGREES * MINUTES_PER_DEGREE

/**
 * Rough diurnal teaching: 24 hours of clock ↔ 360° of rising.
 * ~4 minutes of clock ≈ 1° at the Ascendant. Approximate — not ephemeris truth.
 */
export const CLOCK_MINUTES_PER_DEGREE = 4
export const HOURS_PER_CIRCLE = 24

export const circleMeasureStance =
  "The wheel is a circle of three hundred sixty degrees. Scripture sets the lights for signs, seasons, days, and years (Genesis 1:14). Measuring angles on that circle is clock literacy — not a ruling over a life (Isaiah 47:13)."

export const circleMeasureLessons = [
  {
    id: "circle",
    title: "Three hundred sixty",
    body: "A full turn of the ecliptic is 360°. That number is the same geometry used for earth’s seasons and the year-clock — not a fortune key.",
  },
  {
    id: "sexagesimal",
    title: "Degrees, minutes, seconds",
    body: "Each degree divides into 60 minutes of arc (′). Each minute into 60 seconds of arc (″). This is distance on the wheel, not the clock on the wall — though both use base sixty.",
  },
  {
    id: "stations",
    title: "Twelve times thirty",
    body: "The year-path is cut into twelve equal stations of 30° each. From 0° to 29° 59′ of a station is one full sign-width. Tribe labels on this desk stay a Scripture study map beside those stations.",
  },
  {
    id: "full-minutes",
    title: "Twenty-one thousand six hundred",
    body: `360° × 60′ = ${CIRCLE_ARC_MINUTES.toLocaleString()} minutes of arc around the whole Mazzaroth wheel. Fine placement of a light is counted in those minutes.`,
  },
  {
    id: "diurnal",
    title: "Day and degree (approximate)",
    body: "Twenty-four hours of clock picture a full 360° of rising at the eastern horizon. A rough teaching rule is about four minutes of clock per one degree of Ascendant motion. Use it to learn the diurnal picture — Cast’s ephemeris still computes the true rising for your place and zone.",
  },
  {
    id: "horizon",
    title: "Horizon points on the wheel",
    body: "On a birth-time wheel, the Ascendant (AS) is the eastern horizon — about the nine-o’clock place if the chart is drawn like a clock. The Descendant sits opposite (west). The Midheaven (MC) is the noon height of the sky. These are place-and-time geometry for study, not a mask or a life map.",
  },
  {
    id: "house-clock",
    title: "House as a clock slice (approximate)",
    body: "Equal houses cut the wheel into twelve 30° slices. A rough diurnal teaching pairs each slice with about two hours of clock as the sky turns. Real rising speeds vary by latitude and season — Cast’s ephemeris stays the authority; this is literacy, not a schedule for shopping or fate.",
  },
  {
    id: "aspects",
    title: "Spans between lights",
    body: "Aspects on this desk are the shortest angular distance between two bodies on the ecliptic. Conjunction, sixty, square, one-twenty, and opposite are geometry labels — meetings on the clock, not verdicts over a birthday.",
  },
  {
    id: "twelves",
    title: "Twelve beside twelve",
    body: "Twelve stations, twelve houses on the Cast wheel, twelve tribes in the camp map — and Scripture names other twelves (apostles, gates, fruits). Rhymes of structure for study. They are not fused into one personality oracle.",
  },
] as const

export type CircleDrill = {
  prompt: string
  answer: string
  options: string[]
  tip: string
}

/** Desk-authored clock drills — not Cozmophyzix homework and not medical VTAP. */
const circleDrillBank: CircleDrill[] = [
  {
    prompt: "About how many clock minutes for one degree of rising at the Ascendant (teaching rule)?",
    answer: "4",
    options: ["1", "4", "15", "60"],
    tip: "Rough diurnal literacy: ~4 minutes of clock ≈ 1°. Cast still computes the true rising.",
  },
  {
    prompt: "About how many clock hours for one equal 30° house slice (teaching rule)?",
    answer: "2",
    options: ["1", "2", "3", "12"],
    tip: "360° ÷ 12 houses ≈ 30°; 24 hours ÷ 12 ≈ 2 hours. Approximate only.",
  },
  {
    prompt: "Where is the Ascendant on a wheel drawn like a clock face?",
    answer: "About 9 o’clock (east)",
    options: ["About 12 o’clock (noon)", "About 9 o’clock (east)", "About 3 o’clock (west)", "About 6 o’clock (nadir)"],
    tip: "AS marks the eastern horizon at the cast time — geometry, not demeanor.",
  },
]

export function makeCircleDrill(except?: string): CircleDrill {
  const pool = circleDrillBank.filter((item) => item.prompt !== except)
  const pick = pool[Math.floor(Math.random() * pool.length)] ?? circleDrillBank[0]
  const options = [...pick.options]
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }
  return { ...pick, options }
}

export type ArcMeasure = {
  degrees: number
  minutes: number
  totalMinutes: number
  label: string
}

/** Format a positive ecliptic span (0–180 typical) as degrees + arc minutes. */
export function measureArc(degrees: number): ArcMeasure {
  const abs = Math.abs(degrees)
  const whole = Math.floor(abs)
  let minutes = Math.round((abs - whole) * MINUTES_PER_DEGREE)
  let deg = whole
  if (minutes === 60) {
    deg += 1
    minutes = 0
  }
  const totalMinutes = Math.round(abs * MINUTES_PER_DEGREE)
  return {
    degrees: deg,
    minutes,
    totalMinutes,
    label: `${deg}° ${String(minutes).padStart(2, "0")}'`,
  }
}

/** Shortest ecliptic arc between two bodies, with sexagesimal label. */
export function arcBetween(left: SkyBody, right: SkyBody): ArcMeasure {
  return measureArc(Math.abs(shortestDelta(left.longitude, right.longitude)))
}

/** Approximate clock minutes for a given Ascendant arc (teaching rule). */
export function clockMinutesForDegrees(degrees: number): number {
  return Math.round(Math.abs(degrees) * CLOCK_MINUTES_PER_DEGREE)
}

export function circleStudyBlurb(): string {
  return [
    circleMeasureStance,
    `Circle ${CIRCLE_DEGREES}° · ${STATIONS}×${STATION_WIDTH}° stations · ${CIRCLE_ARC_MINUTES.toLocaleString()}′ full wheel · ~${CLOCK_MINUTES_PER_DEGREE} min clock ≈ 1° rising (approximate).`,
  ].join(" ")
}

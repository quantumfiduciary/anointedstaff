import { findAspects } from "./aspects"
import { castSky, EPHEMERIS_ACCURACY } from "./ephemeris"
import { ascendantLongitude, buildHouses, midheavenLongitude, ramcDegrees } from "./houses"
import { civilToUtc, julianDay } from "./time"
import type { CastNatalInput, HouseSystem, NatalChart } from "./types"

const MAX_LAT = 66

export function castNatalChart(input: CastNatalInput): NatalChart {
  const timeUnknown = Boolean(input.timeUnknown) || !input.time?.trim()
  const civilTime = timeUnknown ? "12:00" : input.time!.trim()
  const houseSystem: HouseSystem = input.houseSystem ?? "whole-sign"
  const warnings: string[] = []

  if (timeUnknown) {
    warnings.push("Birth time unknown — bodies cast at local noon; ascendant, midheaven, and houses omitted.")
  }

  const when = civilToUtc(input.date, civilTime, input.timeZone)
  const bodies = castSky(when)
  const latOk = Number.isFinite(input.lat) && Math.abs(input.lat) <= MAX_LAT
  const lonOk = Number.isFinite(input.lon)

  if (!latOk) {
    warnings.push(`Latitude must be between ${MAX_LAT}°S and ${MAX_LAT}°N to raise an ascendant.`)
  }
  if (!lonOk) {
    warnings.push("Longitude is required for houses and angles.")
  }

  let ascendant: number | null = null
  let midheaven: number | null = null
  let ramc: number | null = null
  let houses: NatalChart["houses"] = []

  if (!timeUnknown && latOk && lonOk) {
    ascendant = Math.round(ascendantLongitude(when, input.lat, input.lon) * 100) / 100
    midheaven = Math.round(midheavenLongitude(when, input.lon) * 100) / 100
    ramc = Math.round(ramcDegrees(when, input.lon) * 100) / 100
    houses = buildHouses(ascendant, houseSystem)
  }

  const aspects = findAspects(bodies)

  return {
    subject: {
      name: input.name?.trim() ?? "",
      date: input.date,
      time: timeUnknown ? "" : civilTime,
      timeUnknown,
      placeId: input.placeId ?? "custom",
      placeLabel: input.placeLabel ?? "Custom",
      lat: input.lat,
      lon: input.lon,
      timeZone: input.timeZone,
      houseSystem,
    },
    bodies,
    angles: { ascendant, midheaven, ramc },
    houses,
    aspects,
    warnings,
    meta: {
      engine: "anointed-staff-desk",
      accuracy: EPHEMERIS_ACCURACY,
      utcIso: when.toISOString(),
      julianDay: Math.round(julianDay(when) * 1e6) / 1e6,
      castAt: new Date().toISOString(),
    },
  }
}

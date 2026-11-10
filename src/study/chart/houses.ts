import { daysFromJ2000 } from "./ephemeris"
import { stationAt, type MazzarothStation } from "../mazzaroth"
import type { HouseSystem } from "./types"

export type SkyHouse = {
  n: number
  cusp: number
  station: MazzarothStation
}

export type EarthPlace = {
  id: string
  label: string
  lat: number
  lon: number
  /** IANA timezone. */
  timeZone: string
  /** Legacy fixed offset hours (approx standard time). Kept for migration. */
  tz: number
}

/** Named places so a chart can be cast without a gazetteer. */
export const earthPlaces: EarthPlace[] = [
  { id: "jerusalem", label: "Jerusalem", lat: 31.778, lon: 35.235, timeZone: "Asia/Jerusalem", tz: 2 },
  { id: "rome", label: "Rome", lat: 41.902, lon: 12.453, timeZone: "Europe/Rome", tz: 1 },
  { id: "alexandria", label: "Alexandria", lat: 31.2, lon: 29.919, timeZone: "Africa/Cairo", tz: 2 },
  { id: "london", label: "London", lat: 51.508, lon: -0.128, timeZone: "Europe/London", tz: 0 },
  { id: "newyork", label: "New York", lat: 40.713, lon: -74.006, timeZone: "America/New_York", tz: -5 },
  { id: "liverpool", label: "Liverpool", lat: 53.408, lon: -2.992, timeZone: "Europe/London", tz: 0 },
]

function wrap(value: number) {
  const next = value % 360
  return next < 0 ? next + 360 : next
}

/** Greenwich mean sidereal time in hours. IAU linear form. */
export function greenwichSiderealHours(date: Date) {
  const days = daysFromJ2000(date)
  const hours = 18.697374558 + 24.06570982441908 * days
  return ((hours % 24) + 24) % 24
}

export function localSiderealHours(date: Date, lonEast: number) {
  return (((greenwichSiderealHours(date) + lonEast / 15) % 24) + 24) % 24
}

export function ramcDegrees(date: Date, lonEast: number) {
  return wrap(localSiderealHours(date, lonEast) * 15)
}

/**
 * Ecliptic longitude of the eastern horizon.
 * tan λ = cos θ / (−sin θ cos ε − tan φ sin ε), with θ the RAMC.
 */
export function ascendantLongitude(date: Date, lat: number, lonEast: number) {
  const ramc = ramcDegrees(date, lonEast)
  const epsilon = (23.4392911 * Math.PI) / 180
  const theta = (ramc * Math.PI) / 180
  const phi = (lat * Math.PI) / 180
  const y = Math.cos(theta)
  const x = -(Math.sin(theta) * Math.cos(epsilon) + Math.tan(phi) * Math.sin(epsilon))
  return wrap((Math.atan2(y, x) * 180) / Math.PI)
}

/** Ecliptic longitude of the midheaven. tan λ = sin θ / (cos θ cos ε). */
export function midheavenLongitude(date: Date, lonEast: number) {
  const ramc = ramcDegrees(date, lonEast)
  const epsilon = (23.4392911 * Math.PI) / 180
  const theta = (ramc * Math.PI) / 180
  return wrap((Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(epsilon)) * 180) / Math.PI)
}

/** Whole-sign houses from the sign that holds the ascendant. */
export function wholeSignHouses(ascendant: number): SkyHouse[] {
  const start = Math.floor(wrap(ascendant) / 30) * 30
  return Array.from({ length: 12 }, (_, index) => {
    const cusp = wrap(start + index * 30)
    return { n: index + 1, cusp, station: stationAt(cusp) }
  })
}

/** Equal houses: twelve equal 30° segments from the exact ascendant. */
export function equalHouses(ascendant: number): SkyHouse[] {
  const start = wrap(ascendant)
  return Array.from({ length: 12 }, (_, index) => {
    const cusp = wrap(start + index * 30)
    return { n: index + 1, cusp, station: stationAt(cusp) }
  })
}

export function buildHouses(ascendant: number, system: HouseSystem): SkyHouse[] {
  return system === "equal" ? equalHouses(ascendant) : wholeSignHouses(ascendant)
}

export function houseOf(longitude: number, houses: SkyHouse[]) {
  if (!houses.length) return null
  const start = houses[0].cusp
  const index = Math.floor(wrap(longitude - start) / 30) % 12
  return houses[index] ?? houses[0]
}

export function parseCoord(raw: string) {
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

export const HOUSE_SYSTEM_LABEL: Record<HouseSystem, string> = {
  "whole-sign": "Whole Sign",
  equal: "Equal",
}

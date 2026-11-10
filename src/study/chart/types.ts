import type { SkyAspect } from "../aspects"
import type { SkyHouse } from "../houses"
import type { SkyBody } from "../skyBodies"

export type HouseSystem = "whole-sign" | "equal"

export type ChartSubject = {
  name: string
  date: string
  /** Local civil time HH:MM, or empty when time is unknown. */
  time: string
  timeUnknown: boolean
  placeId: string
  placeLabel: string
  lat: number
  lon: number
  /** IANA timezone, e.g. Asia/Jerusalem. */
  timeZone: string
  houseSystem: HouseSystem
}

export type ChartAngles = {
  ascendant: number | null
  midheaven: number | null
  ramc: number | null
}

export type ChartMeta = {
  engine: "anointed-staff-desk"
  accuracy: string
  utcIso: string
  julianDay: number
  castAt: string
}

export type NatalChart = {
  subject: ChartSubject
  bodies: SkyBody[]
  angles: ChartAngles
  houses: SkyHouse[]
  aspects: SkyAspect[]
  warnings: string[]
  meta: ChartMeta
}

export type CastNatalInput = {
  name?: string
  date: string
  time?: string
  timeUnknown?: boolean
  placeId?: string
  placeLabel?: string
  lat: number
  lon: number
  timeZone: string
  houseSystem?: HouseSystem
}

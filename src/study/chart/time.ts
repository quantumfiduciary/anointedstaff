/** Civil date + IANA timezone → UTC via Intl (DST-aware). No AGPL deps. */

function pad(value: number) {
  return String(value).padStart(2, "0")
}

/** Offset of `timeZone` east of UTC at `instant`, in milliseconds. */
export function zoneOffsetMs(timeZone: string, instant: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
  const parts = Object.fromEntries(
    dtf
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  )
  return asUtc - instant.getTime()
}

/**
 * Interpret civil wall time in an IANA zone as a UTC instant.
 * Two-pass correction handles most DST edges.
 */
export function civilToUtc(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = date.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  if (![year, month, day, hour, minute].every(Number.isFinite)) return new Date()
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0)
  let offset = zoneOffsetMs(timeZone, new Date(utcMs))
  utcMs = Date.UTC(year, month - 1, day, hour, minute, 0) - offset
  offset = zoneOffsetMs(timeZone, new Date(utcMs))
  utcMs = Date.UTC(year, month - 1, day, hour, minute, 0) - offset
  return new Date(utcMs)
}

/** Format a UTC instant as civil date/time in an IANA zone. */
export function utcToCivil(instant: Date, timeZone: string): { date: string; time: string } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
  const parts = Object.fromEntries(
    dtf
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour.padStart(2, "0")}:${parts.minute.padStart(2, "0")}`,
  }
}

export function stampDate(day: Date) {
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`
}

export function stampTime(day: Date) {
  return `${pad(day.getHours())}:${pad(day.getMinutes())}`
}

export function shiftCivilDate(date: string, days: number) {
  const day = new Date(`${date}T12:00:00`)
  day.setDate(day.getDate() + days)
  return stampDate(day)
}

export function shiftCivilMonth(date: string, months: number) {
  const day = new Date(`${date}T12:00:00`)
  day.setMonth(day.getMonth() + months)
  return stampDate(day)
}

export function weekdayOf(date: string) {
  const day = new Date(`${date}T12:00:00`)
  return Number.isNaN(day.getTime()) ? "" : day.toLocaleDateString(undefined, { weekday: "long" })
}

/** Julian Day Number (UT) for ephemeris formulas. */
export function julianDay(instant: Date) {
  return instant.getTime() / 86400000 + 2440587.5
}

export function formatZoneOffset(timeZone: string, instant: Date) {
  const hours = zoneOffsetMs(timeZone, instant) / 3600000
  const sign = hours >= 0 ? "+" : "−"
  const abs = Math.abs(hours)
  const h = Math.floor(abs)
  const m = Math.round((abs - h) * 60)
  return m ? `UTC${sign}${h}:${pad(m)}` : `UTC${sign}${h}`
}

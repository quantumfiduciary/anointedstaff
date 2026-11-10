import { useEffect, useMemo, useRef, useState } from "react"
import { Bookmark, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, FileImage, FileText, ScrollText, Search, Sparkles } from "lucide-react"
import {
  arcBetween,
  aspectMark,
  aspectsOf,
  castNatalChart,
  chartReport,
  chartStudySummary,
  CIRCLE_ARC_MINUTES,
  CIRCLE_DEGREES,
  circleMeasureLessons,
  makeCircleDrill,
  circleMeasureStance,
  CLOCK_MINUTES_PER_DEGREE,
  clockMinutesForDegrees,
  deleteChart,
  duplicateChart,
  earthPlaces,
  exportChartPdf,
  exportChartPng,
  exportChartSvg,
  findAspectPatterns,
  formatDegree,
  formatZoneOffset,
  houseListing,
  HOUSE_SYSTEM_LABEL,
  houseOf,
  measureArc,
  migrateLegacyCast,
  motionLabel,
  otherBody,
  parseCoord,
  readActiveChartId,
  readChartLibrary,
  renameChart,
  searchPlaces,
  shiftCivilDate,
  shiftCivilMonth,
  stampDate,
  stampTime,
  STATION_WIDTH,
  STATIONS,
  upsertChart,
  utcToCivil,
  weekdayOf,
  writeActiveChartId,
  type GeocodeHit,
  type HouseSystem,
  type NatalChart,
  type SavedChart,
  type SkyBodyId,
} from "../study/chart/index"
import {
  campCenter,
  campSides,
  cherubCampStance,
  cherubCampTypology,
  jobPerseverance,
  jobSky,
  jobStarNames,
  lightsMatching,
  psalmSky,
} from "../study/heavens"
import { scriptureTwelves } from "../study/scriptureTwelves"
import { letterMatrix, matrixCaption } from "../study/letterMatrix"
import { confirmLeaveDevice } from "../settings"
import { bodiesIn, chartBalance, mazzaroth, stationAt, stationDegree, type MazzarothStation } from "../study/mazzaroth"
import { decansStudyStance, stationDecanCatalog } from "../study/mazzarothDecans"
import { mazzarothStudyStance, stationCivilSpan, witnessForStation, witnessSteps } from "../study/mazzarothWitness"
import { bodyGlyph } from "../study/skyBodies"
import { sefirot, sefirotCaption } from "../study/sefirot"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Tip } from "./ui/tip"
import { SkyWheel } from "./SkyWheel"

type HeavensPaneProps = {
  query: string
  verseLabel: string | null
  onOpen: (ref: string) => void
  onStudy: (summary: string) => void
  onSave?: (label: string, text: string, tags: string[]) => void
  onSearchOutside?: (query: string) => void
}

type Pick = { kind: "station"; name: string } | { kind: "body"; id: SkyBodyId }
type SkyMode = "sky" | "chart" | "matrix" | "calendar"

const birthKey = "anointed-staff.sky-birth"
const castKey = "anointed-staff.sky-cast"

const commonZones = [
  "Asia/Jerusalem",
  "Europe/Rome",
  "Africa/Cairo",
  "Europe/London",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
]

const bodyReadings: Record<SkyBodyId, { ref: string; line: string }> = {
  sun: { ref: "Psalm 19:4", line: "In them hath he set a tabernacle for the sun." },
  moon: { ref: "Psalm 104:19", line: "He appointed the moon for seasons: the sun knoweth his going down." },
  mercury: { ref: "Genesis 1:14", line: "Let them be for signs, and for seasons, and for days, and years." },
  venus: { ref: "Genesis 1:16", line: "He made the stars also." },
  mars: { ref: "Genesis 1:14", line: "Let them be for signs, and for seasons, and for days, and years." },
  jupiter: { ref: "Job 38:33", line: "Knowest thou the ordinances of heaven?" },
  saturn: { ref: "Job 38:33", line: "Knowest thou the ordinances of heaven?" },
  uranus: { ref: "Job 38:33", line: "Knowest thou the ordinances of heaven? canst thou set the dominion thereof in the earth?" },
  neptune: { ref: "Genesis 1:14", line: "Let them be for signs, and for seasons, and for days, and years." },
  pluto: { ref: "Job 38:31", line: "Canst thou bind the sweet influences of Pleiades, or loose the bands of Orion?" },
  node: { ref: "Job 38:32", line: "Canst thou bring forth Mazzaroth in his season?" },
  southNode: { ref: "Job 38:32", line: "Canst thou bring forth Mazzaroth in his season?" },
}

const tools = [
  { id: "stations", label: "Stations", hint: "Twelve sun stations and tribes" },
  { id: "witness", label: "Witness", hint: "Virgin→Lion Scripture path" },
  { id: "decans", label: "Decans", hint: "Thirty-six figures beside stations" },
  { id: "circle", label: "Circle", hint: "360°, minutes, diurnal degree" },
  { id: "camp", label: "Camp", hint: "Israel’s camp around the tent" },
  { id: "job", label: "Job 38", hint: "Ordinances of heaven" },
  { id: "psalm", label: "Psalm 19", hint: "The heavens declare" },
  { id: "lights", label: "Lights", hint: "Sun, moon, and signs" },
  { id: "sefirot", label: "Sefirot", hint: "Tree of the sefirot" },
  { id: "beginnings", label: "Beginnings", hint: "Genesis 1:14 and first lights" },
] as const

const modes: { id: SkyMode; label: string }[] = [
  { id: "chart", label: "Cast" },
  { id: "sky", label: "Sky" },
  { id: "matrix", label: "Letters" },
  { id: "calendar", label: "Calendar" },
]

function readBirth() {
  try {
    const saved = JSON.parse(localStorage.getItem(birthKey) ?? "null") as {
      name?: string
      date?: string
      time?: string
      timeUnknown?: boolean
      place?: string
      placeLabel?: string
      lat?: string
      lon?: string
      tz?: string
      timeZone?: string
      houseSystem?: HouseSystem
    } | null
    return saved
  } catch {
    return null
  }
}

function migrateZone(saved: ReturnType<typeof readBirth>) {
  if (saved?.timeZone) return saved.timeZone
  const place = earthPlaces.find((item) => item.id === saved?.place)
  if (place) return place.timeZone
  const hours = Number(saved?.tz)
  if (Number.isFinite(hours)) {
    const match = earthPlaces.find((item) => item.tz === hours)
    if (match) return match.timeZone
  }
  return "Asia/Jerusalem"
}

export function HeavensPane({ query, verseLabel, onOpen, onStudy, onSave, onSearchOutside }: HeavensPaneProps) {
  const saved = readBirth()
  const [name, setName] = useState(() => saved?.name ?? "")
  const [date, setDate] = useState(() => saved?.date ?? stampDate(new Date()))
  const [time, setTime] = useState(() => saved?.time ?? stampTime(new Date()))
  const [timeUnknown, setTimeUnknown] = useState(() => Boolean(saved?.timeUnknown))
  const [placeId, setPlaceId] = useState(saved?.place ?? "jerusalem")
  const [customPlaceLabel, setCustomPlaceLabel] = useState(() => {
    if (saved?.place === "custom" && saved.placeLabel?.trim()) return saved.placeLabel.trim()
    return ""
  })
  const [placeQuery, setPlaceQuery] = useState("")
  const [placeHits, setPlaceHits] = useState<GeocodeHit[]>([])
  const [placeSearchBusy, setPlaceSearchBusy] = useState(false)
  const [placeSearchError, setPlaceSearchError] = useState<string | null>(null)
  const [lat, setLat] = useState(saved?.lat ?? String(earthPlaces[0].lat))
  const [lon, setLon] = useState(saved?.lon ?? String(earthPlaces[0].lon))
  const [timeZone, setTimeZone] = useState(() => migrateZone(saved))
  const [houseSystem, setHouseSystem] = useState<HouseSystem>(() => saved?.houseSystem ?? "whole-sign")
  const [library, setLibrary] = useState<SavedChart[]>(() => migrateLegacyCast())
  const [activeChartId, setActiveChartId] = useState<string | null>(() => readActiveChartId())
  const [cast, setCast] = useState<NatalChart | null>(() => {
    const lib = migrateLegacyCast()
    const active = readActiveChartId()
    const fromLib = lib.find((item) => item.id === active) ?? lib[0]
    if (fromLib) return fromLib.chart
    try {
      return JSON.parse(localStorage.getItem(castKey) ?? "null") as NatalChart | null
    } catch {
      return null
    }
  })
  const [castFlash, setCastFlash] = useState(false)
  const [pick, setPick] = useState<Pick | null>(null)
  const [mode, setMode] = useState<SkyMode>("chart")
  const [matrixId, setMatrixId] = useState("center")
  const [tool, setTool] = useState<(typeof tools)[number]["id"] | null>(null)
  const [timeline, setTimeline] = useState<{ year: number | null; era: string; event: string }[] | null>(null)
  const [calKit, setCalKit] = useState<{ title: string; credit: string; yearFromAdam?: number; civilSpan?: string; months: { id: string; title: string; yearFromAdam?: number | null }[] } | null>(null)
  const [timelineFilter, setTimelineFilter] = useState("")
  const [tribeOverlay, setTribeOverlay] = useState(true)
  const [circleDrill, setCircleDrill] = useState(() => makeCircleDrill())
  const [circleDrillPick, setCircleDrillPick] = useState<string | null>(null)
  const wheelRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (mode !== "calendar") return
    let cancel = false
    if (!timeline) {
      fetch("/timeline/bible-v12.json")
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { events?: { year: number | null; era: string; event: string }[] } | null) => {
          if (!cancel && data?.events) setTimeline(data.events)
        })
        .catch(() => undefined)
    }
    if (!calKit) {
      fetch("/calendar/kit-6228.json")
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (!cancel && data) setCalKit(data)
        })
        .catch(() => undefined)
    }
    return () => {
      cancel = true
    }
  }, [mode, timeline, calKit])

  const latitude = parseCoord(lat) ?? earthPlaces[0].lat
  const longitude = parseCoord(lon) ?? earthPlaces[0].lon
  const place = earthPlaces.find((item) => item.id === placeId)
  const placeLabel = place?.label ?? (customPlaceLabel.trim() || "Custom")

  const liveChart = useMemo(
    () =>
      castNatalChart({
        name,
        date,
        time: timeUnknown ? undefined : time,
        timeUnknown,
        placeId,
        placeLabel,
        lat: latitude,
        lon: longitude,
        timeZone,
        houseSystem,
      }),
    [name, date, time, timeUnknown, placeId, placeLabel, latitude, longitude, timeZone, houseSystem],
  )

  const chart = mode === "chart" && cast ? cast : liveChart
  const bodies = chart.bodies
  const aspects = chart.aspects
  const houses = chart.houses
  const ascendant = chart.angles.ascendant
  const midheaven = chart.angles.midheaven
  const lights = lightsMatching(query)
  const sun = bodies.find((body) => body.id === "sun") ?? bodies[0]
  const sunStation = stationAt(sun.longitude)
  const balance = useMemo(() => chartBalance(bodies), [bodies])
  const matrix = useMemo(() => letterMatrix(date), [date])
  const matrixNode = matrix.find((node) => node.id === matrixId) ?? matrix[0]
  const zoneLabel = formatZoneOffset(chart.subject.timeZone, new Date(chart.meta.utcIso))

  useEffect(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length < 3) return
    const station = mazzaroth.find((item) =>
      `${item.name} ${item.latin} ${item.tribe} ${item.meaning}`.toLowerCase().includes(needle),
    )
    if (station) {
      setPick({ kind: "station", name: station.name })
      return
    }
    const body = bodies.find((item) => item.name.toLowerCase() === needle)
    if (body) setPick({ kind: "body", id: body.id })
  }, [query, bodies])

  useEffect(() => {
    localStorage.setItem(
      birthKey,
      JSON.stringify({
        name,
        date,
        time,
        timeUnknown,
        place: placeId,
        placeLabel: placeId === "custom" ? placeLabel : undefined,
        lat,
        lon,
        timeZone,
        houseSystem,
      }),
    )
  }, [name, date, time, timeUnknown, placeId, placeLabel, lat, lon, timeZone, houseSystem])

  const selectedStation = pick?.kind === "station" ? mazzaroth.find((item) => item.name === pick.name) ?? sunStation : sunStation
  const selectedBody = pick?.kind === "body" ? bodies.find((item) => item.id === pick.id) ?? sun : sun
  const selectedBodyStation = stationAt(selectedBody.longitude)
  const guests = bodiesIn(selectedStation, bodies)
  const selectedAspects =
    pick?.kind === "body"
      ? aspectsOf(aspects, selectedBody.id)
      : aspects.filter(
          (hit) =>
            stationAt(hit.left.longitude).name === selectedStation.name ||
            stationAt(hit.right.longitude).name === selectedStation.name,
        )
  const selectedHouse = houses.length
    ? houseOf(
        pick?.kind === "body" ? selectedBody.longitude : mazzaroth.findIndex((item) => item.name === selectedStation.name) * 30 + 15,
        houses,
      )
    : null

  function jumpHour(hours: number) {
    if (timeUnknown) return
    const next = new Date(new Date(liveChart.meta.utcIso).getTime() + hours * 3600000)
    const civil = utcToCivil(next, timeZone)
    setDate(civil.date)
    setTime(civil.time)
    setCast(null)
  }

  function setClockTo(station: MazzarothStation) {
    setDate(`${date.slice(0, 4)}-${station.start}`)
    setTime("12:00")
    setTimeUnknown(false)
    setPick({ kind: "station", name: station.name })
    setCast(null)
  }

  function choosePlace(id: string) {
    const next = earthPlaces.find((item) => item.id === id)
    setPlaceId(id)
    setPlaceHits([])
    setPlaceSearchError(null)
    if (!next) {
      setCast(null)
      return
    }
    setCustomPlaceLabel("")
    setPlaceQuery("")
    setLat(String(next.lat))
    setLon(String(next.lon))
    setTimeZone(next.timeZone)
    setCast(null)
  }

  async function runPlaceSearch() {
    const needle = placeQuery.trim()
    if (needle.length < 2) {
      setPlaceSearchError("Type at least two letters of a city or place.")
      return
    }
    if (
      !confirmLeaveDevice(
        "nominatim",
        "Send this place name to OpenStreetMap Nominatim to look up coordinates?\n\nThis leaves the device. Cancel and enter Lat/Lon yourself to stay offline.",
      )
    ) {
      return
    }
    setPlaceSearchBusy(true)
    setPlaceSearchError(null)
    try {
      const hits = await searchPlaces(needle)
      setPlaceHits(hits)
      if (!hits.length) setPlaceSearchError("No places matched. Try another spelling, or enter Lat/Lon.")
    } catch {
      setPlaceHits([])
      setPlaceSearchError("Place search needs the network (OpenStreetMap Nominatim). Check connection, or enter Lat/Lon.")
    } finally {
      setPlaceSearchBusy(false)
    }
  }

  function applyPlaceHit(hit: GeocodeHit) {
    setPlaceId("custom")
    setCustomPlaceLabel(hit.label)
    setPlaceQuery(hit.label.split(",")[0]?.trim() || hit.label)
    setLat(String(hit.lat))
    setLon(String(hit.lon))
    setPlaceHits([])
    setPlaceSearchError(null)
    setCast(null)
  }

  function applySubject(chart: NatalChart) {
    const sub = chart.subject
    setName(sub.name)
    setDate(sub.date)
    setTime(sub.time || "12:00")
    setTimeUnknown(sub.timeUnknown)
    const id = sub.placeId || "custom"
    setPlaceId(id)
    setCustomPlaceLabel(id === "custom" ? sub.placeLabel || "" : "")
    setPlaceQuery(id === "custom" ? sub.placeLabel || "" : "")
    setPlaceHits([])
    setLat(String(sub.lat))
    setLon(String(sub.lon))
    setTimeZone(sub.timeZone)
    setHouseSystem(sub.houseSystem)
  }

  function loadSaved(entry: SavedChart) {
    applySubject(entry.chart)
    setCast(entry.chart)
    setActiveChartId(entry.id)
    writeActiveChartId(entry.id)
    localStorage.setItem(castKey, JSON.stringify(entry.chart))
    setMode("chart")
    setCastFlash(true)
    window.setTimeout(() => setCastFlash(false), 1200)
  }

  function runCast() {
    const next = castNatalChart({
      name,
      date,
      time: timeUnknown ? undefined : time,
      timeUnknown,
      placeId,
      placeLabel,
      lat: latitude,
      lon: longitude,
      timeZone,
      houseSystem,
    })
    const saved = upsertChart(next, { id: activeChartId ?? undefined })
    setCast(next)
    setLibrary(readChartLibrary())
    setActiveChartId(saved.id)
    setCastFlash(true)
    void import("../lib/uiSound").then(({ playUi }) => playUi("ok"))
    window.setTimeout(() => setCastFlash(false), 1600)
  }

  function saveAsNewChart() {
    if (!cast && !liveChart) return
    const source = cast ?? liveChart
    const saved = upsertChart(source)
    setLibrary(readChartLibrary())
    setActiveChartId(saved.id)
    setCast(source)
    setCastFlash(true)
    window.setTimeout(() => setCastFlash(false), 1200)
  }

  const rising = ascendant != null ? stationAt(ascendant) : null
  const midheavenStation = midheaven != null ? stationAt(midheaven) : null
  const moon = bodies.find((body) => body.id === "moon")
  const moonStation = moon ? stationAt(moon.longitude) : null
  const birthTitle = name.trim() || (rising ? `Rising in the ${rising.name}` : `Sun in the ${sunStation.name}`)
  const caption = mode === "matrix" ? matrixCaption(date, matrix) : chartReport(chart)
  const patternNotes = useMemo(() => findAspectPatterns(chart), [chart])
  const houseLines = useMemo(() => houseListing(chart), [chart])
  const focusStation = pick?.kind === "body" ? selectedBodyStation : selectedStation
  const outsideNeedle = focusStation.tribe.length >= 4 ? focusStation.tribe : focusStation.latin
  const highlightName = pick?.kind === "station" ? pick.name : selectedBodyStation.name
  const highlightBody = pick?.kind === "body" ? pick.id : null

  return (
    <div className="heavens">
      <header className="sky-head">
        <img className="sky-atmosphere" src="/brand/heavens-sky.png" alt="" aria-hidden="true" />
        <div>
          <Badge>
            {mode === "chart" ? "Cast chart" : mode === "matrix" ? "Letters" : mode === "calendar" ? "Calendar" : "Mazzaroth"}
          </Badge>
          <h2>
            {mode === "matrix"
              ? `Letter matrix · ${date}`
              : mode === "calendar"
                ? calKit?.title ?? "Biblical calendar"
                : birthTitle}
          </h2>
          <p>
            {mode === "matrix"
              ? `${matrixNode.lesson.glyph} ${matrixNode.lesson.name} at the ${matrixNode.label.toLowerCase()}. A date count, not a fortune.`
              : mode === "calendar"
                ? `${calKit?.civilSpan ?? "Study calendar"} · Year ${calKit?.yearFromAdam ?? "—"} from Adam. Timelines are study aids, not prophecy clocks.`
                : `${placeLabel} · ${date}${timeUnknown ? " (time unknown)" : ` ${time}`} · ${timeZone} · Sun ${formatDegree(sun.longitude)} in the ${sunStation.name}${rising ? ` · AS ${formatDegree(ascendant!)} ${rising.name}` : ""}${midheaven != null && midheavenStation ? ` · MC ${formatDegree(midheaven)} ${midheavenStation.name}` : ""}.${verseLabel ? ` Beside ${verseLabel}.` : ""}`}
          </p>
        </div>
        <div className="sky-modes" role="tablist" aria-label="Heavens mode">
          {modes.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={mode === item.id} onClick={() => setMode(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        {mode === "calendar" ? (
          <section className="heavens-calendar sky-block" aria-label="Biblical calendar and timeline">
            {calKit ? (
              <>
                <p className="quiet">{calKit.credit}</p>
                <div className="kit-months" aria-label="Months in the kit">
                  {calKit.months.map((month) => (
                    <span key={month.id} className="chip">
                      {month.title}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="quiet">Loading calendar kit…</p>
            )}
            <label className="setting-field">
              Search the timeline
              <Input value={timelineFilter} placeholder="Flood, Abraham, Exodus…" onChange={(event) => setTimelineFilter(event.target.value)} />
            </label>
            <ul className="timeline-list">
              {(timeline ?? [])
                .filter((item) => {
                  const needle = timelineFilter.trim().toLowerCase()
                  if (!needle) return true
                  return `${item.event} ${item.era}`.toLowerCase().includes(needle)
                })
                .slice(0, 80)
                .map((item, index) => (
                  <li key={`${item.year}-${item.event}-${index}`}>
                    <b>{item.era || item.year || "—"}</b>
                    <span>{item.event}</span>
                  </li>
                ))}
            </ul>
            <figure className="m-0">
              <img src="/timeline/daniels-week.webp" alt="Daniel’s final week timeline chart" style={{ width: "100%", borderRadius: 12, border: "1px solid var(--line)" }} loading="lazy" />
              <figcaption className="quiet">Daniel’s week chart — a possible scenario study graphic.</figcaption>
            </figure>
            <div className="sky-actions">
              {onSave && calKit ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    onSave(
                      `Calendar · ${calKit.title}`,
                      `${calKit.title}\n${calKit.civilSpan ?? ""}\nYear ${calKit.yearFromAdam ?? "—"} from Adam\n${calKit.months.map((m) => m.title).join(", ")}\n${calKit.credit}`,
                      ["heavens", "calendar"],
                    )
                  }
                >
                  <Bookmark size={14} /> Save calendar note
                </Button>
              ) : null}
              {onSearchOutside ? (
                <Button type="button" size="sm" variant="outline" onClick={() => onSearchOutside("watchmen")}>
                  <ScrollText size={14} /> Watchmen shelf
                </Button>
              ) : null}
            </div>
            <p className="rights">Anointed Staff calendar and timeline shelves · Watchmen (CC0) sits on the Extra-canon hebrew shelf for deeper reading.</p>
          </section>
        ) : null}
        {mode !== "calendar" ? (
          <div className="sky-clock sky-cast-form">
            <label>
              Name
              <Input
                value={name}
                placeholder="Birth name"
                aria-label="Birth name"
                onChange={(event) => {
                  setName(event.target.value)
                  setCast(null)
                }}
              />
            </label>
            <label>
              Date
              <Input
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value)
                  setCast(null)
                }}
              />
            </label>
            <label>
              Time
              <Input
                type="time"
                value={time}
                disabled={timeUnknown}
                onChange={(event) => {
                  setTime(event.target.value)
                  setCast(null)
                }}
              />
            </label>
            <label className="sky-check">
              <input
                type="checkbox"
                checked={timeUnknown}
                onChange={(event) => {
                  setTimeUnknown(event.target.checked)
                  setCast(null)
                }}
              />
              Time unknown
            </label>
            <label>
              Place
              <select
                aria-label="Place"
                value={placeId === "custom" ? "custom" : placeId}
                onChange={(event) => choosePlace(event.target.value)}
              >
                {earthPlaces.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
            </label>
            {placeId === "custom" ? (
              <>
                <label className="sky-place-span">
                  Place name
                  <Input
                    value={customPlaceLabel}
                    aria-label="Custom place name"
                    placeholder="City or place label for the report"
                    onChange={(event) => {
                      setCustomPlaceLabel(event.target.value)
                      setCast(null)
                    }}
                  />
                </label>
                <div className="sky-place-search sky-place-span">
                  <label>
                    Find place
                    <Input
                      value={placeQuery}
                      aria-label="Search city or place"
                      placeholder="Toronto, CA · Bethlehem · your town"
                      onChange={(event) => setPlaceQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          void runPlaceSearch()
                        }
                      }}
                    />
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={placeSearchBusy}
                    onClick={() => void runPlaceSearch()}
                  >
                    <Search size={14} />
                    {placeSearchBusy ? "Searching…" : "Search"}
                  </Button>
                </div>
                {placeSearchError ? <p className="quiet sky-place-span">{placeSearchError}</p> : null}
                {placeHits.length > 0 ? (
                  <ul className="sky-place-hits" aria-label="Place search results">
                    {placeHits.map((hit) => (
                      <li key={`${hit.lat},${hit.lon},${hit.label}`}>
                        <button type="button" onClick={() => applyPlaceHit(hit)}>
                          <strong>{hit.label.split(",")[0]?.trim() || hit.label}</strong>
                          <small>
                            {hit.lat.toFixed(3)}°, {hit.lon.toFixed(3)}° · {hit.label}
                          </small>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="quiet sky-place-span">
                  Search fills Lat/Lon from OpenStreetMap. Then set the IANA time zone to match that place before Cast.
                </p>
              </>
            ) : null}
            <label>
              Lat
              <Input
                value={lat}
                inputMode="decimal"
                aria-label="Latitude"
                onChange={(event) => {
                  setPlaceId("custom")
                  setLat(event.target.value)
                  setCast(null)
                }}
              />
            </label>
            <label>
              Lon
              <Input
                value={lon}
                inputMode="decimal"
                aria-label="Longitude"
                onChange={(event) => {
                  setPlaceId("custom")
                  setLon(event.target.value)
                  setCast(null)
                }}
              />
            </label>
            <label>
              Time zone
              <select
                aria-label="IANA timezone"
                value={commonZones.includes(timeZone) ? timeZone : "custom"}
                onChange={(event) => {
                  if (event.target.value === "custom") return
                  setTimeZone(event.target.value)
                  setCast(null)
                }}
              >
                {commonZones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
                <option value="custom">Custom IANA…</option>
              </select>
            </label>
            {!commonZones.includes(timeZone) ? (
              <label>
                IANA
                <Input
                  value={timeZone}
                  aria-label="Custom IANA timezone"
                  placeholder="America/Toronto"
                  onChange={(event) => {
                    setTimeZone(event.target.value.trim() || "UTC")
                    setCast(null)
                  }}
                />
              </label>
            ) : null}
            <label>
              Houses
              <select
                aria-label="House system"
                value={houseSystem}
                onChange={(event) => {
                  setHouseSystem(event.target.value as HouseSystem)
                  setCast(null)
                }}
              >
                <option value="whole-sign">{HOUSE_SYSTEM_LABEL["whole-sign"]}</option>
                <option value="equal">{HOUSE_SYSTEM_LABEL.equal}</option>
              </select>
            </label>
            {!library.length && !cast ? (
              <p className="quiet sky-first-run">
                Set date and place, then Cast. Lights mark seasons beside Scripture — clocks and glory, not fortunes. Or cast a sample for today at this place.
              </p>
            ) : null}
            <div className="sky-steps" role="group" aria-label="Cast controls">
              <Button type="button" size="sm" onClick={runCast}>
                Cast chart
              </Button>
              {!library.length ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const now = new Date()
                    const y = now.getFullYear()
                    const m = String(now.getMonth() + 1).padStart(2, "0")
                    const d = String(now.getDate()).padStart(2, "0")
                    const hh = String(now.getHours()).padStart(2, "0")
                    const mm = String(now.getMinutes()).padStart(2, "0")
                    const sampleName = name.trim() || "Sample cast"
                    const sampleDate = `${y}-${m}-${d}`
                    const sampleTime = `${hh}:${mm}`
                    setName(sampleName)
                    setDate(sampleDate)
                    setTime(sampleTime)
                    setTimeUnknown(false)
                    const next = castNatalChart({
                      name: sampleName,
                      date: sampleDate,
                      time: sampleTime,
                      timeUnknown: false,
                      placeId,
                      placeLabel,
                      lat: latitude,
                      lon: longitude,
                      timeZone,
                      houseSystem,
                    })
                    const saved = upsertChart(next, { id: activeChartId ?? undefined })
                    setCast(next)
                    setLibrary(readChartLibrary())
                    setActiveChartId(saved.id)
                    setCastFlash(true)
                    void import("../lib/uiSound").then(({ playUi }) => playUi("ok"))
                    window.setTimeout(() => setCastFlash(false), 1600)
                  }}
                >
                  Cast sample
                </Button>
              ) : null}
              <Button type="button" size="sm" variant="outline" onClick={saveAsNewChart}>
                Save as new
              </Button>
              {castFlash ? <Badge>Frozen</Badge> : null}
              {library.length ? (
                <label className="sky-library-pick">
                  Chart library
                  <select
                    aria-label="Saved charts"
                    value={activeChartId ?? ""}
                    onChange={(event) => {
                      const entry = library.find((item) => item.id === event.target.value)
                      if (entry) loadSaved(entry)
                    }}
                  >
                    <option value="" disabled>
                      {library.length} saved
                    </option>
                    {library.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {activeChartId ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const next = window.prompt("Rename chart", library.find((item) => item.id === activeChartId)?.label ?? "")
                      if (next == null) return
                      renameChart(activeChartId, next)
                      setLibrary(readChartLibrary())
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const copy = duplicateChart(activeChartId)
                      if (!copy) return
                      setLibrary(readChartLibrary())
                      loadSaved(copy)
                    }}
                  >
                    Duplicate
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!window.confirm("Remove this chart from the library?\n\nThe cast stays gone unless you cast again.")) return
                      const next = deleteChart(activeChartId)
                      setLibrary(next)
                      if (next[0]) loadSaved(next[0])
                      else {
                        setActiveChartId(null)
                        setCast(null)
                      }
                    }}
                  >
                    Delete
                  </Button>
                </>
              ) : null}
              <Tip content="A month earlier">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="A month earlier"
                  onClick={() => {
                    setDate((value) => shiftCivilMonth(value, -1))
                    setCast(null)
                  }}
                >
                  <ChevronsLeft size={16} />
                </button>
              </Tip>
              <Tip content="A day earlier">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="A day earlier"
                  onClick={() => {
                    setDate((value) => shiftCivilDate(value, -1))
                    setCast(null)
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
              </Tip>
              <Tip content="An hour earlier">
                <button type="button" className="icon-btn" aria-label="An hour earlier" disabled={timeUnknown} onClick={() => jumpHour(-1)}>
                  −1h
                </button>
              </Tip>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const fresh = utcToCivil(new Date(), timeZone)
                  setDate(fresh.date)
                  setTime(fresh.time)
                  setTimeUnknown(false)
                  setCast(null)
                }}
              >
                Now
              </Button>
              <Tip content="An hour later">
                <button type="button" className="icon-btn" aria-label="An hour later" disabled={timeUnknown} onClick={() => jumpHour(1)}>
                  +1h
                </button>
              </Tip>
              <Tip content="A day later">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="A day later"
                  onClick={() => {
                    setDate((value) => shiftCivilDate(value, 1))
                    setCast(null)
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </Tip>
              <Tip content="A month later">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="A month later"
                  onClick={() => {
                    setDate((value) => shiftCivilMonth(value, 1))
                    setCast(null)
                  }}
                >
                  <ChevronsRight size={16} />
                </button>
              </Tip>
            </div>
          </div>
        ) : null}
      </header>

      {mode !== "calendar" ? (
        <div className="tool-rail heavens-tools-top" aria-label="Heavens study tools">
          <p className="tool-rail-label">
            <b>Study tools</b>
            <span>Open a panel under the cast — click again to close</span>
          </p>
          <nav className="segmented gem-nav tool-tabs" aria-label="Heavens tools">
            {tools.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tool === item.id}
                title={item.hint}
                onClick={() => {
                  void import("../lib/uiSound").then(({ playUi }) => playUi("tap"))
                  setTool((current) => (current === item.id ? null : item.id))
                }}
              >
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </button>
            ))}
          </nav>
        </div>
      ) : null}

      {mode !== "calendar" ? (
        <div className="sky-stage">
          <div className="sky-chart">
            <div className={`natal-sheet${castFlash ? " cast-flash" : ""}`}>
              <header className="natal-head">
                <p className="eyebrow">{mode === "chart" ? "Cast report" : "Sky now"}</p>
                <h3>{name.trim() || "Cast a chart"}</h3>
                <p>
                  {placeLabel} · {latitude}° · {longitude}° · {timeZone} ({zoneLabel})
                </p>
                <p>
                  {date}
                  {timeUnknown ? " · time unknown (noon)" : ` ${time}`}
                  {weekdayOf(date) ? ` · ${weekdayOf(date)}` : ""}
                  {` · ${HOUSE_SYSTEM_LABEL[houseSystem]}`}
                  {rising ? ` · AS ${formatDegree(ascendant!)} ${rising.name}` : ""}
                  {midheaven != null && midheavenStation ? ` · MC ${formatDegree(midheaven)} ${midheavenStation.name}` : ""}
                </p>
                <div className="natal-big-three" aria-label="Big Three">
                  <span>
                    <b>☉</b> {sunStation.name}
                    {tribeOverlay ? ` · ${sunStation.tribe}` : ""}
                  </span>
                  {moon && moonStation ? (
                    <span>
                      <b>☽</b> {moonStation.name}
                      {tribeOverlay ? ` · ${moonStation.tribe}` : ""}
                    </span>
                  ) : null}
                  <span>
                    <b>AS</b> {rising ? rising.name : "—"}
                    {rising && tribeOverlay ? ` · ${rising.tribe}` : ""}
                  </span>
                </div>
                <label className="sky-check natal-overlay">
                  <input type="checkbox" checked={tribeOverlay} onChange={(event) => setTribeOverlay(event.target.checked)} />
                  Mazzaroth tribe labels
                </label>
              </header>
              <SkyWheel
                ref={wheelRef}
                bodies={bodies}
                aspects={aspects}
                houses={houses}
                ascendant={ascendant}
                midheaven={midheaven}
                highlightName={highlightName}
                highlightBody={highlightBody}
                onStation={(stationName) => setPick({ kind: "station", name: stationName })}
                onBody={(id) => setPick({ kind: "body", id })}
              />
              <dl className="natal-balance">
                <div>
                  <dt>Elements</dt>
                  {balance.elements.map((item) => (
                    <dd key={item.id} data-el={item.id}>
                      <span>{item.id}</span>
                      <b>{item.percent}%</b>
                      <i style={{ width: `${item.percent}%` }} />
                    </dd>
                  ))}
                </div>
                <div>
                  <dt>Qualities</dt>
                  {balance.qualities.map((item) => (
                    <dd key={item.id} data-q={item.id}>
                      <span>{item.id}</span>
                      <b>{item.percent}%</b>
                      <i style={{ width: `${item.percent}%` }} />
                    </dd>
                  ))}
                </div>
              </dl>
              <table className="natal-grid" aria-label="Aspect grid">
                <thead>
                  <tr>
                    <th />
                    {bodies.map((body) => (
                      <th key={body.id}>{bodyGlyph[body.id]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodies.map((row, rowIndex) => (
                    <tr key={row.id}>
                      <th>{bodyGlyph[row.id]}</th>
                      {bodies.map((col, colIndex) => {
                        const hit = aspects.find(
                          (item) =>
                            (item.left.id === row.id && item.right.id === col.id) ||
                            (item.left.id === col.id && item.right.id === row.id),
                        )
                        return (
                          <td key={col.id} data-kind={hit && colIndex > rowIndex ? hit.kind.id : undefined}>
                            {hit && colIndex > rowIndex ? aspectMark[hit.kind.id] : ""}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <section className="natal-report-dense" aria-label="House and pattern report">
                <p className="eyebrow">Houses</p>
                <ul className="natal-houses">
                  {houseLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                {patternNotes.length ? (
                  <>
                    <p className="eyebrow">Patterns</p>
                    <ul className="sky-decans">
                      {patternNotes.map((item) => (
                        <li key={item.id}>
                          <b>{item.title}</b>
                          <span>{item.body}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="quiet">No clustered patterns beyond the aspect grid at this cast.</p>
                )}
                <p className="quiet">Denser text for notes/PDF uses the same house and pattern lines — geometry for study, not a fortune.</p>
              </section>
            </div>

            <ol className="sky-bodies">
              {bodies.map((body) => {
                const station = stationAt(body.longitude)
                const house = houses.length ? houseOf(body.longitude, houses) : null
                return (
                  <li key={body.id}>
                    <button type="button" data-id={body.id} data-on={highlightBody === body.id ? "true" : "false"} onClick={() => setPick({ kind: "body", id: body.id })}>
                      <b>{bodyGlyph[body.id]}</b>
                      <strong>{body.name}</strong>
                      <span>{formatDegree(body.longitude)}</span>
                      <small>
                        {station.name}
                        {tribeOverlay ? ` · ${station.tribe}` : ""}
                        {house ? ` · house ${house.n}` : ""}
                        {body.retrograde ? " · turning back" : ""}
                      </small>
                    </button>
                  </li>
                )
              })}
              {rising && ascendant != null ? (
                <li>
                  <button type="button" data-on={highlightName === rising.name ? "true" : "false"} onClick={() => setPick({ kind: "station", name: rising.name })}>
                    <b>AS</b>
                    <strong>Rising</strong>
                    <span>{formatDegree(ascendant)}</span>
                    <small>
                      {rising.name}
                      {tribeOverlay ? ` · ${rising.tribe}` : ""} · house 1 · eastern horizon at cast time
                    </small>
                  </button>
                </li>
              ) : null}
              {midheavenStation && midheaven != null ? (
                <li>
                  <button type="button" data-on={highlightName === midheavenStation.name ? "true" : "false"} onClick={() => setPick({ kind: "station", name: midheavenStation.name })}>
                    <b>MC</b>
                    <strong>Midheaven</strong>
                    <span>{formatDegree(midheaven)}</span>
                    <small>
                      {midheavenStation.name}
                      {tribeOverlay ? ` · ${midheavenStation.tribe}` : ""}
                    </small>
                  </button>
                </li>
              ) : null}
            </ol>
          </div>

          <aside className="sky-inspector" aria-live="polite">
            {mode === "matrix" && matrixNode ? (
              <article className="sky-detail">
                <header>
                  <Badge>Letter {matrixNode.lesson.value}</Badge>
                  <h3>
                    {matrixNode.lesson.glyph} {matrixNode.lesson.name} · {matrixNode.label}
                  </h3>
                  <p>
                    {matrixNode.number} folds to the {matrixNode.lesson.groupLabel.toLowerCase()} letter {matrixNode.lesson.name}. Picture of {matrixNode.lesson.picture}.
                  </p>
                </header>
                <p>{matrixNode.note}</p>
                <p>{matrixNode.lesson.line}</p>
                <div className="letter-matrix" role="list">
                  {matrix.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      role="listitem"
                      data-slot={node.slot}
                      data-on={node.id === matrixNode.id ? "true" : "false"}
                      onClick={() => setMatrixId(node.id)}
                    >
                      <small>{node.label}</small>
                      <strong lang="he">{node.lesson.glyph}</strong>
                      <span>{node.number}</span>
                      <b>{node.lesson.name}</b>
                    </button>
                  ))}
                </div>
                <div className="sky-actions">
                  <Button type="button" size="sm" variant="outline" onClick={() => onOpen(matrixNode.lesson.sample.ref)}>
                    {matrixNode.lesson.sample.ref}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const station = mazzaroth[Math.min(11, Math.max(0, matrixNode.lesson.value <= 12 ? matrixNode.lesson.value - 1 : 0))]
                      setPick({ kind: "station", name: station.name })
                      setMode("sky")
                    }}
                  >
                    See the wheel
                  </Button>
                </div>
              </article>
            ) : (
              <article className="sky-detail">
                {pick?.kind === "body" ? (
                  <>
                    <header>
                      <Badge>{selectedBody.kind === "light" ? "Light" : selectedBody.kind === "mark" ? "Mark" : "Wanderer"}</Badge>
                      <h3>
                        {bodyGlyph[selectedBody.id]} {selectedBody.name} in the {selectedBodyStation.name}
                      </h3>
                      <p>
                        {formatDegree(selectedBody.longitude)} · {stationDegree(selectedBody.longitude)}° of the {selectedBodyStation.name}
                        {tribeOverlay ? ` · ${selectedBodyStation.tribe}` : ""}
                        {selectedHouse ? ` · house ${selectedHouse.n}` : ""}
                        {selectedBody.retrograde ? " · this wanderer is turning back" : ` · ${selectedBody.speed}° a day`}
                      </p>
                    </header>
                    <p>{bodyReadings[selectedBody.id].line} The lights keep time. They do not rule a life.</p>
                    <p>{selectedBodyStation.banner}</p>
                    <div className="sky-actions">
                      <Button type="button" size="sm" variant="outline" onClick={() => onOpen(bodyReadings[selectedBody.id].ref)}>
                        {bodyReadings[selectedBody.id].ref}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => onOpen(selectedBodyStation.blessing)}>
                        {selectedBodyStation.blessing}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setPick({ kind: "station", name: selectedBodyStation.name })}>
                        Open {selectedBodyStation.name}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <header>
                      {selectedStation.cornerstone ? <Badge>Cornerstone</Badge> : <Badge>{selectedStation.camp}</Badge>}
                      <h3>
                        {selectedStation.name}
                        {tribeOverlay ? ` · ${selectedStation.tribe}` : ""}
                      </h3>
                      <p>
                        {selectedStation.latin} · {selectedStation.meaning} · season opens {selectedStation.start.replace("-", "/")}
                      </p>
                    </header>
                    <p>{selectedStation.banner}</p>
                    <p>{selectedStation.season}</p>
                    <p className="quiet">Civil span · {stationCivilSpan(selectedStation)}</p>
                    {(() => {
                      const step = witnessForStation(selectedStation.name)
                      if (!step) return null
                      return (
                        <section className="sky-witness-note" aria-label="Witness reading">
                          <p className="eyebrow">Witness · step {step.step} of 12</p>
                          <p>{step.witness}</p>
                          <p className="quiet">{step.tribeStudy}</p>
                          <div className="sky-actions">
                            <Button type="button" size="sm" variant="outline" onClick={() => onOpen(step.ref)}>
                              {step.ref}
                            </Button>
                          </div>
                        </section>
                      )
                    })()}
                    {selectedStation.cornerstone ? (
                      <p className="quiet">Judah’s lion, Joseph’s bull, Reuben’s water, and Dan’s serpent are the four the blessings already name. Ezekiel 1:10 sets a lion, an ox, a man, and an eagle around the throne.</p>
                    ) : null}
                    {guests.length ? (
                      <p>In this station now: {guests.map((body) => body.name).join(", ")}.</p>
                    ) : (
                      <p className="quiet">No listed light stands in this station at this hour.</p>
                    )}
                    <ul className="sky-decans">
                      {selectedStation.decans.map((decan) => (
                        <li key={decan.name}>
                          <b>{decan.name}</b>
                          <span>{decan.note}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="sky-actions">
                      <Button type="button" size="sm" variant="outline" onClick={() => onOpen(selectedStation.blessing)}>
                        {selectedStation.blessing}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setClockTo(selectedStation)}>
                        Set the clock here
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setTool("witness")}>
                        Full witness path
                      </Button>
                    </div>
                  </>
                )}
                <section className="sky-aspects" aria-label="Spans">
                  <p className="eyebrow">{pick?.kind === "body" ? `Spans of ${selectedBody.name}` : "Spans in this station"}</p>
                  {selectedAspects.length ? (
                    <ul>
                      {selectedAspects.map((hit) => {
                        const other = pick?.kind === "body" ? otherBody(hit, selectedBody.id) : hit.right
                        return (
                          <li key={`${hit.left.id}-${hit.right.id}-${hit.kind.id}`}>
                            <button type="button" onClick={() => setPick({ kind: "body", id: other.id })}>
                              <b>
                                {bodyGlyph[hit.left.id]} {hit.kind.label} {bodyGlyph[hit.right.id]}
                              </b>
                              <small>
                                {hit.left.name} · {hit.right.name} · {measureArc(hit.delta).label} · orb{" "}
                                {measureArc(hit.orb).label} · {motionLabel(hit.motion)}
                              </small>
                              <span>{hit.note}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="quiet">No major span on the wheel for this pick at this hour.</p>
                  )}
                </section>
                {chart.warnings.map((warning) => (
                  <p key={warning} className="quiet">
                    {warning}
                  </p>
                ))}
                <p className="quiet">{chart.meta.accuracy}</p>
              </article>
            )}

            <div className="sky-actions">
              {onSave ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    onSave(
                      mode === "matrix" ? `Letters · ${date}` : `${name.trim() || "Cast chart"} · ${date}`,
                      `${caption}${verseLabel ? `\nBeside ${verseLabel}` : ""}`,
                      ["heavens", "mazzaroth", mode, focusStation.tribe.toLowerCase()],
                    )
                  }
                >
                  <Bookmark size={14} /> Save chart note
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (wheelRef.current) exportChartSvg(wheelRef.current, chart)
                }}
              >
                <Download size={14} /> SVG
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (wheelRef.current) void exportChartPng(wheelRef.current, chart)
                }}
              >
                <FileImage size={14} /> PNG
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => exportChartPdf(chart)}>
                <FileText size={14} /> PDF
              </Button>
              {onSearchOutside ? (
                <Button type="button" size="sm" variant="outline" onClick={() => onSearchOutside(outsideNeedle)}>
                  <ScrollText size={14} /> Extra-canon
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onStudy(chartStudySummary(chart))}
              >
                <Sparkles size={14} /> Study this sky
              </Button>
            </div>
          </aside>
        </div>
      ) : null}

      {mode !== "calendar" && tool === "stations" ? (
        <section className="sky-block" aria-label="Stations of the year">
          <p>Twelve equal stations of the sun’s path. Tribe names are a study map beside Genesis 49 and Deuteronomy 33 — not a fortune. Click a station to read it beside the wheel.</p>
          <div className="station-wheel">
            {mazzaroth.map((station) => (
              <button
                key={station.name}
                type="button"
                data-current={station.name === highlightName ? "true" : "false"}
                onClick={() => setPick({ kind: "station", name: station.name })}
              >
                <b>{station.name}</b>
                <small>
                  {station.tribe} · {station.latin}
                </small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {mode !== "calendar" && tool === "circle" ? (
        <section className="sky-block" aria-label="Measure the sky circle">
          <p className="eyebrow">Circle & degrees</p>
          <p>{circleMeasureStance}</p>
          <p className="quiet">
            {CIRCLE_DEGREES}° full wheel · {STATIONS}×{STATION_WIDTH}° stations · {CIRCLE_ARC_MINUTES.toLocaleString()}′ around · ~
            {CLOCK_MINUTES_PER_DEGREE} min clock ≈ 1° rising (approximate teaching, not ephemeris truth).
          </p>
          <ul className="sky-decans">
            {circleMeasureLessons.map((lesson) => (
              <li key={lesson.id}>
                <b>{lesson.title}</b>
                <span>{lesson.body}</span>
              </li>
            ))}
          </ul>
          <div className="circle-drill" aria-label="Circle measure drill">
            <p className="eyebrow">Circle drill</p>
            <p>{circleDrill.prompt}</p>
            <div className="sky-actions">
              {circleDrill.options.map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={circleDrillPick === option ? (option === circleDrill.answer ? "default" : "outline") : "outline"}
                  onClick={() => setCircleDrillPick(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
            {circleDrillPick ? (
              <p className="quiet">
                {circleDrillPick === circleDrill.answer ? "Yes. " : `Not ${circleDrillPick} — answer is ${circleDrill.answer}. `}
                {circleDrill.tip}
              </p>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setCircleDrill(makeCircleDrill(circleDrill.prompt))
                setCircleDrillPick(null)
              }}
            >
              Another
            </Button>
          </div>
          <p className="eyebrow">Named twelves in Scripture</p>
          <p className="quiet">Bible-rooted twelves beside the twelve stations — not a fortune list.</p>
          <ul className="scripture-twelves">
            {scriptureTwelves.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span className="quiet">{item.note}</span>
                <div className="sky-actions">
                  {item.refs.map((ref) => (
                    <Button key={ref} type="button" size="sm" variant="outline" onClick={() => onOpen(ref)}>
                      {ref}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          {pick?.kind === "body" && bodies.length >= 2 ? (
            <section className="sky-aspects" aria-label="Arc from the selected light">
              <p className="eyebrow">Arc from {selectedBody.name}</p>
              <ul>
                {bodies
                  .filter((body) => body.id !== selectedBody.id)
                  .slice(0, 8)
                  .map((body) => {
                    const arc = arcBetween(selectedBody, body)
                    return (
                      <li key={body.id}>
                        <button type="button" onClick={() => setPick({ kind: "body", id: body.id })}>
                          <b>
                            {bodyGlyph[selectedBody.id]} → {bodyGlyph[body.id]} {body.name}
                          </b>
                          <small>
                            {arc.label} · ~{clockMinutesForDegrees(arc.degrees + arc.minutes / 60)} min clock if that were rising
                            motion
                          </small>
                          <span>Shortest ecliptic span — geometry for study, not a forecast.</span>
                        </button>
                      </li>
                    )
                  })}
              </ul>
            </section>
          ) : (
            <p className="quiet">Pick a light on the wheel to measure arcs to the other bodies in degrees and arc minutes.</p>
          )}
          <div className="sky-actions">
            <Button type="button" size="sm" variant="outline" onClick={() => onOpen("Genesis 1:14")}>
              Genesis 1:14
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onOpen("Job 38:32")}>
              Job 38:32
            </Button>
            {onSearchOutside ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onSearchOutside("mazzaroth rolleston")}>
                <ScrollText size={14} /> Rolleston (PD)
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {mode !== "calendar" && tool === "witness" ? (
        <section className="sky-block" aria-label="Witness path through the Mazzaroth">
          <p>{mazzarothStudyStance}</p>
          <p className="quiet">
            Walk Virgin → Lion as a Scripture reading of glory: promised seed to Lion of Judah. Civil spans are seasonal clocks. Decans stay labeled with ordinary sky names.
          </p>
          <ol className="witness-path">
            {witnessSteps().map((step) => (
              <li key={step.station.name}>
                <button
                  type="button"
                  data-on={highlightName === step.station.name ? "true" : "false"}
                  onClick={() => {
                    setPick({ kind: "station", name: step.station.name })
                    setMode("sky")
                  }}
                >
                  <b>
                    {step.step}. {step.station.name}
                  </b>
                  <small>
                    {step.station.tribe} · {stationCivilSpan(step.station)} · {step.ref}
                  </small>
                  <span>{step.witness}</span>
                </button>
                <div className="sky-actions">
                  <Button type="button" size="sm" variant="outline" onClick={() => onOpen(step.ref)}>
                    {step.ref}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => onOpen(step.station.blessing)}>
                    {step.station.blessing}
                  </Button>
                </div>
              </li>
            ))}
          </ol>
          {onSave ? (
            <Button
              type="button"
              size="sm"
              onClick={() =>
                onSave(
                  "Mazzaroth · Witness path",
                  [
                    "Witness path · Virgin to Lion",
                    mazzarothStudyStance,
                    "",
                    ...witnessSteps().map(
                      (step) =>
                        `${step.step}. ${step.station.name} (${step.station.tribe}) · ${step.ref}\n${step.witness}\n${step.tribeStudy}`,
                    ),
                  ].join("\n"),
                  ["heavens", "mazzaroth", "witness"],
                )
              }
            >
              <Bookmark size={14} /> Save witness note
            </Button>
          ) : null}
        </section>
      ) : null}

      {mode !== "calendar" && tool === "decans" ? (
        <section className="sky-block" aria-label="Decans">
          <p>{decansStudyStance}</p>
          <ul className="sky-lights">
            {stationDecanCatalog.map((row) => (
              <li key={row.latin}>
                <strong>
                  {row.station.name} · {row.latin}
                </strong>
                <span>{row.stance}</span>
                <ul>
                  {row.decans.map((decan) => (
                    <li key={`${row.latin}-${decan.name}`}>
                      <b>{decan.name}</b>
                      <p>{decan.note}</p>
                      <div className="sky-actions">
                        {decan.refs.map((ref) => (
                          <button key={ref} type="button" className="chip" onClick={() => onOpen(ref)}>
                            {ref}
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          {onSearchOutside ? (
            <Button type="button" size="sm" variant="outline" onClick={() => onSearchOutside("mazzaroth rolleston")}>
              <ScrollText size={14} /> Rolleston (PD) · decan tables
            </Button>
          ) : null}
        </section>
      ) : null}

      {mode !== "calendar" && tool === "job" ? (
        <section className="sky-block" aria-label="Job 38">
          <p>The Lord questions Job about the sky. Each line opens that verse.</p>
          <ul className="sky-lights">
            {jobSky.map((item) => (
              <li key={item.ref}>
                <button type="button" onClick={() => onOpen(item.ref)}>
                  <strong>{item.title}</strong>
                  <span>{item.ref}</span>
                  <small>{item.line}</small>
                </button>
              </li>
            ))}
          </ul>
          <p className="eyebrow">Named lights in Job</p>
          <p className="quiet">Lexicon and clock — Ash, Kimah, Kesil, Mazzaroth, chambers of the south. Not natal markers.</p>
          <ul className="sky-lights">
            {jobStarNames.map((item) => (
              <li key={item.title}>
                <strong>
                  {item.title} {item.hebrew ? <em>{item.hebrew}</em> : null}
                </strong>
                <small>{item.line}</small>
                <p>{item.note}</p>
                <div className="sky-actions">
                  {item.refs.map((ref) => (
                    <button key={ref} type="button" className="chip" onClick={() => onOpen(ref)}>
                      {ref}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          {onSearchOutside ? (
            <Button type="button" size="sm" variant="outline" onClick={() => onSearchOutside("mazzaroth rolleston")}>
              <ScrollText size={14} /> Rolleston on Job (PD)
            </Button>
          ) : null}
          <p className="eyebrow">Perseverance under trial</p>
          <p className="quiet">Scripture’s Job — upright under loss — not a Virgo keyword wheel.</p>
          <ul className="sky-lights">
            {jobPerseverance.map((item) => (
              <li key={item.ref}>
                <button type="button" onClick={() => onOpen(item.ref)}>
                  <strong>{item.title}</strong>
                  <span>{item.ref}</span>
                  <small>{item.line}</small>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {mode !== "calendar" && tool === "psalm" ? (
        <section className="sky-block" aria-label="Psalm 19">
          <p>The heavens speak, and the psalm turns from the sun to the law.</p>
          <ul className="sky-lights">
            {psalmSky.map((item) => (
              <li key={item.ref}>
                <button type="button" onClick={() => onOpen(item.ref)}>
                  <strong>{item.title}</strong>
                  <span>{item.ref}</span>
                  <small>{item.line}</small>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {mode !== "calendar" && tool === "camp" ? (
        <section className="sky-block" aria-label="Camp of Israel">
          <p>Numbers 2 sets the tribes on four sides, with Levi in the midst. A blessing verse opens beside each name.</p>
          <div className="camp">
            {campSides.map((side) => (
              <article key={side.side}>
                <button type="button" className="camp-side" onClick={() => onOpen(side.ref)}>
                  {side.side}
                  <small>{side.ref}</small>
                </button>
                <ul>
                  {side.tribes.map((tribe) => (
                    <li key={tribe.name}>
                      <button type="button" onClick={() => onOpen(tribe.ref)}>
                        <b>{tribe.name}</b>
                        <small>{tribe.note}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
            <article className="camp-center">
              <button type="button" onClick={() => onOpen(campCenter.blessing)}>
                <b>{campCenter.name}</b>
                <small>{campCenter.note}</small>
              </button>
            </article>
          </div>
          <p className="eyebrow">Cherub faces · camp cornerstones</p>
          <p className="quiet">{cherubCampStance}</p>
          <ul className="sky-lights">
            {cherubCampTypology.map((item) => (
              <li key={item.face}>
                <strong>
                  {item.face} · {item.cornerstone}
                </strong>
                <span>
                  {item.station} station · {item.tribe}
                </span>
                <p>{item.note}</p>
                {item.tradition ? <p className="anth-hypothesis">{item.tradition}</p> : null}
                <div className="sky-actions">
                  {item.refs.map((ref) => (
                    <button key={ref} type="button" className="chip" onClick={() => onOpen(ref)}>
                      {ref}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          {onSearchOutside ? (
            <Button type="button" size="sm" variant="outline" onClick={() => onSearchOutside("mazzaroth rolleston")}>
              <ScrollText size={14} /> Rolleston · cherubic forms (PD)
            </Button>
          ) : null}
        </section>
      ) : null}

      {mode !== "calendar" && tool === "lights" ? (
        <section className="sky-block" aria-label="Named lights">
          <ul className="sky-lights">
            {lights.map((light) => (
              <li key={light.name}>
                <button type="button" onClick={() => onOpen(light.ref)}>
                  <strong>{light.name}</strong>
                  <span>{light.ref}</span>
                  {light.hebrew ? <em>{light.hebrew}</em> : null}
                  <small>{light.line}</small>
                </button>
                <p>{light.note}</p>
              </li>
            ))}
          </ul>
          {lights.length === 0 ? <p className="quiet">No scriptural light matches that search.</p> : null}
        </section>
      ) : null}

      {mode !== "calendar" && tool === "sefirot" ? (
        <section className="sky-block" aria-label="Ten sefirot">
          <p>{sefirotCaption}</p>
          <ul className="sefirot-tree">
            {sefirot.map((item) => (
              <li key={item.name} data-pillar={item.pillar} data-row={item.row}>
                <button type="button" onClick={() => onOpen(item.ref)}>
                  <strong>{item.hebrew}</strong>
                  <b>
                    {item.name} · {item.gloss}
                  </b>
                  <span>{item.ref}</span>
                  <small>{item.note}</small>
                </button>
              </li>
            ))}
          </ul>
          {onSearchOutside ? (
            <Button type="button" size="sm" variant="outline" onClick={() => onSearchOutside("yetzirah")}>
              <ScrollText size={14} /> Sefer Yetzirah notes
            </Button>
          ) : null}
        </section>
      ) : null}

      {mode !== "calendar" && tool === "beginnings" ? (
        <section className="sky-block" aria-label="Beginnings">
          <p>
            Genesis 1:14, Job 38, and Psalm 19 open the desk. The Witness path walks Virgin → Lion beside Scripture — a reading of glory across the lights, not a fortune. Anointed Staff gathers Scripture, sky, and study into one holistic walk.
          </p>
          <ul className="sky-lights">
            {[
              { title: "Lights for signs", ref: "Genesis 1:14", line: "Let them be for signs, and for seasons, and for days, and years." },
              { title: "Seed of the woman", ref: "Genesis 3:15", line: "It shall bruise thy head, and thou shalt bruise his heel." },
              { title: "Mazzaroth", ref: "Job 38:32", line: "Canst thou bring forth Mazzaroth in his season?" },
              { title: "The heavens declare", ref: "Psalm 19:1", line: "The heavens declare the glory of God." },
              { title: "Astrologers refused", ref: "Isaiah 47:13", line: "Let now the astrologers, the stargazers, the monthly prognosticators, stand up…" },
              { title: "Lion of Judah", ref: "Revelation 5:5", line: "The Lion of the tribe of Juda… hath prevailed." },
            ].map((item) => (
              <li key={item.ref}>
                <button type="button" onClick={() => onOpen(item.ref)}>
                  <strong>{item.title}</strong>
                  <span>{item.ref}</span>
                  <small>{item.line}</small>
                </button>
              </li>
            ))}
          </ul>
          <div className="sky-actions">
            <Button type="button" size="sm" variant="outline" onClick={() => setTool("witness")}>
              Open Witness path
            </Button>
            {onSearchOutside ? (
              <>
                <Button type="button" size="sm" variant="outline" onClick={() => onSearchOutside("beginnings")}>
                  <ScrollText size={14} /> Beginnings notes
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => onSearchOutside("coming forth")}>
                  Book of the Dead sample
                </Button>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      <p className="rights">
        Anointed Staff Cast · Whole Sign or Equal houses · applying spans for study. The lights keep time (Genesis 1:14); they do not rule a life. Monthly prognosticators are refused (Isaiah 47:13). Witness and tribe labels walk Scripture — a holistic sky beside the Word.
      </p>
    </div>
  )
}

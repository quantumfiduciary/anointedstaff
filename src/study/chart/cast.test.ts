/**
 * Golden fixtures for the desk cast engine.
 * Run: npm run test:chart
 */
import assert from "node:assert/strict"
import { test } from "node:test"
import { castNatalChart } from "./cast"
import { civilToUtc, zoneOffsetMs } from "./time"
import { equalHouses, wholeSignHouses } from "./houses"
import { findAspects } from "./aspects"
import { castSky, sunLongitude, daysFromJ2000 } from "./ephemeris"

test("civilToUtc respects IANA zones (Jerusalem vs New York)", () => {
  const j = civilToUtc("2000-01-01", "12:00", "Asia/Jerusalem")
  const n = civilToUtc("2000-01-01", "12:00", "America/New_York")
  // Same wall clock → different UTC by roughly the zone gap
  const hoursApart = Math.abs(j.getTime() - n.getTime()) / 3600000
  assert.ok(hoursApart >= 6 && hoursApart <= 8, `expected ~7h gap, got ${hoursApart}`)
})

test("zoneOffsetMs is positive east of UTC for Jerusalem", () => {
  const offset = zoneOffsetMs("Asia/Jerusalem", new Date("2000-01-01T10:00:00Z"))
  assert.ok(offset / 3600000 >= 2 && offset / 3600000 <= 3)
})

test("sun near 280° at J2000 noon UTC (Meeus class)", () => {
  const days = daysFromJ2000(new Date(Date.UTC(2000, 0, 1, 12)))
  const lon = sunLongitude(days)
  assert.ok(Math.abs(lon - 280.46) < 1.5, `sun ${lon}`)
})

test("castNatalChart timed chart has ASC/MC/houses", () => {
  const chart = castNatalChart({
    name: "Test",
    date: "1990-06-15",
    time: "14:30",
    lat: 31.778,
    lon: 35.235,
    timeZone: "Asia/Jerusalem",
    houseSystem: "whole-sign",
  })
  assert.equal(chart.subject.timeUnknown, false)
  assert.ok(chart.angles.ascendant != null)
  assert.ok(chart.angles.midheaven != null)
  assert.equal(chart.houses.length, 12)
  assert.ok(chart.bodies.length >= 11)
  assert.ok(chart.bodies.some((body) => body.id === "southNode"))
  assert.equal(chart.warnings.length, 0)
})

test("unknown time omits angles and houses, warns, casts noon", () => {
  const chart = castNatalChart({
    date: "1990-06-15",
    timeUnknown: true,
    lat: 40.713,
    lon: -74.006,
    timeZone: "America/New_York",
  })
  assert.equal(chart.subject.timeUnknown, true)
  assert.equal(chart.angles.ascendant, null)
  assert.equal(chart.angles.midheaven, null)
  assert.equal(chart.houses.length, 0)
  assert.ok(chart.warnings.some((line) => /time unknown/i.test(line)))
  assert.ok(chart.bodies.length > 0)
})

test("Equal houses start at exact ASC; Whole Sign at sign cusp", () => {
  const asc = 45.5
  const whole = wholeSignHouses(asc)
  const equal = equalHouses(asc)
  assert.equal(whole[0].cusp, 30)
  assert.ok(Math.abs(equal[0].cusp - 45.5) < 0.001)
  assert.equal(equal[1].cusp, 75.5)
})

test("aspects include applying or separating motion", () => {
  const bodies = castSky(new Date(Date.UTC(2000, 0, 1, 12)))
  const hits = findAspects(bodies)
  assert.ok(hits.length > 0)
  for (const hit of hits) {
    assert.ok(["applying", "separating", "exact"].includes(hit.motion))
    assert.ok(typeof hit.orb === "number")
  }
})

test("golden: 2000-01-01 12:00 UTC sun longitude band", () => {
  const chart = castNatalChart({
    date: "2000-01-01",
    time: "12:00",
    lat: 0,
    lon: 0,
    timeZone: "UTC",
    houseSystem: "equal",
  })
  const sun = chart.bodies.find((body) => body.id === "sun")!
  // Public ephemeris ~280.7°; desk Meeus within a few degrees
  assert.ok(sun.longitude > 275 && sun.longitude < 286, `sun ${sun.longitude}`)
  assert.ok(chart.angles.ascendant != null)
  assert.equal(chart.houses.length, 12)
})

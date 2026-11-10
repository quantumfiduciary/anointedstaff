/**
 * Multi-chart library for Heavens Cast — localStorage only.
 * Birth PII stays on-device; never sent to a server by this module.
 */

import type { NatalChart } from "./types"

export type SavedChart = {
  id: string
  label: string
  savedAt: string
  chart: NatalChart
}

export const chartLibraryKey = "anointed-staff.sky-charts"
export const chartActiveKey = "anointed-staff.sky-chart-active"
/** Legacy single-slot cast (still written on Cast for older builds). */
export const chartLegacyKey = "anointed-staff.sky-cast"

function newId() {
  return `chart-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function readChartLibrary(): SavedChart[] {
  try {
    const raw = JSON.parse(localStorage.getItem(chartLibraryKey) ?? "[]") as unknown
    if (!Array.isArray(raw)) return []
    return raw.filter(
      (item): item is SavedChart =>
        item &&
        typeof item === "object" &&
        typeof (item as SavedChart).id === "string" &&
        typeof (item as SavedChart).label === "string" &&
        (item as SavedChart).chart &&
        typeof (item as SavedChart).chart === "object",
    )
  } catch {
    return []
  }
}

export function writeChartLibrary(entries: SavedChart[]) {
  localStorage.setItem(chartLibraryKey, JSON.stringify(entries.slice(0, 48)))
}

export function readActiveChartId(): string | null {
  return localStorage.getItem(chartActiveKey)
}

export function writeActiveChartId(id: string | null) {
  if (id) localStorage.setItem(chartActiveKey, id)
  else localStorage.removeItem(chartActiveKey)
}

export function defaultChartLabel(chart: NatalChart): string {
  const name = chart.subject.name.trim()
  const when = `${chart.subject.date}${chart.subject.timeUnknown ? "" : ` ${chart.subject.time}`}`
  return name ? `${name} · ${when}` : `Cast · ${when}`
}

/** Insert or replace by id; returns the saved entry. */
export function upsertChart(chart: NatalChart, opts?: { id?: string; label?: string }): SavedChart {
  const entries = readChartLibrary()
  const id = opts?.id ?? newId()
  const entry: SavedChart = {
    id,
    label: (opts?.label ?? defaultChartLabel(chart)).trim() || defaultChartLabel(chart),
    savedAt: new Date().toISOString(),
    chart,
  }
  const next = [entry, ...entries.filter((item) => item.id !== id)]
  writeChartLibrary(next)
  writeActiveChartId(id)
  localStorage.setItem(chartLegacyKey, JSON.stringify(chart))
  return entry
}

export function duplicateChart(id: string): SavedChart | null {
  const entries = readChartLibrary()
  const source = entries.find((item) => item.id === id)
  if (!source) return null
  return upsertChart(source.chart, { label: `${source.label} (copy)` })
}

export function deleteChart(id: string): SavedChart[] {
  const next = readChartLibrary().filter((item) => item.id !== id)
  writeChartLibrary(next)
  if (readActiveChartId() === id) {
    writeActiveChartId(next[0]?.id ?? null)
  }
  return next
}

export function renameChart(id: string, label: string): SavedChart | null {
  const entries = readChartLibrary()
  const index = entries.findIndex((item) => item.id === id)
  if (index < 0) return null
  const entry = { ...entries[index], label: label.trim() || entries[index].label }
  const next = [...entries]
  next[index] = entry
  writeChartLibrary(next)
  return entry
}

/** Migrate legacy single cast into the library once. */
export function migrateLegacyCast(): SavedChart[] {
  const existing = readChartLibrary()
  if (existing.length) return existing
  try {
    const legacy = JSON.parse(localStorage.getItem(chartLegacyKey) ?? "null") as NatalChart | null
    if (!legacy?.subject || !legacy?.bodies) return existing
    const entry = upsertChart(legacy)
    return [entry]
  } catch {
    return existing
  }
}

/** OpenStreetMap Nominatim place search — fills lat/lon for Custom casts. No API key. */

export type GeocodeHit = {
  label: string
  lat: number
  lon: number
}

type NominatimRow = {
  display_name?: string
  lat?: string
  lon?: string
}

const ENDPOINT = "https://nominatim.openstreetmap.org/search"

/** Search places by name. Caller should not hammer Nominatim (≤1 request/sec). */
export async function searchPlaces(query: string, limit = 5): Promise<GeocodeHit[]> {
  const needle = query.trim()
  if (needle.length < 2) return []
  const url = new URL(ENDPOINT)
  url.searchParams.set("q", needle)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", String(Math.min(8, Math.max(1, limit))))
  url.searchParams.set("addressdetails", "0")
  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      // Identifying Referer is sent by the browser; User-Agent cannot be set from pages.
    },
  })
  if (!response.ok) throw new Error(`Place search failed (${response.status})`)
  const rows = (await response.json()) as NominatimRow[]
  if (!Array.isArray(rows)) return []
  return rows
    .map((row) => {
      const lat = Number(row.lat)
      const lon = Number(row.lon)
      const label = (row.display_name ?? "").trim()
      if (!label || !Number.isFinite(lat) || !Number.isFinite(lon)) return null
      return { label, lat, lon }
    })
    .filter((item): item is GeocodeHit => item != null)
}

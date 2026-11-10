export type WebHit = { title: string; url: string; snippet: string }

export function searxRoot(base: string) {
  const trimmed = base.trim().replace(/\/$/, "")
  try {
    const url = new URL(trimmed)
    const local = url.hostname === "127.0.0.1" || url.hostname === "localhost"
    if (local && (url.port === "8080" || url.port === "")) return "/searxng"
  } catch {
    return trimmed
  }
  return trimmed
}

export async function searchWeb(base: string, query: string, language: string) {
  const root = searxRoot(base)
  const target = `${root}/search?q=${encodeURIComponent(query)}&format=json&language=${encodeURIComponent(language || "en")}`
  const response = await fetch(target, { signal: AbortSignal.timeout(20000) })
  if (!response.ok) throw new Error(`SearXNG answered ${response.status}`)
  const data = (await response.json()) as { results?: { title?: string; url?: string; content?: string }[] }
  return (data.results ?? [])
    .slice(0, 8)
    .map((item) => ({
      title: item.title?.trim() || item.url || "Result",
      url: item.url ?? "",
      snippet: (item.content ?? "").replace(/\s+/g, " ").trim(),
    }))
    .filter((item) => item.url)
}

import { useEffect, useState } from "react"
import { History, X } from "lucide-react"
import type { SearchRow } from "../search"
import type { Passage } from "../types"

type SearchFieldProps = {
  query: string
  suggestion: { passage: Passage; label: string } | null
  hits: SearchRow[]
  total: number
  labelFor: (row: SearchRow) => string
  onQuery: (query: string) => void
  onOpenPassage: (passage: Passage) => void
  onOpenHit: (row: SearchRow) => void
}

const recentKey = "anointed-staff.recent-searches"

function readRecent(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(recentKey) ?? "[]") as unknown
    return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === "string").slice(0, 8) : []
  } catch {
    return []
  }
}

export function SearchField({
  query,
  suggestion,
  hits,
  total,
  labelFor,
  onQuery,
  onOpenPassage,
  onOpenHit,
}: SearchFieldProps) {
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(0)
  const [recent, setRecent] = useState<string[]>(readRecent)
  const typed = query.trim()
  const open = typed.length > 0 && (suggestion != null || hits.length > 0 || typed.length >= 2)
  const showRecent = focused && !typed && recent.length > 0
  const count = (suggestion ? 1 : 0) + hits.length

  useEffect(() => setActive(0), [query])

  function remember() {
    if (typed.length < 2) return
    const next = [typed, ...recent.filter((item) => item.toLowerCase() !== typed.toLowerCase())].slice(0, 8)
    setRecent(next)
    localStorage.setItem(recentKey, JSON.stringify(next))
  }

  function choose(index: number) {
    remember()
    if (suggestion && index === 0) {
      onOpenPassage(suggestion.passage)
      return
    }
    const hit = hits[index - (suggestion ? 1 : 0)]
    if (hit) onOpenHit(hit)
  }

  return (
    <div className="search">
      <label className="sr" htmlFor="scripture-search">
        Search scripture or go to a reference
      </label>
      <input
        id="scripture-search"
        value={query}
        placeholder="Search or go to John 3:16"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="scripture-results"
        aria-activedescendant={open && count ? `search-option-${active}` : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => onQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onQuery("")
          if (event.key === "ArrowDown" && count) {
            event.preventDefault()
            setActive((value) => (value + 1) % count)
          }
          if (event.key === "ArrowUp" && count) {
            event.preventDefault()
            setActive((value) => (value - 1 + count) % count)
          }
          if (event.key === "Enter") {
            event.preventDefault()
            choose(active)
          }
        }}
      />
      {open ? (
        <div className="search-results" id="scripture-results" role="listbox" onMouseDown={(event) => event.preventDefault()}>
          {suggestion ? (
            <button
              id="search-option-0"
              role="option"
              aria-selected={active === 0}
              type="button"
              className="search-hit jump"
              data-active={active === 0 ? "true" : "false"}
              onMouseEnter={() => setActive(0)}
              onClick={() => choose(0)}
            >
              Open {suggestion.label}
            </button>
          ) : null}
          {hits.map((hit, index) => {
            const at = index + (suggestion ? 1 : 0)
            return (
              <button
                key={`${hit.book}:${hit.chapter}:${hit.verse}`}
                id={`search-option-${at}`}
                role="option"
                aria-selected={active === at}
                type="button"
                className="search-hit"
                data-active={active === at ? "true" : "false"}
                onMouseEnter={() => setActive(at)}
                onClick={() => choose(at)}
              >
                <b>{labelFor(hit)}</b>
                <Snippet text={hit.text} query={query} />
              </button>
            )
          })}
          {typed.length >= 2 && total === 0 && !suggestion ? (
            <p className="search-empty">No verses found. Try a book name or John 3:16.</p>
          ) : null}
          {count ? (
            <p className="search-meta">
              {total > hits.length ? `${hits.length} of ${total} · ` : ""}↑ ↓ to choose, Enter to open
            </p>
          ) : null}
        </div>
      ) : null}
      {showRecent ? (
        <div className="search-results" onMouseDown={(event) => event.preventDefault()}>
          <p className="search-meta search-recent-head">
            <History size={13} /> Recent searches
          </p>
          {recent.map((item) => (
            <div key={item} className="search-recent">
              <button type="button" className="search-hit" onClick={() => onQuery(item)}>
                {item}
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Forget ${item}`}
                onClick={() => {
                  const next = recent.filter((other) => other !== item)
                  setRecent(next)
                  localStorage.setItem(recentKey, JSON.stringify(next))
                }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Snippet({ text, query }: { text: string; query: string }) {
  const needle = query.trim()
  const at = text.toLowerCase().indexOf(needle.toLowerCase())
  if (at < 0 || needle.length < 2) return <span>{text}</span>
  const start = Math.max(0, at - 42)
  const end = Math.min(text.length, at + needle.length + 56)
  const slice = text.slice(start, end)
  const rel = at - start
  return (
    <span>
      {start > 0 ? "…" : ""}
      {slice.slice(0, rel)}
      <mark>{slice.slice(rel, rel + needle.length)}</mark>
      {slice.slice(rel + needle.length)}
      {end < text.length ? "…" : ""}
    </span>
  )
}

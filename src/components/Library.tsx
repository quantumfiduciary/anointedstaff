import { useEffect, useState } from "react"
import { books, sections } from "../catalog"

type LibraryProps = {
  activeBook: number
  activeChapter?: number
  purpose: string
  chapters: number
  compact?: boolean
  onPick: (book: number, chapter?: number) => void
}

function matches(index: number, needle: string) {
  const book = books[index]
  if (!book || !needle) return true
  const words = [book.name, book.abbrev, ...(book.aliases ?? [])].map((item) => item.toLowerCase().replace(/\s+/g, ""))
  return words.some((word) => word.includes(needle))
}

export function Library({ activeBook, activeChapter = 0, purpose, chapters, compact = false, onPick }: LibraryProps) {
  const [section, setSection] = useState(books[activeBook]?.section ?? "all")
  const [filter, setFilter] = useState("")

  useEffect(() => {
    const current = books[activeBook]?.section
    if (current) setSection(current)
  }, [activeBook])

  const needle = filter.trim().toLowerCase().replace(/\s+/g, "")
  const shown = needle || section === "all" ? sections : sections.filter((item) => item === section)
  const found = needle ? books.map((_, index) => index).filter((index) => matches(index, needle)) : []

  const current = books[activeBook]
  return (
    <nav className={compact ? "library compact" : "library"} aria-label="Books">
      {compact || !current ? null : (
        <div className="book-now">
          <b>{current.name}</b>
          <p>{purpose}</p>
          <small>
            {chapters} {chapters === 1 ? "chapter" : "chapters"} · {current.testament === "OT" ? "Old Testament" : current.testament === "NT" ? "New Testament" : current.section}
          </small>
          {chapters > 1 ? (
            <div className="library-chapters" role="group" aria-label={`Chapters of ${current.name}`}>
              {Array.from({ length: chapters }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-current={index === activeChapter ? "page" : undefined}
                  onClick={() => onPick(activeBook, index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
      {compact ? null : (
        <div className="library-tools">
          <label className="library-filter">
            <span className="sr">Find a book</span>
            <input
              type="search"
              value={filter}
              placeholder="Find a book"
              onChange={(event) => setFilter(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && found.length) {
                  onPick(found[0])
                  setFilter("")
                }
                if (event.key === "Escape") setFilter("")
              }}
            />
          </label>
          <label className="library-filter">
            <span className="sr">Book section</span>
            <select aria-label="Book section" value={section} disabled={Boolean(needle)} onChange={(event) => setSection(event.target.value)}>
              <option value="all">All books</option>
              {sections.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {needle && found.length === 0 ? <p className="quiet">No book matches that name.</p> : null}
      {shown.map((name) => {
        const list = books.map((book, index) => ({ book, index })).filter(({ book, index }) => book.section === name && matches(index, needle))
        if (!list.length) return null
        return (
          <div key={name}>
            <div className="section-label">{compact ? name.slice(0, 3) : name}</div>
            {list.map(({ book, index }) => (
              <button
                key={book.name}
                type="button"
                className="book-btn"
                aria-current={index === activeBook ? "page" : undefined}
                title={book.name}
                onClick={() => {
                  onPick(index)
                  setFilter("")
                }}
              >
                <span>{compact ? book.abbrev : book.name}</span>
                {compact ? null : <small>{book.abbrev}</small>}
              </button>
            ))}
          </div>
        )
      })}
    </nav>
  )
}

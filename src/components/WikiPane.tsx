import { useEffect, useMemo, useRef, useState } from "react"
import { BookMarked, Eye, FilePlus, Pencil, Trash2 } from "lucide-react"
import { parseReference } from "../reference"
import {
  findWikiPage,
  slugifyTitle,
  wikiBacklinks,
  type Notebook,
  type WikiPage,
} from "../notebooks"
import { renderWikiMarkdown } from "../wikiMarkdown"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

type WikiPaneProps = {
  notebook: Notebook
  onChange: (update: (notebook: Notebook) => Notebook) => void
  onOpenScripture: (book: number, chapter: number, verse: number | null) => void
  focusPageId?: string | null
}

export function WikiPane({ notebook, onChange, onOpenScripture, focusPageId }: WikiPaneProps) {
  const pages = notebook.pages ?? []
  const [pageId, setPageId] = useState(() => pages.find((page) => page.kind === "index")?.id ?? pages[0]?.id ?? "")
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const [filter, setFilter] = useState("")
  const preview = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focusPageId && pages.some((page) => page.id === focusPageId)) setPageId(focusPageId)
  }, [focusPageId, pages])

  useEffect(() => {
    if (!pages.some((page) => page.id === pageId)) {
      setPageId(pages.find((page) => page.kind === "index")?.id ?? pages[0]?.id ?? "")
    }
  }, [pages, pageId])

  const page = pages.find((item) => item.id === pageId) ?? pages[0]
  const needle = filter.trim().toLowerCase()
  const listed = useMemo(() => {
    const sorted = [...pages].sort((a, b) => {
      const rank = (item: WikiPage) => (item.kind === "index" ? 0 : item.kind === "log" ? 2 : 1)
      return rank(a) - rank(b) || a.title.localeCompare(b.title)
    })
    if (!needle) return sorted
    return sorted.filter((item) => `${item.title} ${item.body} ${item.tags.join(" ")}`.toLowerCase().includes(needle))
  }, [pages, needle])

  const backlinks = page ? wikiBacklinks(notebook, page) : []

  function patchPage(id: string, patch: Partial<WikiPage>) {
    onChange((current) => ({
      ...current,
      pages: (current.pages ?? []).map((item) => {
        if (item.id !== id) return item
        const title = patch.title != null ? patch.title.trim().slice(0, 80) || item.title : item.title
        return {
          ...item,
          ...patch,
          title,
          slug: patch.title != null ? slugifyTitle(title) : item.slug,
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
  }

  function newPage() {
    const title = `Page ${(pages.filter((item) => item.kind === "page").length || 0) + 1}`
    const next: WikiPage = {
      id: crypto.randomUUID(),
      title,
      slug: slugifyTitle(title),
      body: `# ${title}\n\nWrite your study here. Link pages with [[Index]] or a verse with [[John 3:16]].\n`,
      tags: [],
      updatedAt: new Date().toISOString(),
      kind: "page",
    }
    onChange((current) => ({ ...current, pages: [...(current.pages ?? []), next] }))
    setPageId(next.id)
    setMode("edit")
  }

  function openOrCreateByTitle(title: string) {
    const hit = findWikiPage(notebook, title)
    if (hit) {
      setPageId(hit.id)
      setMode("preview")
      return
    }
    const next: WikiPage = {
      id: crypto.randomUUID(),
      title: title.trim().slice(0, 80) || "Untitled",
      slug: slugifyTitle(title),
      body: `# ${title.trim()}\n\n`,
      tags: [],
      updatedAt: new Date().toISOString(),
      kind: "page",
    }
    onChange((current) => ({ ...current, pages: [...(current.pages ?? []), next] }))
    setPageId(next.id)
    setMode("edit")
  }

  function removePage(id: string) {
    const target = pages.find((item) => item.id === id)
    if (!target || target.kind === "index" || target.kind === "log") return
    onChange((current) => ({ ...current, pages: (current.pages ?? []).filter((item) => item.id !== id) }))
  }

  useEffect(() => {
    const root = preview.current
    if (!root || mode !== "preview") return
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      if (!target) return
      const pageBtn = target.closest("[data-wiki-page]") as HTMLElement | null
      if (pageBtn?.dataset.wikiPage) {
        event.preventDefault()
        openOrCreateByTitle(pageBtn.dataset.wikiPage)
        return
      }
      const refBtn = target.closest("[data-wiki-ref]") as HTMLElement | null
      if (refBtn?.dataset.wikiRef) {
        event.preventDefault()
        const parsed = parseReference(refBtn.dataset.wikiRef)
        if (parsed) onOpenScripture(parsed.book, parsed.chapter, parsed.verse)
      }
    }
    root.addEventListener("click", onClick)
    return () => root.removeEventListener("click", onClick)
  })

  if (!page) {
    return (
      <div className="wiki-pane">
        <p className="quiet">No wiki pages yet.</p>
        <Button type="button" onClick={newPage}>
          <FilePlus size={14} /> New page
        </Button>
      </div>
    )
  }

  const html = renderWikiMarkdown(page.body, (target) => Boolean(parseReference(target)))

  return (
    <div className="wiki-pane">
      <aside className="wiki-rail" aria-label="Wiki pages">
        <div className="wiki-rail-tools">
          <Input aria-label="Search wiki pages" value={filter} placeholder="Search pages" onChange={(event) => setFilter(event.target.value)} />
          <Button type="button" size="sm" onClick={newPage} aria-label="New wiki page">
            <FilePlus size={14} /> New
          </Button>
        </div>
        <ul className="wiki-list">
          {listed.map((item) => (
            <li key={item.id}>
              <button type="button" aria-current={item.id === page.id ? "page" : undefined} onClick={() => setPageId(item.id)}>
                <span>{item.title}</span>
                {item.kind === "index" || item.kind === "log" ? <small>{item.kind}</small> : null}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="wiki-stage">
        <div className="wiki-toolbar">
          <Input
            aria-label="Page title"
            value={page.title}
            onChange={(event) => patchPage(page.id, { title: event.target.value })}
            disabled={page.kind === "index" || page.kind === "log"}
          />
          <div className="segmented small" role="tablist" aria-label="Wiki edit mode">
            <button type="button" role="tab" aria-selected={mode === "edit"} onClick={() => setMode("edit")}>
              <Pencil size={14} /> Edit
            </button>
            <button type="button" role="tab" aria-selected={mode === "preview"} onClick={() => setMode("preview")}>
              <Eye size={14} /> Preview
            </button>
          </div>
          {page.kind === "page" ? (
            <Button type="button" size="sm" variant="outline" onClick={() => removePage(page.id)} aria-label="Delete page">
              <Trash2 size={14} />
            </Button>
          ) : null}
        </div>
        {mode === "edit" ? (
          <textarea
            className="wiki-editor"
            aria-label={`Edit ${page.title}`}
            value={page.body}
            onChange={(event) => patchPage(page.id, { body: event.target.value })}
            placeholder="# Title&#10;&#10;Write in markdown. Link with [[Page]] or [[John 3:16]]."
          />
        ) : (
          <div className="wiki-preview" ref={preview} dangerouslySetInnerHTML={{ __html: html }} />
        )}
        {backlinks.length ? (
          <p className="wiki-backlinks">
            <BookMarked size={14} aria-hidden="true" /> Backlinks:{" "}
            {backlinks.map((item, index) => (
              <span key={item.id}>
                {index ? ", " : ""}
                <button type="button" className="wiki-link wiki-page" onClick={() => setPageId(item.id)}>
                  {item.title}
                </button>
              </span>
            ))}
          </p>
        ) : (
          <p className="quiet wiki-backlinks">No backlinks yet. Other pages can point here with [[{page.title}]].</p>
        )}
      </div>
    </div>
  )
}

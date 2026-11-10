import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import type { Notebook, NotebookDrawing } from "../notebooks"
import { capDrawingFiles, MAX_DRAWING_FILES_BYTES } from "../notebooks"
import { sketchBoardTheme } from "../theme"
import "@excalidraw/excalidraw/index.css"

const Excalidraw = lazy(async () => {
  const mod = await import("@excalidraw/excalidraw")
  return { default: mod.Excalidraw }
})

type SketchBoardProps = {
  notebook: Notebook
  onChange: (update: (notebook: Notebook) => Notebook) => void
}

function useDeskTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">(() => sketchBoardTheme(document.documentElement.dataset.theme))
  useEffect(() => {
    const el = document.documentElement
    const sync = () => setTheme(sketchBoardTheme(el.dataset.theme))
    const obs = new MutationObserver(sync)
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] })
    return () => obs.disconnect()
  }, [])
  return theme
}

function slimAppState(appState: Record<string, unknown>) {
  const {
    collaborators: _c,
    currentChartType: _t,
    pasteDialog: _p,
    ...rest
  } = appState
  return {
    viewBackgroundColor: rest.viewBackgroundColor,
    currentItemStrokeColor: rest.currentItemStrokeColor,
    currentItemBackgroundColor: rest.currentItemBackgroundColor,
    currentItemFillStyle: rest.currentItemFillStyle,
    currentItemStrokeWidth: rest.currentItemStrokeWidth,
    currentItemStrokeStyle: rest.currentItemStrokeStyle,
    currentItemRoughness: rest.currentItemRoughness,
    currentItemOpacity: rest.currentItemOpacity,
    currentItemFontFamily: rest.currentItemFontFamily,
    currentItemFontSize: rest.currentItemFontSize,
    currentItemTextAlign: rest.currentItemTextAlign,
    currentItemStartArrowhead: rest.currentItemStartArrowhead,
    currentItemEndArrowhead: rest.currentItemEndArrowhead,
    scrollX: rest.scrollX,
    scrollY: rest.scrollY,
    zoom: rest.zoom,
    gridSize: rest.gridSize,
  }
}

const maxMb = Math.round(MAX_DRAWING_FILES_BYTES / (1024 * 1024))

export function SketchBoard({ notebook, onChange }: SketchBoardProps) {
  const theme = useDeskTheme()
  const saveTimer = useRef<number | null>(null)
  const notebookId = notebook.id
  const notebookIdRef = useRef(notebookId)
  notebookIdRef.current = notebookId
  const [fileNote, setFileNote] = useState<string | null>(null)
  const initial = useMemo(() => {
    const drawing = notebook.drawing
    if (!drawing?.elements?.length && !drawing?.files) {
      return { elements: [], appState: { theme }, files: {} }
    }
    const capped = capDrawingFiles(drawing.files)
    return {
      elements: drawing.elements as never[],
      appState: { ...(drawing.appState ?? {}), theme },
      files: capped.files as never,
    }
    // Only seed when the notebook identity changes — live edits write through onChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notebookId])

  useEffect(() => {
    if (saveTimer.current != null) {
      window.clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    setFileNote(null)
    return () => {
      if (saveTimer.current != null) window.clearTimeout(saveTimer.current)
    }
  }, [notebookId])

  function persist(drawing: NotebookDrawing, fromId: string) {
    if (saveTimer.current != null) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      if (notebookIdRef.current !== fromId) return
      onChange((page) => (page.id === fromId ? { ...page, drawing } : page))
    }, 400)
  }

  return (
    <div className="sketch-board" aria-label="Drawing board">
      {fileNote ? (
        <p className="quiet sketch-file-note" role="status">
          {fileNote}
        </p>
      ) : null}
      <Suspense fallback={<p className="quiet sketch-loading">Loading the drawing board…</p>}>
        <Excalidraw
          key={notebookId}
          theme={theme}
          initialData={initial}
          UIOptions={{
            canvasActions: {
              loadScene: true,
              saveToActiveFile: false,
              export: { saveFileToDisk: true },
              toggleTheme: false,
            },
          }}
          onChange={(elements, appState, files) => {
            const capped = capDrawingFiles(files as unknown as Record<string, unknown>)
            if (capped.trimmed) {
              setFileNote(`Drawing images capped at ${maxMb} MB so notebooks stay small on this device.`)
            }
            persist(
              {
                elements: elements as unknown[],
                appState: slimAppState(appState as unknown as Record<string, unknown>),
                files: capped.files,
              },
              notebookId,
            )
          }}
        />
      </Suspense>
    </div>
  )
}

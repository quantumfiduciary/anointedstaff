import { exportPdf, fileSafe } from "../../pdf"
import { chartReport } from "./caption"
import type { NatalChart } from "./types"

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportChartSvg(svg: SVGSVGElement, chart: NatalChart) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  if (!clone.getAttribute("width")) clone.setAttribute("width", "840")
  if (!clone.getAttribute("height")) clone.setAttribute("height", "840")
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`
  const name = fileSafe(chart.subject.name || `chart-${chart.subject.date}`)
  downloadBlob(`${name}-wheel.svg`, new Blob([xml], { type: "image/svg+xml;charset=utf-8" }))
}

export function exportChartPng(svg: SVGSVGElement, chart: NatalChart): Promise<void> {
  return new Promise((resolve, reject) => {
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    const width = 840
    const height = 840
    clone.setAttribute("width", String(width))
    clone.setAttribute("height", String(height))
    const xml = new XMLSerializer().serializeToString(clone)
    const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }))
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error("Canvas unavailable"))
        return
      }
      ctx.fillStyle = "#f7f3ea"
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(image, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("PNG failed"))
          return
        }
        const name = fileSafe(chart.subject.name || `chart-${chart.subject.date}`)
        downloadBlob(`${name}-wheel.png`, blob)
        resolve()
      }, "image/png")
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("SVG rasterize failed"))
    }
    image.src = url
  })
}

export function exportChartPdf(chart: NatalChart) {
  const title = chart.subject.name ? `${chart.subject.name} · Cast chart` : `Cast chart · ${chart.subject.date}`
  const body = chartReport(chart)
  const [head, ...rest] = body.split("\n\n")
  exportPdf(
    {
      title,
      subtitle: `${chart.subject.placeLabel} · ${chart.subject.date}${chart.subject.time ? ` ${chart.subject.time}` : ""} · Anointed Staff desk generator`,
      sections: [
        { heading: "Chart", body: head },
        ...rest.map((block) => {
          const lines = block.split("\n")
          if (lines.length > 1 && !lines[0].includes("°") && lines[0].length < 40) {
            return { heading: lines[0], body: lines.slice(1).join("\n") }
          }
          return { body: block }
        }),
      ],
      footer: "Anointed Staff · desk ephemeris · study beside Scripture",
    },
    `${fileSafe(chart.subject.name || `chart-${chart.subject.date}`)}-sheet`,
  )
}

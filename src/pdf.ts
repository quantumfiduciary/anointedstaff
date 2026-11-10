import { jsPDF } from "jspdf"

export type PdfSection = { heading?: string; body: string; quote?: boolean }

export type PdfDocument = {
  title: string
  subtitle?: string
  sections: PdfSection[]
  footer?: string
}

const swaps: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u2026": "...",
  "\u00A0": " ",
  "\u2212": "-",
}

/** The built-in PDF fonts carry Latin-1 only, so Hebrew and Greek are named rather than drawn. */
function printable(text: string) {
  let out = ""
  let foreign = false
  for (const char of text.normalize("NFC")) {
    const swap = swaps[char]
    if (swap) {
      out += swap
      foreign = false
      continue
    }
    const code = char.codePointAt(0) ?? 0
    if (code === 10 || (code >= 32 && code <= 255)) {
      out += char
      foreign = false
      continue
    }
    if (!foreign) out += "[original script]"
    foreign = true
  }
  return out.replace(/(\[original script\]\s*)+/g, "[original script] ")
}

export function fileSafe(name: string) {
  return name.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "study"
}

export function exportPdf(doc: PdfDocument, filename: string) {
  const pdf = new jsPDF({ unit: "pt", format: "letter" })
  const width = pdf.internal.pageSize.getWidth()
  const height = pdf.internal.pageSize.getHeight()
  const margin = 56
  const column = width - margin * 2
  let y = margin

  function room(needed: number) {
    if (y + needed <= height - margin) return
    pdf.addPage()
    y = margin
  }

  pdf.setFont("times", "bold")
  pdf.setFontSize(22)
  for (const line of pdf.splitTextToSize(printable(doc.title), column) as string[]) {
    room(28)
    pdf.text(line, margin, y)
    y += 26
  }
  if (doc.subtitle) {
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
    pdf.setTextColor(110)
    pdf.text(printable(doc.subtitle), margin, y)
    pdf.setTextColor(0)
    y += 14
  }
  pdf.setDrawColor(160, 120, 60)
  pdf.line(margin, y, width - margin, y)
  y += 22

  for (const section of doc.sections) {
    if (section.heading) {
      room(34)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(11)
      pdf.setTextColor(122, 78, 26)
      pdf.text(printable(section.heading).toUpperCase(), margin, y)
      pdf.setTextColor(0)
      y += 16
    }
    pdf.setFont("times", section.quote ? "italic" : "normal")
    pdf.setFontSize(12)
    const indent = section.quote ? 14 : 0
    for (const paragraph of printable(section.body).split(/\n/)) {
      if (!paragraph.trim()) {
        y += 8
        continue
      }
      for (const line of pdf.splitTextToSize(paragraph, column - indent) as string[]) {
        room(16)
        pdf.text(line, margin + indent, y)
        y += 16
      }
    }
    y += 12
  }

  const pages = pdf.getNumberOfPages()
  const footer = printable(doc.footer ?? "Anointed Staff")
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(8)
    pdf.setTextColor(130)
    pdf.text(footer, margin, height - 28)
    pdf.text(`${page} / ${pages}`, width - margin, height - 28, { align: "right" })
  }
  pdf.save(`${fileSafe(filename)}.pdf`)
}

import { lessonByNumber, type LetterLesson } from "./letterStudy"

export type MatrixNode = {
  id: string
  slot: string
  label: string
  number: number
  lesson: LetterLesson
  note: string
}

/**
 * A birth-date letter grid for this desk.
 * Original count: day, month, year, and their sums folded onto the 22 letters.
 * Not a Destiny Matrix reprint, not a licensed soul-blueprint table.
 */
export function letterMatrix(isoDate: string): MatrixNode[] {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const year = match ? Number(match[1]) : new Date().getFullYear()
  const month = match ? Number(match[2]) : new Date().getMonth() + 1
  const day = match ? Number(match[3]) : new Date().getDate()
  const yearFold = digitSum(year)
  const rows: { id: string; slot: string; label: string; number: number; note: string }[] = [
    { id: "day", slot: "day", label: "Day", number: day, note: "The day you were born. The letter of that count." },
    { id: "month", slot: "month", label: "Month", number: month, note: "The month of the year. A season letter." },
    { id: "year", slot: "year", label: "Year", number: yearFold, note: "The year’s digits, folded once." },
    { id: "breath", slot: "breath", label: "Breath", number: day + month, note: "Day and month together. What the year opens with." },
    { id: "walk", slot: "walk", label: "Walk", number: month + yearFold, note: "Month and year. The path through the seasons." },
    { id: "name", slot: "name", label: "Name", number: day + yearFold, note: "Day and year. The mark on that year’s calendar." },
    { id: "center", slot: "center", label: "Center", number: day + month + yearFold, note: "The three counts together. The middle of the grid." },
    { id: "witness", slot: "witness", label: "Witness", number: digitSum(day) + digitSum(month) + digitSum(year), note: "Every digit of the date, summed. A second witness." },
  ]
  return rows.map((row) => ({
    ...row,
    lesson: lessonByNumber(row.number),
  }))
}

function digitSum(n: number) {
  return String(Math.abs(Math.trunc(n)))
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0)
}

export function matrixCaption(isoDate: string, nodes: MatrixNode[]) {
  const center = nodes.find((node) => node.id === "center")
  return [
    `Letter matrix · ${isoDate}`,
    center ? `Center ${center.lesson.glyph} ${center.lesson.name} · ${center.number} → ${center.lesson.value}` : "",
    "",
    ...nodes.map((node) => `${node.label}: ${node.number} → ${node.lesson.glyph} ${node.lesson.name} (${node.lesson.picture})`),
    "",
    "An original alef-bet count of the date. Not a Destiny Matrix, not a fortune.",
  ]
    .filter(Boolean)
    .join("\n")
}

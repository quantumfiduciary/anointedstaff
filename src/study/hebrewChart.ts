import rows from "./hebrew-chart.json"

export type ChartLetter = {
  glyph: string
  name: string
  english: string
  sound: string
  value: number
  picture: string
  meaning: string
  arcanum: string
  attribution: string
  attributionMeaning: string
}

export const hebrewChart: ChartLetter[] = (rows as ChartLetter[]).filter((letter) => /^[\u05D0-\u05EA]$/.test(letter.glyph))

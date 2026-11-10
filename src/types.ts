export const translationIds = ["kjv", "asv", "ylt", "darby", "bbe", "drc"] as const

export type TranslationId = (typeof translationIds)[number]

export function isTranslationId(value: string | null | undefined): value is TranslationId {
  return translationIds.includes(value as TranslationId)
}

export type Scripture = {
  translations: {
    id: TranslationId
    label: string
    name: string
    year: string
    rights: string
  }[]
  source: string
  text: Record<TranslationId, string[][][]>
}

export type Place = {
  book: number
  chapter: number
  verse: number | null
}

export type Highlight = "amber" | "olive" | "rose" | "ink"

export type Mark = {
  color?: Highlight
  note?: string
  bookmark?: boolean
}

export type Passage = {
  book: number
  chapter: number
  verse: number | null
}

export const highlights: { id: Highlight; label: string }[] = [
  { id: "amber", label: "Gold" },
  { id: "olive", label: "Olive" },
  { id: "rose", label: "Rose" },
  { id: "ink", label: "Ink" },
]

/**
 * Practice flashcard decks — letters, aroma lines, Hebrew parse forms.
 * Desk-authored prompts; no third-party Berean dumps.
 */

import { letterLessons } from "./letterStudy"
import { parseCards, shuffleCards, type ParseCard } from "./hebrewParse"

export type CardDeckId = "letters" | "aroma" | "parse"

export type FlashCard = {
  id: string
  deck: CardDeckId
  front: string
  back: string
  hint?: string
  ref?: string
}

export const deckLabels: Record<CardDeckId, string> = {
  letters: "Hebrew letters",
  aroma: "Aroma list",
  parse: "Verb forms",
}

export function letterFlashCards(): FlashCard[] {
  return letterLessons.map((lesson) => ({
    id: `letter-${lesson.glyph}`,
    deck: "letters" as const,
    front: `${lesson.glyph}  ·  what is the name and picture?`,
    back: `${lesson.name} · ${lesson.picture} · value ${lesson.value}\n${lesson.meaning}`,
    hint: lesson.english,
    ref: lesson.sample.ref,
  }))
}

export function parseFlashCards(cards: ParseCard[] = parseCards): FlashCard[] {
  return cards.map((card, index) => ({
    id: `parse-${index}-${card.form}`,
    deck: "parse" as const,
    front: `${card.form}\nRoot ${card.root} · ${card.gloss}`,
    back: card.label,
    hint: card.tags.join(" "),
    ref: card.sample,
  }))
}

/** Split aroma-style "Name - gloss" lines from practice.json paragraphs. */
export function aromaFlashCards(paragraphs: string[]): FlashCard[] {
  const cards: FlashCard[] = []
  for (const raw of paragraphs) {
    const line = raw.replace(/^\uFEFF/, "").trim()
    if (!line || line.toUpperCase() === "AROMA'S LIST") continue
    const split = line.includes(" - ") ? line.split(" - ") : line.includes(" — ") ? line.split(" — ") : null
    if (!split || split.length < 2) continue
    const [front, ...rest] = split
    const back = rest.join(" - ").trim()
    if (front.trim().length < 2 || back.length < 2) continue
    cards.push({
      id: `aroma-${cards.length}-${front.trim().slice(0, 24)}`,
      deck: "aroma",
      front: front.trim(),
      back,
    })
  }
  return cards
}

export function shuffleFlashCards(cards: FlashCard[]): FlashCard[] {
  const copy = [...cards]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function buildDeck(id: CardDeckId, aromaParagraphs: string[] = []): FlashCard[] {
  if (id === "letters") return shuffleFlashCards(letterFlashCards())
  if (id === "aroma") return shuffleFlashCards(aromaFlashCards(aromaParagraphs))
  return shuffleFlashCards(parseFlashCards(shuffleCards()))
}

const progressKey = "anointed-staff.practice-cards"

export type CardProgress = { seen: number; known: number; lastDeck: CardDeckId }

export function readCardProgress(): CardProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(progressKey) ?? "null") as CardProgress | null
    if (raw && typeof raw.seen === "number") return raw
  } catch {
    /* ignore */
  }
  return { seen: 0, known: 0, lastDeck: "letters" }
}

export function writeCardProgress(progress: CardProgress) {
  localStorage.setItem(progressKey, JSON.stringify(progress))
}

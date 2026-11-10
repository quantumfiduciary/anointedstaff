import type { ReactNode } from "react"
import { parseReference } from "./reference"

/** Candidate scripture citations in free prose (book + chapter[:verse]). */
const REF_PATTERN =
  /\b((?:[123]\s+)?[A-Za-z][A-Za-z.]+(?:\s+[A-Za-z][A-Za-z.]+)?)\s+(\d{1,3})(?::(\d{1,3})(?:\s*[-–]\s*\d{1,3})?)?\b/g

export function extractScriptureRefs(text: string, limit = 8): string[] {
  const found: string[] = []
  const seen = new Set<string>()
  for (const match of text.matchAll(REF_PATTERN)) {
    const cleaned = match[0].replace(/\s*[-–]\s*\d{1,3}$/, "").replace(/\./g, "").replace(/\s+/g, " ").trim()
    const parsed = parseReference(cleaned)
    if (!parsed) continue
    const key = `${parsed.book}:${parsed.chapter}:${parsed.verse ?? ""}`
    if (seen.has(key)) continue
    seen.add(key)
    found.push(cleaned)
    if (found.length >= limit) break
  }
  return found
}

/** Anointed Staff follow-up prompts after an AI reply. */
export function followUpsFor(where: string, agentText: string): string[] {
  const refs = extractScriptureRefs(agentText).filter((ref) => !ref.toLowerCase().includes(where.split(" ")[0]?.toLowerCase() ?? "\0"))
  const prompts = [
    `What did the first hearers already know when they heard ${where}?`,
    `Give three study questions from ${where} for a small group.`,
    `Outline ${where} in plain steps without leaving the given verses.`,
  ]
  if (refs[0]) {
    prompts.unshift(`Compare ${where} with ${refs[0]} in one short paragraph, quoting only those lines.`)
  } else {
    prompts.unshift(`Open the strongest cross-references for ${where} and say how they answer each other.`)
  }
  return prompts.slice(0, 3)
}

export function ChatCitedText({
  text,
  onOpenRef,
}: {
  text: string
  onOpenRef?: (reference: string) => void
}): ReactNode {
  if (!onOpenRef) return text
  const nodes: ReactNode[] = []
  let cursor = 0
  let key = 0
  for (const match of text.matchAll(REF_PATTERN)) {
    const index = match.index ?? 0
    if (index < cursor) continue
    const raw = match[0]
    const cleaned = raw.replace(/\s*[-–]\s*\d{1,3}$/, "").replace(/\./g, "").replace(/\s+/g, " ").trim()
    if (!parseReference(cleaned)) continue
    if (index > cursor) nodes.push(text.slice(cursor, index))
    nodes.push(
      <button
        key={`ref-${key++}`}
        type="button"
        className="chat-cite"
        onClick={() => onOpenRef(cleaned)}
        title={`Open ${cleaned}`}
      >
        {raw}
      </button>,
    )
    cursor = index + raw.length
  }
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes.length ? nodes : text
}

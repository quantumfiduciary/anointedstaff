/** Desk chat skills: quick tools and a short system harness for the model. */

export type ChatSkill = {
  id: string
  label: string
  /** Sent as the user question (study packet wraps it). */
  prompt: string
  /** Extra system lines when this skill is active. */
  harness?: string
}

export const chatSkills: ChatSkill[] = [
  {
    id: "explain",
    label: "Explain simply",
    prompt: "Explain this passage simply for a careful reader.",
    harness: "Skill: explain. Use plain words. Keep one short page. Quote the open verse once.",
  },
  {
    id: "speaker",
    label: "Who speaks",
    prompt: "Who is speaking here, and to whom?",
    harness: "Skill: speakers. Name the speaker and hearers from the given verses only.",
  },
  {
    id: "words",
    label: "Key words",
    prompt: "What words here matter most in the Hebrew or Greek?",
    harness: "Skill: key words. Prefer Strong's glosses you were given. Do not invent lemmas.",
  },
  {
    id: "questions",
    label: "Study questions",
    prompt: "Give me three questions to think on from this passage.",
    harness: "Skill: questions. Three numbered questions. No long preface.",
  },
  {
    id: "outline",
    label: "Outline",
    prompt: "Outline the flow of this chapter in short bullets.",
    harness: "Skill: outline. Short bullets only. Stay inside the supplied verses.",
  },
  {
    id: "compare",
    label: "Compare line",
    prompt: "How does the compare translation line sharpen or soften this verse?",
    harness: "Skill: compare. Use the compare line when present. If none, say so and stop.",
  },
  {
    id: "notebook",
    label: "With my notes",
    prompt: "Read my notebook cards beside this verse and say what they add.",
    harness: "Skill: notebook. Use only notebook cards in the packet. Do not invent cards.",
  },
  {
    id: "wiki",
    label: "Ask the wiki",
    prompt: "Ask from my wiki pages what matters for this verse.",
    harness:
      "Skill: wiki. Prefer the Wiki section and page excerpts in the notebook packet. Cite [[Page Title]] links. Do not invent pages. Quote only supplied verses.",
  },
  {
    id: "ingest",
    label: "Ingest passage",
    prompt: "ingest wiki",
    harness:
      "Skill: ingest. Maintain the study wiki: one markdown page for the open passage, update Index and Log mentally. Use [[wikilinks]]. Quote only given verses.",
  },
]

/** Desk window / lookup shortcuts shown beside chat skills. */
export const deskQuickTools: { id: string; label: string; command: string; tip: string }[] = [
  { id: "strongs", label: "Strong's", command: "strongs", tip: "Open Strong's on this verse" },
  { id: "roots", label: "Roots", command: "roots", tip: "Open the etymology chain" },
  { id: "outside", label: "Extra-canon", command: "writings", tip: "Open Extra-canon" },
  { id: "gematria", label: "Count", command: "gematria", tip: "Open Gematria" },
  { id: "heavens", label: "Heavens", command: "heavens", tip: "Open the sky chart" },
  { id: "today", label: "Today", command: "today", tip: "Jump to today's reading" },
]

export function matchSkill(text: string): ChatSkill | undefined {
  const q = text.trim().toLowerCase()
  return chatSkills.find((skill) => skill.prompt.toLowerCase() === q || skill.label.toLowerCase() === q)
}

export function skillHarness(command: string): string {
  const skill = matchSkill(command)
  return skill?.harness ?? "Skill: free ask. Answer the question. Quote only the verses and Strong's glosses given to you."
}

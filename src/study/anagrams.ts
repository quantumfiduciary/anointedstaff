const finalToMedial: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" }

function stripMarks(raw: string) {
  return raw.normalize("NFC").replace(/[\u0591-\u05C7״׳]/g, "")
}

export function latinLetters(raw: string) {
  return [...raw.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")].filter((glyph) => /[a-z]/.test(glyph))
}

export function hebrewLetters(raw: string) {
  return [...stripMarks(raw)].filter((glyph) => /[\u05D0-\u05EA]/.test(glyph)).map((glyph) => finalToMedial[glyph] ?? glyph)
}

export function bagKey(glyphs: string[]) {
  return [...glyphs].sort().join("")
}

function counts(glyphs: string[]) {
  const map = new Map<string, number>()
  for (const glyph of glyphs) map.set(glyph, (map.get(glyph) ?? 0) + 1)
  return map
}

function fits(need: Map<string, number>, have: Map<string, number>) {
  for (const [glyph, n] of need) {
    if ((have.get(glyph) ?? 0) < n) return false
  }
  return true
}

function leftover(have: Map<string, number>, used: string[]) {
  const next = new Map(have)
  for (const glyph of used) next.set(glyph, (next.get(glyph) ?? 0) - 1)
  const out: string[] = []
  for (const [glyph, n] of next) {
    for (let i = 0; i < n; i++) out.push(glyph)
  }
  return out
}

function permuteUnique(glyphs: string[], limit: number) {
  const n = glyphs.length
  if (n < 2 || n > 8 || limit < 1) return [] as string[]
  const sorted = [...glyphs].sort()
  const out: string[] = []
  const used = new Array(n).fill(false)
  const path: string[] = []
  const walk = () => {
    if (out.length >= limit) return
    if (path.length === n) {
      out.push(path.join(""))
      return
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue
      if (i > 0 && sorted[i] === sorted[i - 1] && !used[i - 1]) continue
      used[i] = true
      path.push(sorted[i])
      walk()
      path.pop()
      used[i] = false
    }
  }
  walk()
  return out
}

function wordsOf(text: string, script: "latin" | "hebrew") {
  if (script === "hebrew") {
    return stripMarks(text)
      .split(/[^\u05D0-\u05EA]+/)
      .filter((word) => word.length >= 2)
  }
  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word.length >= 2)
}

export type AnagramHit = {
  word: string
  kind: "rearrange" | "chapter" | "from-letters" | "pair"
  script: "latin" | "hebrew"
}

export type AnagramReport = {
  script: "latin" | "hebrew" | "empty"
  letters: string[]
  key: string
  truncated: boolean
  hits: AnagramHit[]
}

export function anagramsOf(seed: string, pools: { latin?: string; hebrew?: string }, limit = 56): AnagramReport {
  const hebrew = hebrewLetters(seed)
  const latin = latinLetters(seed)
  if (!hebrew.length && !latin.length) return { script: "empty", letters: [], key: "", truncated: false, hits: [] }
  const script: "latin" | "hebrew" = hebrew.length >= latin.length ? "hebrew" : "latin"
  const letters = script === "hebrew" ? hebrew : latin
  const key = bagKey(letters)
  const have = counts(letters)
  const original = letters.join("")
  const hits: AnagramHit[] = []
  const truncated = letters.length > 8
  const rearrangements = permuteUnique(letters, 40)
  for (const word of rearrangements) {
    if (word === original) continue
    hits.push({ word, kind: "rearrange", script })
  }

  const poolText = script === "hebrew" ? (pools.hebrew ?? "") : (pools.latin ?? "")
  const poolWords = [...new Set(wordsOf(poolText, script))]
  const byKey = new Map<string, string[]>()
  for (const word of poolWords) {
    const bag = script === "hebrew" ? hebrewLetters(word) : latinLetters(word)
    if (bag.length < 2) continue
    const wordKey = bagKey(bag)
    const list = byKey.get(wordKey) ?? []
    list.push(word)
    byKey.set(wordKey, list)
    if (wordKey === key && word.replace(/\s/g, "").toLowerCase() !== seed.replace(/\s/g, "").toLowerCase()) {
      hits.push({ word, kind: "chapter", script })
    } else if (wordKey !== key && bag.length < letters.length && fits(counts(bag), have)) {
      hits.push({ word, kind: "from-letters", script })
    }
  }

  if (letters.length >= 4 && letters.length <= 12) {
    const short = poolWords.filter((word) => {
      const bag = script === "hebrew" ? hebrewLetters(word) : latinLetters(word)
      return bag.length >= 2 && bag.length <= letters.length - 2 && fits(counts(bag), have)
    }).slice(0, 90)
    const pairSeen = new Set<string>()
    for (const a of short) {
      if (pairSeen.size >= 12) break
      const aBag = script === "hebrew" ? hebrewLetters(a) : latinLetters(a)
      const remainKey = bagKey(leftover(have, aBag))
      const mates = byKey.get(remainKey) ?? []
      for (const b of mates) {
        if (b === a) continue
        const label = [a, b].sort().join(" ")
        if (pairSeen.has(label)) continue
        pairSeen.add(label)
        hits.push({ word: `${a} ${b}`, kind: "pair", script })
        if (pairSeen.size >= 12) break
      }
    }
  }

  const seen = new Set<string>()
  const unique: AnagramHit[] = []
  for (const hit of hits) {
    const id = `${hit.kind}:${hit.word}`
    if (seen.has(id)) continue
    seen.add(id)
    unique.push(hit)
    if (unique.length >= limit) break
  }
  return { script, letters, key, truncated, hits: unique }
}

import { hebrewChart, type ChartLetter } from "./hebrewChart"
import { letters, paleoLetters } from "./hebrew"
import { letterClass, letterGroups, type LetterClass } from "./yetzirah"

export type LetterLesson = {
  glyph: string
  paleo: string
  name: string
  english: string
  sound: string
  picture: string
  /** Short primary gloss for the pictograph (desk-authored). */
  meaning: string
  /** Extra paleo-sense glosses shown on Learn / Study Letters. */
  meanings: string[]
  value: number
  group: LetterClass
  groupLabel: string
  groupNote: string
  sample: { hebrew: string; gloss: string; ref: string }
  line: string
  sofit?: { glyph: string; name: string; value: number }
}

type Sample = { hebrew: string; gloss: string; ref: string; line: string }

/** Short original study notes. Sample words are ordinary Biblical Hebrew, not a commentary reprint. */
const samples: Record<string, Sample> = {
  א: { hebrew: "אב", gloss: "father", ref: "Genesis 17:5", line: "Alef is often silent. It stands at the front of the alef-bet the way an ox leads a herd." },
  ב: { hebrew: "בית", gloss: "house", ref: "Genesis 1:1", line: "Bet is the first letter of Genesis. The Torah opens inside a house of beginning." },
  ג: { hebrew: "גן", gloss: "garden", ref: "Genesis 2:8", line: "Gimel is the camel that lifts and carries. The garden is the first place the letter walks." },
  ד: { hebrew: "דבר", gloss: "word", ref: "Genesis 15:1", line: "Dalet is a door. A word is an opening you can walk through or leave shut." },
  ה: { hebrew: "היא", gloss: "she / it", ref: "Genesis 2:23", line: "He is breath in the mouth. In the Name it appears twice, as window and as breath." },
  ו: { hebrew: "ויהי", gloss: "and there was", ref: "Genesis 1:3", line: "Vav is a hook that joins. It is the and that stitches verse to verse." },
  ז: { hebrew: "זכר", gloss: "remember", ref: "Exodus 20:8", line: "Zayin is a tool or a weapon. Memory cuts a day out of ordinary time." },
  ח: { hebrew: "חי", gloss: "alive", ref: "Genesis 2:7", line: "Chet is a fence. Life in Hebrew is often what is enclosed and kept." },
  ט: { hebrew: "טוב", gloss: "good", ref: "Genesis 1:4", line: "Tet is a basket. The first good is light gathered, not scattered." },
  י: { hebrew: "יד", gloss: "hand", ref: "Exodus 15:6", line: "Yod is the smallest letter and the first letter of the Name. A hand is enough." },
  כ: { hebrew: "כל", gloss: "all", ref: "Genesis 1:31", line: "Kaf is a palm. What the palm can hold is the whole of a day." },
  ל: { hebrew: "לב", gloss: "heart", ref: "Deuteronomy 6:5", line: "Lamed is a goad. It is the only letter that rises above the line, as teaching lifts." },
  מ: { hebrew: "מים", gloss: "waters", ref: "Genesis 1:2", line: "Mem is water. It is a mother letter: the deep that the Spirit moves on." },
  נ: { hebrew: "נפש", gloss: "life / soul", ref: "Genesis 2:7", line: "Nun is a fish, something that lives in the mem. A soul is life that swims." },
  ס: { hebrew: "ספר", gloss: "book / count", ref: "Genesis 5:1", line: "Samekh is a prop. A book holds a line of names so they do not fall." },
  ע: { hebrew: "עין", gloss: "eye / spring", ref: "Genesis 16:7", line: "Ayin is an eye. In Hebrew the same word can be a spring of water." },
  פ: { hebrew: "פה", gloss: "mouth", ref: "Exodus 4:10", line: "Pe is a mouth. Speech in Scripture often starts here, even when the mouth feels slow." },
  צ: { hebrew: "צדק", gloss: "righteousness", ref: "Genesis 15:6", line: "Tsade is a hunt or a hook. Righteousness in Hebrew is a path you track." },
  ק: { hebrew: "קול", gloss: "voice", ref: "Genesis 3:8", line: "Qof is the horizon, the back of the head. A voice can come from just beyond what you see." },
  ר: { hebrew: "ראש", gloss: "head", ref: "Genesis 1:1", line: "Resh is a head. Beginning and chief are the same picture in Hebrew." },
  ש: { hebrew: "שלום", gloss: "peace", ref: "Numbers 6:26", line: "Shin is a tooth, a mother letter of fire. Peace in Hebrew is wholeness, not quiet only." },
  ת: { hebrew: "אות", gloss: "sign", ref: "Genesis 1:14", line: "Tav is a mark. The alef-bet ends with a sign you can set on a day or a people." },
}

/** Desk-authored paleo glosses (2–4). Not a scrape of chart / Tarot / angel overlays. */
const meaningsByGlyph: Record<string, string[]> = {
  א: ["strength", "leader", "first"],
  ב: ["in", "household", "family", "into"],
  ג: ["lift up", "gather", "travel"],
  ד: ["pathway", "enter", "leave"],
  ה: ["reveal", "breath", "look"],
  ו: ["and", "join", "secure"],
  ז: ["cut", "weapon", "tool"],
  ח: ["fence", "private", "life kept"],
  ט: ["gather", "surround", "good held"],
  י: ["hand", "work", "deed"],
  כ: ["palm", "cover", "allow"],
  ל: ["teach", "goad", "toward"],
  מ: ["waters", "chaos", "people"],
  נ: ["life", "seed", "continue"],
  ס: ["support", "prop", "circle"],
  ע: ["see", "know", "spring"],
  פ: ["speak", "edge", "open"],
  צ: ["hunt", "side", "righteous path"],
  ק: ["behind", "horizon", "holy"],
  ר: ["head", "chief", "beginning"],
  ש: ["consume", "press", "sharp"],
  ת: ["mark", "sign", "covenant"],
}

const sofitByRoot = new Map(
  letters
    .filter((letter) => letter.final)
    .map((letter) => {
      const rootName = letter.name.replace(" sofit", "")
      const root = letters.find((item) => item.name === rootName && !item.final)
      return [root?.glyph ?? "", { glyph: letter.glyph, name: letter.name, value: letter.value }] as const
    })
    .filter((entry) => entry[0]),
)

function lessonFrom(chart: ChartLetter): LetterLesson | null {
  const paleo = paleoLetters.find((item) => item.value === chart.value)
  const group = letterClass(chart.glyph)
  if (!paleo || !group) return null
  const groupMeta = letterGroups.find((item) => item.id === group)
  const sample = samples[chart.glyph]
  const core = letters.find((item) => item.glyph === chart.glyph)
  const glosses = meaningsByGlyph[chart.glyph]
  if (!sample || !groupMeta || !glosses?.length) return null
  return {
    glyph: chart.glyph,
    paleo: paleo.glyph,
    name: chart.name.replace(/^\w/, (letter) => letter.toUpperCase()),
    english: chart.english,
    sound: chart.sound,
    picture: core?.picture ?? chart.picture.split(",")[0]?.trim() ?? chart.picture,
    meaning: glosses[0],
    meanings: glosses,
    value: chart.value,
    group,
    groupLabel: groupMeta.label,
    groupNote: groupMeta.note,
    sample: { hebrew: sample.hebrew, gloss: sample.gloss, ref: sample.ref },
    line: sample.line,
    sofit: sofitByRoot.get(chart.glyph),
  }
}

export const letterLessons: LetterLesson[] = hebrewChart
  .map(lessonFrom)
  .filter((item): item is LetterLesson => item != null)

const groupHint: Record<LetterClass, string> = {
  mother: "one of the three mother letters",
  double: "one of the seven double letters",
  simple: "one of the twelve simple letters",
}

export function lessonOf(glyph: string) {
  return letterLessons.find((item) => item.glyph === glyph) ?? letterLessons[0]
}

/** Fold a count onto the twenty-two letters. 11 and 22 stay; larger sums reduce by digits. */
export function foldLetterNumber(n: number) {
  let value = Math.abs(Math.trunc(n))
  if (value === 0) return 22
  while (value > 22) {
    value = String(value)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0)
  }
  return value === 0 ? 22 : value
}

export function lessonByNumber(n: number) {
  return letterLessons[foldLetterNumber(n) - 1] ?? letterLessons[0]
}

export function speakLesson(lesson: LetterLesson) {
  return `${lesson.name}. ${lesson.sound}. Picture of ${lesson.picture}. Value ${lesson.value}. ${groupHint[lesson.group]}.`
}

export type LetterQuiz = {
  prompt: string
  kind: "picture" | "value" | "name"
  answer: string
  options: string[]
}

export function makeLetterQuiz(except?: string): LetterQuiz {
  const pool = letterLessons.filter((item) => item.glyph !== except)
  const answer = pool[Math.floor(Math.random() * pool.length)] ?? letterLessons[0]
  const others = letterLessons.filter((item) => item.glyph !== answer.glyph)
  const decoys = [others[Math.floor(Math.random() * others.length)], others[Math.floor(Math.random() * others.length)]].filter(
    (item, index, list) => item && list.findIndex((other) => other.glyph === item.glyph) === index && item.glyph !== answer.glyph,
  )
  while (decoys.length < 2) {
    const extra = others[Math.floor(Math.random() * others.length)]
    if (extra && !decoys.some((item) => item.glyph === extra.glyph)) decoys.push(extra)
  }
  const options = [answer, decoys[0], decoys[1]].map((item) => item.glyph)
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }
  const kind = (["picture", "value", "name"] as const)[Math.floor(Math.random() * 3)]
  const prompt =
    kind === "picture"
      ? `Which letter pictures “${answer.picture}”?`
      : kind === "value"
        ? `Which letter is ${answer.value}?`
        : `Which letter is ${answer.name}?`
  return { prompt, kind, answer: answer.glyph, options }
}

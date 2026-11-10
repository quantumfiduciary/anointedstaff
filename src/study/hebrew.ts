export type HebrewLetter = {
  glyph: string
  name: string
  value: number
  sound: string
  picture: string
  final?: boolean
}

/** Standard mispar hechrechi values and the usual ancient pictograph for each letter. */
export const letters: HebrewLetter[] = [
  { glyph: "א", name: "Alef", value: 1, sound: "silent", picture: "ox" },
  { glyph: "ב", name: "Bet", value: 2, sound: "b", picture: "house" },
  { glyph: "ג", name: "Gimel", value: 3, sound: "g", picture: "camel" },
  { glyph: "ד", name: "Dalet", value: 4, sound: "d", picture: "door" },
  { glyph: "ה", name: "He", value: 5, sound: "h", picture: "window" },
  { glyph: "ו", name: "Vav", value: 6, sound: "v", picture: "hook" },
  { glyph: "ז", name: "Zayin", value: 7, sound: "z", picture: "weapon" },
  { glyph: "ח", name: "Chet", value: 8, sound: "ch", picture: "fence" },
  { glyph: "ט", name: "Tet", value: 9, sound: "t", picture: "basket" },
  { glyph: "י", name: "Yod", value: 10, sound: "y", picture: "hand" },
  { glyph: "כ", name: "Kaf", value: 20, sound: "k", picture: "palm" },
  { glyph: "ל", name: "Lamed", value: 30, sound: "l", picture: "goad" },
  { glyph: "מ", name: "Mem", value: 40, sound: "m", picture: "water" },
  { glyph: "נ", name: "Nun", value: 50, sound: "n", picture: "fish" },
  { glyph: "ס", name: "Samekh", value: 60, sound: "s", picture: "support" },
  { glyph: "ע", name: "Ayin", value: 70, sound: "ʿ", picture: "eye" },
  { glyph: "פ", name: "Pe", value: 80, sound: "p", picture: "mouth" },
  { glyph: "צ", name: "Tsade", value: 90, sound: "ts", picture: "hook" },
  { glyph: "ק", name: "Qof", value: 100, sound: "q", picture: "horizon" },
  { glyph: "ר", name: "Resh", value: 200, sound: "r", picture: "head" },
  { glyph: "ש", name: "Shin", value: 300, sound: "sh", picture: "tooth" },
  { glyph: "ת", name: "Tav", value: 400, sound: "t", picture: "mark" },
  { glyph: "ך", name: "Kaf sofit", value: 500, sound: "k", picture: "palm", final: true },
  { glyph: "ם", name: "Mem sofit", value: 600, sound: "m", picture: "water", final: true },
  { glyph: "ן", name: "Nun sofit", value: 700, sound: "n", picture: "fish", final: true },
  { glyph: "ף", name: "Pe sofit", value: 800, sound: "p", picture: "mouth", final: true },
  { glyph: "ץ", name: "Tsade sofit", value: 900, sound: "ts", picture: "hook", final: true },
]

/** Paleo-Hebrew glyphs with the same standard values the Genesis language uses for its numerals. */
export const paleoLetters: HebrewLetter[] = [
  { glyph: "𐤀", name: "Alep", value: 1, sound: "ʾ", picture: "ox" },
  { glyph: "𐤁", name: "Bet", value: 2, sound: "b", picture: "house" },
  { glyph: "𐤂", name: "Gimel", value: 3, sound: "g", picture: "camel" },
  { glyph: "𐤃", name: "Dalet", value: 4, sound: "d", picture: "door" },
  { glyph: "𐤄", name: "He", value: 5, sound: "h", picture: "window" },
  { glyph: "𐤅", name: "Waw", value: 6, sound: "w", picture: "hook" },
  { glyph: "𐤆", name: "Zayin", value: 7, sound: "z", picture: "weapon" },
  { glyph: "𐤇", name: "Het", value: 8, sound: "ḥ", picture: "fence" },
  { glyph: "𐤈", name: "Tet", value: 9, sound: "ṭ", picture: "basket" },
  { glyph: "𐤉", name: "Yod", value: 10, sound: "y", picture: "hand" },
  { glyph: "𐤊", name: "Kaf", value: 20, sound: "k", picture: "palm" },
  { glyph: "𐤋", name: "Lamed", value: 30, sound: "l", picture: "goad" },
  { glyph: "𐤌", name: "Mem", value: 40, sound: "m", picture: "water" },
  { glyph: "𐤍", name: "Nun", value: 50, sound: "n", picture: "fish" },
  { glyph: "𐤎", name: "Samek", value: 60, sound: "s", picture: "support" },
  { glyph: "𐤏", name: "Ayin", value: 70, sound: "ʿ", picture: "eye" },
  { glyph: "𐤐", name: "Pe", value: 80, sound: "p", picture: "mouth" },
  { glyph: "𐤑", name: "Sade", value: 90, sound: "ṣ", picture: "hook" },
  { glyph: "𐤒", name: "Qop", value: 100, sound: "q", picture: "horizon" },
  { glyph: "𐤓", name: "Res", value: 200, sound: "r", picture: "head" },
  { glyph: "𐤔", name: "Sin", value: 300, sound: "š", picture: "tooth" },
  { glyph: "𐤕", name: "Taw", value: 400, sound: "t", picture: "mark" },
]

const byGlyph = new Map([...letters, ...paleoLetters].map((letter) => [letter.glyph, letter]))

export function readHebrew(raw: string) {
  const stripped = raw.normalize("NFC").replace(/[\u0591-\u05C7״׳]/g, "")
  const known: HebrewLetter[] = []
  let skipped = 0
  for (const glyph of stripped) {
    if (/\s/.test(glyph) || /[.,;:'"!?()\-]/.test(glyph)) continue
    const letter = byGlyph.get(glyph)
    if (letter) known.push(letter)
    else skipped += 1
  }
  return {
    known,
    skipped,
    total: known.reduce((sum, letter) => sum + letter.value, 0),
  }
}

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const expected = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "I Samuel", "II Samuel", "I Kings", "II Kings", "I Chronicles", "II Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
  "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "I Corinthians",
  "II Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "I Thessalonians",
  "II Thessalonians", "I Timothy", "II Timothy", "Titus", "Philemon", "Hebrews", "James",
  "I Peter", "II Peter", "I John", "II John", "III John", "Jude", "Revelation of John",
]

function load(id) {
  const file = path.join(root, "data", "raw", `${id}.json`)
  const data = JSON.parse(fs.readFileSync(file, "utf8"))
  const names = data.books.map((book) => book.name)
  if (names.join("|") !== expected.join("|")) {
    throw new Error(`${id} book list does not match the Anointed Staff catalog`)
  }
  return data.books.map((book) =>
    book.chapters.map((chapter) =>
      chapter.verses.map((verse) => verse.text.replace(/\s+/g, " ").trim()),
    ),
  )
}

const kjv = load("KJV")
const asv = load("ASV")

for (let book = 0; book < kjv.length; book += 1) {
  if (kjv[book].length !== asv[book].length) {
    throw new Error(`Chapter count differs in ${expected[book]}`)
  }
  for (let chapter = 0; chapter < kjv[book].length; chapter += 1) {
    if (kjv[book][chapter].length !== asv[book][chapter].length) {
      throw new Error(`Verse count differs in ${expected[book]} ${chapter + 1}`)
    }
  }
}

const john = kjv[42][2][15]
if (!john.startsWith("For God so loved the world")) {
  throw new Error(`John 3:16 check failed: ${john}`)
}

const out = {
  translations: [
    { id: "kjv", label: "KJV", name: "King James Version", year: "1769", rights: "Public domain" },
    { id: "asv", label: "ASV", name: "American Standard Version", year: "1901", rights: "Public domain" },
  ],
  source:
    "Public-domain verse text arranged from scrollmapper/bible_databases. Anointed Staff is independent of that project and of any other Bible program.",
  text: { kjv, asv },
}

const target = path.join(root, "public", "scripture.json")
fs.mkdirSync(path.dirname(target), { recursive: true })
fs.writeFileSync(target, JSON.stringify(out))
console.log(`Wrote ${target} (${fs.statSync(target).size} bytes)`)

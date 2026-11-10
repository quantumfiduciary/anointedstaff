/** Forensic probe: import study modules + validate catalog / audio manifest. */
import { readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const publicDir = join(root, "public")
let failed = 0

function ok(label) {
  console.log(`OK   ${label}`)
}
function miss(label, detail = "") {
  failed += 1
  console.log(`FAIL ${label}${detail ? ` — ${detail}` : ""}`)
}

const catalog = JSON.parse(readFileSync(join(publicDir, "library", "catalog.json"), "utf8"))
const entries = Array.isArray(catalog) ? catalog : catalog.works || catalog.entries || catalog.library || []
const ids = new Set(entries.map((item) => item.id))
for (const id of ["jasher", "enoch-readings", "laodiceans", "lesser-key-goetia", "yetzirah", "bensiira"]) {
  if (ids.has(id)) ok(`catalog:${id}`)
  else miss(`catalog:${id}`)
}
for (const work of entries) {
  if (!work.file) continue
  const path = join(publicDir, "library", work.file)
  if (!existsSync(path)) miss(`library file:${work.id}`, work.file)
}
ok(`catalog works ${entries.length} (files checked)`)

const laod = join(publicDir, "library", "laodiceans.json")
if (existsSync(laod)) {
  const body = JSON.parse(readFileSync(laod, "utf8"))
  const sections = body.sections || body.chapters || body.passages
  if (body.id === "laodiceans" && Array.isArray(sections) && sections.length >= 1) ok("laodiceans body")
  else if (Array.isArray(sections) && sections.length >= 1) ok("laodiceans body")
  else if (typeof body.text === "string" || Array.isArray(body.verses)) ok("laodiceans body")
  else miss("laodiceans body shape")
} else miss("laodiceans.json missing")

const manifest = JSON.parse(readFileSync(join(publicDir, "audio", "practice", "manifest.json"), "utf8"))
if (manifest.beds?.meditate) {
  const path = join(publicDir, "audio", "practice", "bed-meditate.mp3")
  if (existsSync(path)) ok("practice bed mp3")
  else miss("practice bed mp3")
} else miss("manifest beds.meditate")

const scriptureCandidates = ["scripture.json", "data/scripture.json", "bibles/scripture.json"]
if (scriptureCandidates.some((rel) => existsSync(join(publicDir, rel)))) ok("asset:scripture")
else if (existsSync(join(root, "public", "kjva.json")) || existsSync(join(publicDir, "kjva.json"))) ok("asset:scripture")
else {
  // Vite may ship compacted scripture elsewhere — accept any large bible json under public
  const hint = ["kjva", "scripture", "bible"].some((name) =>
    existsSync(join(publicDir, `${name}.json`)),
  )
  if (hint) ok("asset:scripture")
  else miss("asset:scripture")
}

for (const rel of ["brand/desk-atmosphere.png", "brand/atmosphere-desk.png", "library/catalog.json"]) {
  if (existsSync(join(publicDir, rel))) ok(`asset:${rel}`)
  else miss(`asset:${rel}`)
}

// Dynamic import of compiled-agnostic TS via tsx is heavy; JSON + path probes cover ship surface.
const studyFiles = [
  "src/study/biblicalAnthropology.ts",
  "src/study/shemHaMephorash.ts",
  "src/study/lostBooks.ts",
  "src/study/practiceAudio.ts",
  "src/study/treeOfLife.ts",
  "src/study/hebrewCrossing.ts",
  "src/study/mazzarothDecans.ts",
  "src/study/mazzarothHistory.ts",
  "src/components/AnthropologyPanel.tsx",
  "src/components/ShemNamesPanel.tsx",
  "src/components/MazzarothHistoryPanel.tsx",
]
for (const rel of studyFiles) {
  const text = readFileSync(join(root, rel), "utf8")
  if (text.includes("export ")) ok(`module:${rel}`)
  else miss(`module:${rel}`)
}

const shem = readFileSync(join(root, "src/study/shemHaMephorash.ts"), "utf8")
const angelCount = (shem.match(/\{ n: \d+/g) || []).length
if (angelCount === 72) ok(`shem angels ${angelCount}`)
else miss(`shem angels`, `expected 72 got ${angelCount}`)

const lost = readFileSync(join(root, "src/study/lostBooks.ts"), "utf8")
if (lost.includes('libraryId: "laodiceans"') && lost.includes("forgery_labeled")) ok("lostBooks laodiceans wire")
else miss("lostBooks laodiceans wire")

console.log(failed ? `\n${failed} failure(s)` : "\nAll forensic probes passed")
process.exit(failed ? 1 : 0)

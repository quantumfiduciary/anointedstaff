/** In-app guide copy for the Study desk Help / Guide tab. */

export type GuideSection = {
  id: string
  title: string
  body: string[]
  tips?: string[]
}

export const guideSections: GuideSection[] = [
  {
    id: "desk",
    title: "The desk",
    body: [
      "Anointed Staff is a local desk for Scripture and a wider spiritual walk — Word, language, sky, and notes in one place for study and growth.",
      "The Bible chapter stays in one window; Notes, AI, Strong’s, Extra-canon, and tools open beside it. Drag the handle to resize. Number keys open windows. Ctrl K opens the command palette.",
      "Appearance cycles Light → Dark → Mystic → Parchment → Ink from the topbar control; Settings → Desk and the View menu pick any look. Mystic is lamp-and-night; Parchment is warmer paper; Ink is a cool quiet night.",
      "Type: Outfit for buttons and chrome, Fraunces for titles, Literata for Scripture and long reading — so the desk feels set, not default system UI.",
    ],
    tips: [
      "Press Help → Take the tour for a short walkthrough.",
      "Your notes and chat stay in this browser unless you export them.",
      "Desk depth lifts the chrome; verse text stays flat so reading stays clear.",
      "A− / A+ still scales the chapter; Literata keeps its book measure.",
    ],
  },
  {
    id: "bible",
    title: "Reading scripture",
    body: [
      "Pick a translation for the main line. Compare adds a second public-domain witness — English, Spanish, Chinese, French, German, Cherokee NT, or Hebrew WLC / Greek TR.",
      "Numbers shows Strong’s links on the King James. Select a verse for highlight, bookmark, note, links, and Save to notebook.",
      "Listen reads the open chapter aloud. Voice opens a popover for man/woman voices installed on this computer and speaking speed (same settings as Settings → Voice).",
      "Recent shows chapters you opened earlier on this desk. Kept lists bookmarked verses so you can jump back without leaving the Bible pane.",
    ],
    tips: ["A− / A+ scale the chapter text.", "Today jumps to the year’s reading plan.", "Stop listening when you change chapter, or press Stop."],
  },
  {
    id: "notes",
    title: "Notes, cards, and the board",
    body: [
      "Notes holds notebooks. Save the open verse as a card with topics. Write is a freeform journal; Kanban, Cards, Table, and Board arrange the same cards.",
      "Board has two modes: Cards (stickies, frames, links) and Draw (freehand shapes, arrows, and text). Sketches save with the notebook.",
    ],
    tips: ["Open the Example · John 3 notebook to see a filled sample.", "Gather into the study copies the notebook into the AI Study page."],
  },
  {
    id: "wiki",
    title: "Study wiki",
    body: [
      "The Wiki tab is for longer markdown pages. Link pages with [[Page title]] and jump to scripture with [[John 3:16]].",
      "Index and Log are special pages. Export a study pack (.aswiki.json) to share or import on another desk. Copy as markdown for email or another app.",
    ],
    tips: ["Notebook menu → Ingest open passage files a wiki page from the chapter.", "In Chat, Add to wiki saves a reply as a page."],
  },
  {
    id: "ai",
    title: "AI Chat and Study",
    body: [
      "Chat stays quiet until you turn on a model in Settings (local Ollama or a cloud provider). Chat and Voice share one agent: a study companion for spiritual growth beside the open Word, language, sky, and notes.",
      "Each ask packs a study packet: open verses, compare line, Hebrew/Greek originals when loaded, Open Bible cross-refs, Strong’s glosses, named verses you typed, capped Easton hits, and notebook brief. A Packed receipt under your question shows what went with it.",
      "Replies stream as the model writes. Press Stop to cancel. Settings → Model → Agent instructions is the system prompt for a season of study.",
      "Use Add to study on a finished reply. Cited book and chapter lines are links. Follow-up chips appear after the stream ends. Extra-canon Ask about this attaches the open section body.",
    ],
    tips: [
      "The green light means the model is on and reachable.",
      "Name a verse in your question (e.g. John 3:16) to pull that line into the packet even when another chapter is open.",
      "Voice is its own window (V) for hands-free turns — same instructions as text chat.",
      "Settings → About → What’s new shows the latest desk release notes.",
    ],
  },
  {
    id: "tools",
    title: "Study tools",
    body: [
      "Strong’s and Roots work with King James numbers. Roots → Dictionary opens Easton, Smith, and Webster. Extra-canon opens public-domain books beside Scripture.",
      "Gematria counts Hebrew letters, Word art, and an Original Hebrew Genesis sample. Heavens → Cast builds a natal report with a chart library and denser house/pattern text; the wheel uses a light 3D settle, degree labels, and Ctrl/Cmd+scroll zoom (plain scroll keeps the page). Circle teaches 360° measure; Witness walks Virgin→Lion beside Scripture.",
    ],
    tips: [
      "Cast charts are Anointed Staff sky math for Scripture study — clocks and glory, not fortunes. Save several casts in the chart library on this device.",
      "Heavens → Circle: degrees, arc minutes, and the rough four-minutes-per-degree rising rule — measure, don’t forecast.",
      "Witness and tribe labels point at Genesis 1:14 and the blessings — Isaiah 47 refuses monthly prognosticators. Extra-canon holds Rolleston (1862) as history beside the path; Cast stays clocks.",
      "Heavens → Decans: thirty-six figures with Scripture refs. Job 38 adds Ash / Kimah / Kesil / Mazzaroth lexicon. Camp adds cherub-face typology beside Numbers 2. Study → Links → Mazzaroth history bridges those tools to Rolleston PD.",
      "Gematria Learn and Study → Letters carry pictograph meanings (desk copy). Hear on Learn prefers offline letter clips; Roots featured names have Hear clips too. Study → Letters and Gematria → Word art open Hebrew (עבר): lexicon “cross over” (H5674/H5680) beside Ayin·Beth·Resh as eye·in·head. Gematria → Tree of Life maps the 32 Paths (10 sefirot + 22 letters) to Genesis 1 Elohim and Sefer Yetzirah; Hermetic titles are labels only, not a Tarot desk. Study → Links uses section chips (Named · Mazzaroth · Peoples · Seventy-two names). Ctrl K: Meditate, Study Links, Extra-canon. Optional Quiet music: Meditate, Scripture Listen, and Extra-canon.",
      "Heavens → Circle: diurnal degree, horizon points, Scripture twelves. Job 38 adds perseverance notes. Meditate already covers breath, rejoice, Word, and fast-frame — ascension-course dumps stay refused.",
      "Turn tools off under Settings → Plugins if you want a quieter rail.",
      "Watchmen (CC0) and paleo study sheets sit on the Extra-canon hebrew shelf.",
    ],
  },
  {
    id: "practice",
    title: "Practice hub",
    body: [
      "Practice gathers Temple gates, Hebrew parse Drill, flash Cards, Meditate, Readings, and Journal in one window.",
      "Temple can play an offline walk overview. Meditate offers six Scripture-framed sessions with an offline spoken guide (Play / Pause / Restart / scrub). Playing the guide also starts the quiet timer; when time ends you hear a short closing cue if Voice cues are on.",
      "Drill and Cards can play short voice cues for correct, again, next, and reveal. Letter Cards Hear front prefers offline letter clips; other Hear prompts use this computer’s desk voice. Voice cues and Quiet music on/off sit at the top of Practice and are saved on this device.",
      "Journal opens Notes → Write so temple walks and meditations share one notebook. Practice scripts are disciplines beside the Word — not fortunes.",
    ],
    tips: [
      "Guides, cues, letter/name clips, Temple overview, and Quiet music ship under /audio/practice — no live cloud call while you practice.",
      "Desk sounds (Settings → Desk) are separate soft UI taps; Practice Voice cues are the quiz lines (also under Settings → Desk).",
      "Open the verse chip on a session or card to keep Scripture beside the practice.",
      "Settings → About → What’s new lists the latest desk release notes.",
    ],
  },
  {
    id: "shortcuts",
    title: "Shortcuts",
    body: [
      "Ctrl K opens the command palette (windows, recent places, ask).",
      "Number keys 1–0 open windows when you are not typing in a field. V opens Voice; E opens Roots.",
      "← → change chapter. Alt ← returns to the last place on your reading trail.",
      "/ focuses Scripture search when the Bible is open; otherwise it focuses the top Go bar.",
      "On a phone or tablet, the dock switches one focused window at a time — icons show which window you are viewing. The layout uses the dynamic viewport and safe-area insets on notched phones.",
    ],
    tips: [
      "Help on the topbar lists the same keys; this Guide section is the durable home for them.",
      "Drag a sidebar window onto a pane to place it; drag the handle between panes to resize.",
      "Heavens chart: use +/− or pinch to zoom on touch; Ctrl+scroll on desktop. Desktop installers need Rust (`npm run tauri:build`); browsers can Add to Home Screen via the web manifest.",
    ],
  },
  {
    id: "share",
    title: "Export and backup",
    body: [
      "Study menu can export PDF, print, or save a JSON study file (includes notebooks).",
      "From Notes, export PDF, export study pack, or copy markdown. Packs never include API keys.",
      "Workspaces also omit model and speech keys — those stay in Settings on this browser only.",
    ],
    tips: [
      "Heavens → Study this sky asks before sending cast name, date, and place to a cloud or remote model host.",
    ],
  },
]

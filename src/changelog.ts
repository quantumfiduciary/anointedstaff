export type ChangeEntry = {
  date: string
  title: string
  /** User-facing release notes (What's New + Settings → About). */
  items: string[]
}


/** Dated desk changes, newest first. User-facing only (What's New + Settings → About). */
export const changeLog: ChangeEntry[] = [
  {
    date: "2026-11-09",
    title: "Public desk · anointedstaff.com",
    items: [
      "Anointed Staff is public: GitHub monorepo, Windows v0.1.0 Release, and a lamp-lit marketing site at anointedstaff.pages.dev (anointedstaff.com when DNS is attached).",
      "Site lore covers the Staff, Desk, Fence, and FAQ — clocks-not-fortunes, public-domain Extra-canon, offline Practice. Three detailed desk notes live under Blog.",
      "Download for Windows from GitHub Releases; this desk still keeps notes and keys on your machine.",
    ],
  },
  {
    date: "2026-11-09",
    title: "Appearance · Parchment + Ink",
    items: [
      "Two new desk looks: Parchment (warmer paper) and Ink (cool night, quiet steel). Light, Dark, and Mystic stay — with softer gold glow.",
      "Pick any appearance in Settings → Desk or the View menu; the topbar button still cycles through all five.",
      "Fonts stay Outfit · Fraunces · Literata · Noto across every look.",
    ],
  },
  {
    date: "2026-11-09",
    title: "Desk UX · Quiet music · Hear discovery",
    items: [
      "Bed controls now say Quiet music. Practice opens with a clearer Temple-first intro and a promoted spoken walk.",
      "Gematria Learn Hear is primary; Roots featured names show Hear (offline clips). Tour covers Practice audio.",
      "Extra-canon naming is consistent in About and the Extra-canon pane.",
    ],
  },
  {
    date: "2026-11-09",
    title: "Hebrew Hear clips · read bed · Temple guide",
    items: [
      "Gematria Learn and letter Cards Hear play offline River letter pronunciations (22 letters + sofit); Roots featured Hitchcock names have Hear clips. Desk voice stays the fallback.",
      "Practice → Temple ships a spoken walk overview. Scripture Listen and Extra-canon gain Quiet music for a soft instrumental that ducks under Listen and Hear.",
      "Settings → About credits offline River clips, YuE2 Meditate quiet music, and the instrumental reading bed — still no live cloud audio while you study.",
    ],
  },
  {
    date: "2026-11-09",
    title: "Extra-canon rights pass · library restored",
    items: [
      "Extra-canon again ships verified public-domain English for Jubilees, 2 Baruch, Nag Hammadi titles, Acts of Thomas, Goetia, Moses books, Thunder, Archons, and the full 1830 Book of Mormon.",
      "Emerald Tablet uses historical Hermes renderings (not Doreal). Hermetic shelves stay historical study — not ritual.",
      "Settings → About lists licenses; Extra-canon shows each work’s credit footer.",
    ],
  },
  {
    date: "2026-11-09",
    title: "Goetia · Moses books · Thunder · Archons",
    items: [
      "Extra-canon restores the Lesser Key Goetia (Gutenberg #72679) and the Scheible Sixth & Seventh Books of Moses as historical hermetic study texts.",
      "Sophia shelf adds Thunder, Perfect Mind and Substance of the Archons from Zinner / Mattison public-domain English (Other Gospels / Luminescence).",
    ],
  },
  {
    date: "2026-11-09",
    title: "Acts of Thomas · Mormon · Emerald Hermes",
    items: [
      "Extra-canon restores the full Acts of Thomas (M. R. James 1924) and the 1830 Book of Mormon (Gutenberg #17).",
      "Emerald Tablet now ships historical Hermes renderings (Newton and related PD English), not Doreal’s Tablets of Thoth.",
      "Gospels.net Thomas, Stranger’s Book, and Secret Mark were refreshed from their public-domain pages.",
    ],
  },
  {
    date: "2026-11-09",
    title: "Nag Hammadi PD · Zinner / Mattison",
    items: [
      "Extra-canon restores Apocryphon of John, On the Origin of the World, Sophia of Jesus Christ, and Acts of Peter and the Twelve from public-domain Zinner / Mattison English.",
      "Translation body only — not Brill/CGLP and not the Stevan Davies exclusive harmonization.",
    ],
  },
  {
    date: "2026-11-09",
    title: "Charles Jubilees · 2 Baruch restored",
    items: [
      "Extra-canon again opens Jubilees and 2 Baruch from R. H. Charles public-domain English (not sacred-name editions).",
    ],
  },
  {
    date: "2026-11-09",
    title: "Ship trim · rights gate · About credits",
    items: [
      "Extra-canon temporarily dropped titles that failed a public-domain English check; later the same day Charles and Zinner/Mattison re-ingests restored the cleared works.",
      "Settings → About lists licenses and acknowledgments (Open Bible CC BY, fonts, Practice audio, brand).",
      "Unused branding experiments removed from the shipped build.",
    ],
  },
  {
    date: "2026-11-09",
    title: "Security harden · keys · egress · CSP",
    items: [
      "API keys stay in this browser session by default; Settings can opt in to remember them on this device.",
      "Place search, web search, and cloud model tests ask before anything leaves the machine (once per session).",
    ],
  },
  {
    date: "2026-11-01",
    title: "Mazzaroth studies · Decans · Job · Camp",
    items: [
      "Heavens adds Decans — thirty-six sky figures with Scripture — plus a Job star-name lexicon and cherub-face notes beside Israel’s camp.",
      "Study → Links includes Mazzaroth history. Frances Rolleston (1862) is in Extra-canon as public-domain reading beside Job 38.",
      "Cast and Witness stay clocks and Scripture — not fortunes (Isaiah 47).",
    ],
  },
  {
    date: "2026-11-01",
    title: "Desk motion · Links · Meditate bed",
    items: [
      "Clearer rail groups (Read / Study / Tools), pane settle motion, and Study Links section chips.",
      "Ctrl K jumps for Meditate, Links, and Extra-canon. Optional quiet bed music in Practice → Meditate when available.",
    ],
  },
  {
    date: "2026-11-01",
    title: "Named books · Seventy-two names",
    items: [
      "Study → Links lists books named in Scripture, with the Latin Epistle to the Laodiceans labeled as a study forgery.",
      "Seventy-two names: Exodus letter threads, Extra-canon bridges, and a browseable catalog — no seals or birth-angel calendars.",
    ],
  },
  {
    date: "2026-11-01",
    title: "Peoples and night names",
    items: [
      "Study → Links: Lilith, Habiru/Hebrew, Horites, letter folklore, and shadow notes — Scripture first, further reading off-desk.",
      "Strong’s and Letters deepen related Hebrew roots (including עבר and אמת).",
    ],
  },
  {
    date: "2026-11-01",
    title: "Tree of Life · 32 Paths",
    items: [
      "Gematria → Tree of Life and Study → Letters: ten sefirot + 22 letter channels (32 Paths), Genesis 1 Elohim anchors, Sefer Yetzirah mother/double/simple groups.",
      "Western Hermetic path titles listed as study labels only — no Tarot draw, no Thelemic chart image; link to Extra-canon Yetzirah notes.",
    ],
  },
  {
    date: "2026-11-01",
    title: "Hebrew · עבר letter vision",
    items: [
      "Study → Letters and Gematria → Word art: עבר (Ayin·Beth·Resh) as cross over + eye-in-head pictograph reading, with Strong’s H5674/H5680 and letter roots.",
      "Ask, Count, and Strong’s open from the Hebrew study card.",
    ],
  },
  {
    date: "2026-11-01",
    title: "Smarter study packet · streaming chat",
    items: [
      "AI packs the open passage, cross-refs, originals, Strong’s, notes, and more — with a Packed receipt under each question.",
      "Chat streams replies (Gather / Write) with Stop; falls back if the host rejects streaming.",
      "Extra-canon Ask about this can attach the open section.",
    ],
  },
  {
    date: "2026-10-31",
    title: "Cast Custom place name + search",
    items: [
      "Heavens Cast Custom: place name for the report/library, plus Find place search (OpenStreetMap) that fills Lat/Lon — then set IANA time zone before Cast.",
    ],
  },
  {
    date: "2026-10-30",
    title: "Packaging · offline fonts · mobile",
    items: [
      "App icons and a web manifest for install / Add to Home Screen.",
      "Fonts ship with the desk (no Google Fonts CDN).",
      "Mobile layout uses safe areas; Heavens wheel supports pinch zoom.",
    ],
  },
  {
    date: "2026-10-30",
    title: "Heavens Circle · Scripture twelves",
    items: [
      "Circle: horizon lessons, measure drill, and Scripture-named twelves (apostles, tribes, gates…).",
      "Job 38 adds perseverance verses. Cast notes the eastern horizon at cast time.",
    ],
  },
  {
    date: "2026-10-30",
    title: "Scripture-framed letter study",
    items: [
      "Gematria Learn and Study → Letters show pictograph meanings for study — no Tarot or angel charts.",
      "Study → Links Named in Scripture: lost books cited in the Bible; Jasher and Enoch open Extra-canon when available.",
    ],
  },
  {
    date: "2026-10-30",
    title: "Desk release · 2026-10-30",
    items: [
      "Typography: Outfit · Fraunces · Literata · Noto.",
      "Appearance: Light → Dark → Mystic; quieter chrome; atmosphere that respects reduced motion.",
      "Practice hub with offline meditation guides and quiz cues; Voice cues in Settings and Practice.",
      "Heavens chart library, denser natal report, wheel zoom, Circle measure, and Witness.",
      "Clearer mobile dock, scripture load banner, workspace confirm, and What’s new after updates.",
      "Privacy: workspaces omit API keys; confirm before Study-this-sky leaves the device.",
    ],
  },
  {
    date: "2026-10-30",
    title: "User-friendliness upgrades",
    items: [
      "Phones/tablets: one focused pane via the dock (icons + Viewing line); opening AI/Notes no longer looks like a no-op.",
      "Scripture library load banner with retry; toast if you Go/chat before the ~25 MB pack is ready.",
      "Confirm before removing a study; toast on workspace switch; clearer Heavens confirm copy.",
      "/ focuses Scripture search when Bible is open; post-update What’s new card; Notes empty CTAs; Practice/Strong’s/Extra-canon load errors surface.",
      "Study tabs: Notes · Guide · Today, with Explore for Links/Lens/Topics/Harmony/Letters; AI Study tools collapse on narrow; Keep windows when I chat in Settings → Desk.",
      "Heavens Cast sample + first-run stance; Practice intro; Guide Shortcuts section linked from Help.",
    ],
  },
  {
    date: "2026-10-30",
    title: "Typography: Outfit + Fraunces + Literata",
    items: [
      "UI chrome switches from Source Sans 3 to Outfit; titles use Fraunces; verse and Extra-canon body stay Literata; Hebrew/Greek stay Noto.",
      "Clearer type hierarchy: optical sizing, open verse measure, Fraunces on card titles and key heads.",
    ],
  },
  {
    date: "2026-10-30",
    title: "Mystic theme + medium desk depth",
    items: [
      "Appearance cycles Light → Dark → Mystic from the topbar. Mystic is lamp-and-night: indigo ink, warmer gold, soft star veil — not purple neon.",
      "Medium dimensional chrome on topbar, rail, windows, cards, and menus; atmosphere drift respects reduced motion. Scripture stays flat.",
      "Workspaces persist the third theme; Excalidraw maps Mystic to dark.",
    ],
  },
  {
    date: "2026-10-30",
    title: "Practice spoken guides + quiz cues",
    items: [
      "Meditate: offline River guides for all six sessions with Play / Pause / Restart / scrub; Play guide starts the timer; closing cue when time ends.",
      "Drill and Cards: voice cues for correct / again / next / reveal; Hear prompt / Hear front; Voice cues toggle in Practice and Settings → Desk.",
      "Audio under /audio/practice (manifest + mp3) — no live ElevenLabs call while you practice.",
    ],
  },
  {
    date: "2026-10-30",
    title: "Heavens wheel 3D settle + zoom",
    items: [
      "Cast wheel: 3D tilt, bevel rim, specular hub, degree labels, zoom/pan; settle animation when cast inputs change.",
      "Zoom: Ctrl/Cmd+scroll (plain scroll keeps the page); SVG enlarge stays sharp; tilt flattens while zoomed.",
      "Study tools sit under the Cast form so Circle and Witness open beside the chart.",
    ],
  },
  {
    date: "2026-10-30",
    title: "Heavens chart library + Practice hub",
    items: [
      "Heavens Cast: save multiple charts, switch, rename, duplicate, delete. Denser natal report with house listing and geometry patterns.",
      "Practice hub: Temple · Drill · Cards · Meditate · Readings · Journal; flashcards; Journal opens Notes → Write.",
    ],
  },
  {
    date: "2026-10-30",
    title: "Heavens measure + Practice meditations",
    items: [
      "Extra-canon includes Rolleston Mazzaroth (1862) and Bond & Lea gematria (1917) as historical reading.",
      "Heavens → Circle: 360°, arc minutes, stations, and diurnal degree — Cast aspects show finer precision.",
      "Practice meditations: breath, rejoice, Word, creation, fasting frame, and psalm tone.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Notes Write overlap fix",
    items: [
      "Write view no longer stacks Journal, Card notes, and the rights footer on top of each other: notebook shares height with the footer, journal fills its band without resize spill, card notes scroll in their own band.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Extra-canon shelf chips navigate",
    items: [
      "Shelf tabs (Enoch, Sophia, Hebrew, Other canons, …) open the first book on that shelf and load catalog works that were only pending — no more chip highlight with the previous shelf still on screen.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Notes Write space + Extra-canon nav",
    items: [
      "Notes → Write: journal fills the empty pane, labeled, and resizable; card notes sit in a lower band you can expand by dragging the corner.",
      "Extra-canon (Jubilees and the rest): Previous, section, and Next are large outlined controls instead of small pill links.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Light reader readability",
    items: [
      "Light theme no longer puts busy lichen under verse text: Comfy parchment wash (cream center, soft gold at the corners), plus an opaque gold-edged reading panel so letters stay clear.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Study companion system prompt",
    items: [
      "Default agent instructions know Anointed Staff’s convergence of Word, language, Extra-canon, letters, Heavens, and notes — purpose is spiritual evolution and careful study; tone friendly, inquisitive, wise.",
      "Settings → Model → Agent instructions is editable for a focused season; Restore default returns the shipped prompt. Same prompt drives text Chat and Voice.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Light theme moss + glow",
    items: [
      "Light mode uses a pale sage/cream atmosphere so the reader stays clear.",
      "Stronger soft glow on cards and tools so the desk reads well in light as well as dark.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Anointed Staff gold brilliance",
    items: [
      "Cast, Witness, and rights lines speak as Anointed Staff.",
      "Gold atmosphere on the desk chrome; Guide frames Scripture beside language, sky, and notes.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Desk feel + sounds",
    items: [
      "Optional desk sounds (Settings → Desk): soft taps on window open, cast, bookmark, and chat send.",
      "Motion: tab settle and cast glow; respects reduced motion.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Clearer tab contrast",
    items: [
      "Heavens study tools (Stations, Witness, …) sit in a labeled Study tools rail with short hints on each button.",
      "Segmented tabs, desk tabs, dock, and similar controls use two-tone idle/selected chrome so they read as buttons in light and dark themes.",
    ],
  },
      {
    date: "2026-10-29",
    title: "Chat citations · reading trail · bookmarks",
    items: [
      "Chat: tap Scripture citations in AI replies, plus follow-up question chips after the last answer.",
      "Bible: Recent reading strip and Kept bookmarks menu. The trail also rides with AI study packets.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Hebrew parse drill",
    items: [
      "Practice → Hebrew parse drill: verb stem recognition cards with verse openers.",
      "Link out to parse.hebrewtools.org for further practice.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Multi-language Compare and BDB",
    items: [
      "Compare adds Spanish, Chinese, French, German, Cherokee NT, plus Hebrew WLC / Greek TR.",
      "Strong’s Hebrew entries can show a compact Brown–Driver–Briggs gloss.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Heavens Witness path",
    items: [
      "Heavens → Witness: Virgin→Lion Scripture walk with tribe-study notes beside Genesis 49 and Deuteronomy 33.",
      "Lights and Beginnings add Genesis 3:15, Proverbs 16:11, Isaiah 47:13, and Revelation 5:5.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Heavens cast-a-chart",
    items: [
      "Heavens → Cast: time zones, time-unknown noon, Whole Sign or Equal houses, aspects, report, and SVG/PNG/PDF export.",
      "Study-this-sky can send chart facts to chat when your model is on. Accuracy is labeled in the UI.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Dictionaries · Calendar · paleo notes",
    items: [
      "Roots → Dictionary: Easton, Smith, and Webster (public domain).",
      "Strong’s can show Paleo notes. Gematria adds Word art and an Original Hebrew Genesis sample.",
      "Heavens → Calendar and Extra-canon hebrew shelf gain Watchmen (CC0) and paleo study sheets.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Listen, Draw board, demo wiki, and Guide",
    items: [
      "Bible tools gain Listen: read the open chapter aloud with voice and speed (same prefs as Settings → Voice).",
      "Notes → Board splits into Cards (stickies) and Draw (embedded Excalidraw). Sketches persist on the notebook and travel in study packs.",
      "First-run Personal workspace seeds Example · John 3 (cards, journal, wiki). Notebook menu → Add example notebook.",
      "Notes → Guide explains the desk. Help and palette commands guide / help open it. Wiki view: [[page]] and [[John 3:16]] links, study packs, Add to wiki from Chat.",
    ],
  },
  {
    date: "2026-10-27",
    title: "Moss wash, cloud models, and first-session clarity",
    items: [
      "Bible chapter pane gets a soft MOSS-Image texture for light and dark reading.",
      "Settings → Model lists Local and Cloud providers (Ollama, LM Studio, OpenAI, OpenRouter, Groq, Together, DeepSeek, Mistral, Fireworks, Gemini, Custom). Change log leaves Settings; About keeps support.",
      "Top bar Go, Chat vs Study labels, model-off banner, Compare off idle state, Numbers tip for King James Strong’s, and an optional-model tour step.",
      "DESIGN.md editorial system: cream canvas, Staff Gold, Source Sans 3 UI, Literata scripture.",
    ],
  },
  {
    date: "2026-10-26",
    title: "Notes journal, Extra-canon shelves, and chrome polish",
    items: [
      "Notes Write journal, Kanban/Table editing, Board frames, A−/A+ scale, AI connection light, brand stills, chat skills and desk shortcuts.",
      "Extra-canon update_02: Fathers, Hermetic, and World shelves; ~40 PD titles; Jubilees chaptered; Kaplan/modern dumps refused.",
      "Support heart, tour PayPal step, rail brand mark, motion press feedback, glass chrome pass.",
    ],
  },
  {
    date: "2026-10-22",
    title: "Roots, Heavens chart, and Gematria Learn",
    items: [
      "Roots: Strong’s chain, Hitchcock 1869 names, Skeat/Webster English trees.",
      "Heavens: birth chart with whole-sign houses, aspects, and inspector.",
      "Gematria Learn letters and anagrams. Extra-canon shelf expands beside independent Bible and AI panes.",
    ],
  },
  {
    date: "2026-10-21",
    title: "Voice window and workstation shell",
    items: [
      "Voice is its own Study window (V) with live status and spoken Bible commands.",
      "Resizable panes, menus, Ctrl K palette, first-run tour, verse actions, Notes views, PDF export.",
    ],
  },
  {
    date: "2026-10-20",
    title: "Library, notes, originals, and the sky",
    items: [
      "Six English translations, King James Apocrypha, Open Bible cross-references.",
      "Westminster Leningrad Codex and Textus Receptus under verses. Chat, Notes, and Mazzaroth Heavens.",
    ],
  },
]

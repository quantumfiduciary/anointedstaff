export type SkyLight = {
  name: string
  hebrew: string
  ref: string
  line: string
  note: string
}

export type SunStation = {
  name: string
  season: string
  start: string
}

export type SkyReading = {
  title: string
  ref: string
  line: string
}

export type CampTribe = {
  name: string
  ref: string
  blessing: string
  note: string
}

export type CampSide = {
  side: string
  ref: string
  tribes: CampTribe[]
}

export const skyLights: SkyLight[] = [
  {
    name: "The heavens",
    hebrew: "הַשָּׁמַיִם",
    ref: "Psalm 19:1",
    line: "The heavens declare the glory of God; and the firmament sheweth his handywork.",
    note: "The sky is a witness. Its speech is glory, day after day, without a voice of its own.",
  },
  {
    name: "Lights for signs",
    hebrew: "מְאֹרֹת",
    ref: "Genesis 1:14",
    line: "Let there be lights in the firmament of the heaven to divide the day from the night; and let them be for signs, and for seasons, and for days, and years.",
    note: "Sun, moon, and stars keep time. A sign here is a marker of appointed times.",
  },
  {
    name: "Mazzaroth",
    hebrew: "מַזָּרוֹת",
    ref: "Job 38:32",
    line: "Canst thou bring forth Mazzaroth in his season? or canst thou guide Arcturus with his sons?",
    note: "The constellations come out in their season. The question is the Lord’s, not a chart’s. Astronomy keeps the ordinances; fortune-telling does not.",
  },
  {
    name: "Seed of the woman",
    hebrew: "",
    ref: "Genesis 3:15",
    line: "And I will put enmity between thee and the woman, and between thy seed and her seed; it shall bruise thy head, and thou shalt bruise his heel.",
    note: "The promise stands in Scripture before any wheel is drawn. Older readers of the heavens began the year’s story at a virgin with seed — always beside this verse.",
  },
  {
    name: "Just balances",
    hebrew: "",
    ref: "Proverbs 16:11",
    line: "A just weight and balance are the Lord's: all the weights of the bag are his work.",
    note: "Scales on the ecliptic keep autumn time. Just balances belong to the Lord, not to a house that claims to weigh a soul.",
  },
  {
    name: "Lion of Judah",
    hebrew: "",
    ref: "Revelation 5:5",
    line: "Behold, the Lion of the tribe of Juda, the Root of David, hath prevailed to open the book.",
    note: "Judah’s blessing already names a lion. The last book names the Lion who prevails — the walk of glory ends in Scripture, not in a monthly forecast.",
  },
  {
    name: "Astrologers refused",
    hebrew: "",
    ref: "Isaiah 47:13",
    line: "Let now the astrologers, the stargazers, the monthly prognosticators, stand up, and save thee from these things that shall come upon thee.",
    note: "Isaiah mocks the monthly prognosticators. Genesis 1:14 still sets lights for seasons. This desk keeps the seasons and refuses the prognosis.",
  },
  {
    name: "Orion",
    hebrew: "כְּסִיל",
    ref: "Job 9:9",
    line: "Which maketh Arcturus, Orion, and Pleiades, and the chambers of the south.",
    note: "Kesil, the one Job names Orion. Amos 5:8 pairs him with the seven stars.",
  },
  {
    name: "Pleiades",
    hebrew: "כִּימָה",
    ref: "Amos 5:8",
    line: "Seek him that maketh the seven stars and Orion, and turneth the shadow of death into the morning.",
    note: "Kimah, the cluster. The maker of the cluster is the one the prophet says to seek.",
  },
  {
    name: "Arcturus",
    hebrew: "עַיִשׁ",
    ref: "Job 38:32",
    line: "Canst thou bring forth Mazzaroth in his season? or canst thou guide Arcturus with his sons?",
    note: "Ayish and his sons. The King James reads the name as Arcturus.",
  },
  {
    name: "The morning star",
    hebrew: "",
    ref: "Revelation 22:16",
    line: "I am the root and the offspring of David, and the bright and morning star.",
    note: "The last book turns the morning star toward the speaker, not toward a birth chart.",
  },
  {
    name: "Stars in their courses",
    hebrew: "",
    ref: "Judges 5:20",
    line: "The stars in their courses fought against Sisera.",
    note: "Deborah's song gives the stars a course. The fight belongs to the narrative, not to a birth chart.",
  },
  {
    name: "His star",
    hebrew: "",
    ref: "Matthew 2:2",
    line: "Where is he that is born King of the Jews? for we have seen his star in the east, and are come to worship him.",
    note: "A star in the narrative leads to worship. The passage does not publish a horoscope.",
  },
]

export const stations: SunStation[] = [
  { name: "Ram", start: "03-21", season: "The sun crosses the spring equinox. Days and nights divide again." },
  { name: "Bull", start: "04-20", season: "Late spring. The flock and the field are both in motion." },
  { name: "Twins", start: "05-21", season: "The long light is near. Two bright stars keep the same evening." },
  { name: "Crab", start: "06-21", season: "The summer solstice. The sun stands and turns back south." },
  { name: "Lion", start: "07-23", season: "High summer. The sun is still strong, and the nights stay short." },
  { name: "Virgin", start: "08-23", season: "Harvest begins. The sun slips toward the balancing of day and night." },
  { name: "Scales", start: "09-23", season: "The autumn equinox. Day and night weigh even, as Genesis 1:14 appointed." },
  { name: "Scorpion", start: "10-23", season: "The harvest deepens. The sun walks the southern signs." },
  { name: "Archer", start: "11-22", season: "Late autumn. The nights have taken the longer share." },
  { name: "Goat", start: "12-22", season: "The winter solstice. The sun stands at its lowest noon and turns." },
  { name: "Water-bearer", start: "01-20", season: "Deep winter. Rain and the lengthening of the day." },
  { name: "Fishes", start: "02-19", season: "Late winter. The sun climbs back toward the spring crossing." },
]

/** The questions in Job 38 that name the sky. The lines are the King James. */
export const jobSky: SkyReading[] = [
  { title: "The foundations", ref: "Job 38:4", line: "Where wast thou when I laid the foundations of the earth?" },
  { title: "Morning stars", ref: "Job 38:7", line: "When the morning stars sang together, and all the sons of God shouted for joy." },
  { title: "The morning", ref: "Job 38:12", line: "Hast thou commanded the morning since thy days?" },
  { title: "The way of light", ref: "Job 38:19", line: "Where is the way where light dwelleth?" },
  { title: "Pleiades and Orion", ref: "Job 38:31", line: "Canst thou bind the sweet influences of Pleiades, or loose the bands of Orion?" },
  { title: "Mazzaroth", ref: "Job 38:32", line: "Canst thou bring forth Mazzaroth in his season? or canst thou guide Arcturus with his sons?" },
  { title: "Ordinances of heaven", ref: "Job 38:33", line: "Knowest thou the ordinances of heaven?" },
]

/**
 * Job’s named lights as lexicon + clock study (not natal markers).
 * Hebrew forms follow common Strong’s / KJV margin tradition; readings vary by translation.
 */
export type JobStarName = {
  title: string
  hebrew: string
  refs: string[]
  line: string
  note: string
}

export const jobStarNames: JobStarName[] = [
  {
    title: "Ash / Ayish",
    hebrew: "עַיִשׁ",
    refs: ["Job 9:9", "Job 38:32"],
    line: "Which maketh Arcturus… Canst thou guide Arcturus with his sons?",
    note: "Ayish (often Ash) and his sons. KJV reads Arcturus; many place the name with the Bear / Boötes region. A named light under God’s question — not a birth ruler.",
  },
  {
    title: "Chima / Kimah",
    hebrew: "כִּימָה",
    refs: ["Job 9:9", "Job 38:31", "Amos 5:8"],
    line: "Canst thou bind the sweet influences of Pleiades…",
    note: "Kimah, the cluster (Pleiades). Amos says seek the Maker of the seven stars — clock and worship, not prognosis.",
  },
  {
    title: "Kesil",
    hebrew: "כְּסִיל",
    refs: ["Job 9:9", "Job 38:31", "Amos 5:8"],
    line: "…or loose the bands of Orion?",
    note: "Kesil, Orion. God asks whether Job can loose the hunter’s bands. The ordinances stay the Lord’s.",
  },
  {
    title: "Mazzaroth",
    hebrew: "מַזָּרוֹת",
    refs: ["Job 38:32"],
    line: "Canst thou bring forth Mazzaroth in his season?",
    note: "Untranslated in the KJV text; margin “the twelve signs.” On this desk: seasons and stations under Genesis 1:14 — Frances Rolleston (1862) is Extra-canon history beside the verse, not Cast fortune data.",
  },
  {
    title: "Chambers of the south",
    hebrew: "חַדְרֵי תֵמָן",
    refs: ["Job 9:9"],
    line: "Which maketh Arcturus, Orion, and Pleiades, and the chambers of the south.",
    note: "Hadre teman — southern storehouses or rooms of the sky. A geographic and poetic clock for the southern lights, not a house system for birth.",
  },
]

/** Four living-creature faces beside Numbers camp / Mazzaroth cornerstones — typology, not Cast doctrine. */
export type CherubCampNote = {
  face: string
  cornerstone: string
  tribe: string
  station: string
  refs: string[]
  note: string
  /** When the link is tradition rather than a clear Genesis 49 banner. */
  tradition?: string
}

export const cherubCampTypology: CherubCampNote[] = [
  {
    face: "Lion",
    cornerstone: "Judah",
    tribe: "Judah",
    station: "Lion",
    refs: ["Ezekiel 1:10", "Revelation 4:7", "Genesis 49:9", "Numbers 2:3", "Revelation 5:5"],
    note: "Judah’s blessing already names a lion; Numbers sets Judah on the east. Ezekiel and Revelation keep the lion face among the living creatures.",
  },
  {
    face: "Ox / calf",
    cornerstone: "Joseph",
    tribe: "Ephraim (Joseph)",
    station: "Bull",
    refs: ["Ezekiel 1:10", "Revelation 4:7", "Deuteronomy 33:17", "Numbers 2:18"],
    note: "Joseph’s blessing speaks of the horns of the wild ox; the west camp is Ephraim’s. The ox face of the cherub sits beside that study map — not a birth chart.",
  },
  {
    face: "Man",
    cornerstone: "Reuben",
    tribe: "Reuben",
    station: "Water-bearer",
    refs: ["Ezekiel 1:10", "Revelation 4:7", "Genesis 49:3", "Numbers 2:10"],
    note: "Reuben leads the south; his blessing names water’s instability. The man face of the living creatures is read beside that camp — clocks and camp, not prognosis.",
  },
  {
    face: "Eagle",
    cornerstone: "Dan",
    tribe: "Dan",
    station: "Scorpion",
    refs: ["Ezekiel 1:10", "Revelation 4:7", "Genesis 49:17", "Numbers 2:25"],
    note: "Dan leads the north; Genesis 49 names serpent and adder. Later tradition sometimes sets an eagle standard here — labeled tradition beside the eagle face in Ezekiel, not desk doctrine that replaces the text.",
    tradition: "Eagle-for-Dan is later camp lore. Keep Genesis 49’s serpent wording as Scripture; use the eagle face from Ezekiel/Revelation as typology only.",
  },
]

export const cherubCampStance =
  "Ezekiel 1 and Revelation 4 show four faces: lion, ox, man, eagle. Numbers 2 sets four camp sides. This desk sets those faces beside the four Mazzaroth cornerstones as typology — Scripture first. Rolleston (1862) discusses cherubic forms as Extra-canon history. Cast still keeps time; it does not sell standards as fortunes."

/** Perseverance under trial — Scripture’s Job, not a Virgo keyword wheel. */
export const jobPerseverance: SkyReading[] = [
  { title: "Perfect and upright", ref: "Job 1:1", line: "That man was perfect and upright, and one that feared God, and eschewed evil." },
  { title: "The Lord gave", ref: "Job 1:21", line: "The Lord gave, and the Lord hath taken away; blessed be the name of the Lord." },
  { title: "Though he slay me", ref: "Job 13:15", line: "Though he slay me, yet will I trust in him." },
  { title: "Mine eye seeth thee", ref: "Job 42:5", line: "I have heard of thee by the hearing of the ear: but now mine eye seeth thee." },
  { title: "The end of the Lord", ref: "James 5:11", line: "Ye have heard of the patience of Job, and have seen the end of the Lord." },
]

/** Psalm 19, from the witness of the sky to the law. */
export const psalmSky: SkyReading[] = [
  { title: "The heavens declare", ref: "Psalm 19:1", line: "The heavens declare the glory of God; and the firmament sheweth his handywork." },
  { title: "Day unto day", ref: "Psalm 19:2", line: "Day unto day uttereth speech, and night unto night sheweth knowledge." },
  { title: "Their line", ref: "Psalm 19:4", line: "Their line is gone out through all the earth, and their words to the end of the world." },
  { title: "The sun's path", ref: "Psalm 19:5", line: "Which is as a bridegroom coming out of his chamber, and rejoiceth as a strong man to run a race." },
  { title: "The law of the Lord", ref: "Psalm 19:7", line: "The law of the Lord is perfect, converting the soul." },
]

/** The camp in Numbers 2. Blessing verses are the ones Genesis 49 and Deuteronomy 33 already give. */
export const campSides: CampSide[] = [
  {
    side: "East",
    ref: "Numbers 2:3",
    tribes: [
      { name: "Judah", ref: "Genesis 49:9", blessing: "Numbers 2:3", note: "Leads the side toward the sunrise. The blessing calls him a lion's whelp." },
      { name: "Issachar", ref: "Genesis 49:14", blessing: "Numbers 2:5", note: "Couches between the burdens. He camps with Judah." },
      { name: "Zebulun", ref: "Genesis 49:13", blessing: "Numbers 2:7", note: "His blessing is the haven of ships." },
    ],
  },
  {
    side: "South",
    ref: "Numbers 2:10",
    tribes: [
      { name: "Reuben", ref: "Genesis 49:3", blessing: "Numbers 2:10", note: "The firstborn leads the south side." },
      { name: "Simeon", ref: "Genesis 49:5", blessing: "Numbers 2:12", note: "Named with Levi in the blessing, and camped under Reuben." },
      { name: "Gad", ref: "Genesis 49:19", blessing: "Numbers 2:14", note: "A troop shall overcome him, and he shall overcome at the last." },
    ],
  },
  {
    side: "West",
    ref: "Numbers 2:18",
    tribes: [
      { name: "Ephraim", ref: "Genesis 48:19", blessing: "Numbers 2:18", note: "Joseph's younger son is set before Manasseh and leads the west." },
      { name: "Manasseh", ref: "Genesis 48:19", blessing: "Numbers 2:20", note: "The elder son of Joseph, camped with Ephraim." },
      { name: "Benjamin", ref: "Genesis 49:27", blessing: "Numbers 2:22", note: "The blessing calls him a wolf that ravins." },
    ],
  },
  {
    side: "North",
    ref: "Numbers 2:25",
    tribes: [
      { name: "Dan", ref: "Genesis 49:16", blessing: "Numbers 2:25", note: "Dan shall judge his people, and he leads the north side." },
      { name: "Asher", ref: "Genesis 49:20", blessing: "Numbers 2:27", note: "His bread shall be fat, and he shall yield royal dainties." },
      { name: "Naphtali", ref: "Genesis 49:21", blessing: "Numbers 2:29", note: "A hind let loose, and he giveth goodly words." },
    ],
  },
]

export const campCenter: CampTribe = {
  name: "Levi",
  ref: "Deuteronomy 33:8",
  blessing: "Numbers 2:17",
  note: "The camp of the Levites is in the midst of the camps, around the tabernacle.",
}

const moonNames = ["New", "Waxing crescent", "First quarter", "Waxing gibbous", "Full", "Waning gibbous", "Last quarter", "Waning crescent"]

function calendarDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export type SkyNow = {
  date: string
  sun: string
  season: string
  degree: number
  moon: string
  moonAge: number
}

export function skyNow(date: Date): SkyNow {
  const j2000 = Date.UTC(2000, 0, 1, 12)
  const days = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12) - j2000) / 86400000
  const anomaly = ((357.528 + 0.9856003 * days) % 360) * (Math.PI / 180)
  let longitude = (280.46 + 0.9856474 * days + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) % 360
  if (longitude < 0) longitude += 360
  const station = stations[Math.floor(longitude / 30) % 12]
  const synodic = 29.530588853
  const age = ((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12) - Date.UTC(2000, 0, 6, 18, 14)) / 86400000) % synodic
  const safeAge = age < 0 ? age + synodic : age
  return {
    date: calendarDate(date),
    sun: station.name,
    season: station.season,
    degree: Math.round(longitude),
    moon: moonNames[Math.floor((safeAge / synodic) * 8) % 8],
    moonAge: Math.round(safeAge * 10) / 10,
  }
}

export function lightsMatching(query: string) {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return skyLights
  return skyLights.filter((light) =>
    `${light.name} ${light.hebrew} ${light.ref} ${light.line} ${light.note}`.toLowerCase().includes(needle),
  )
}

const starWords = ["heaven", "heavens", "firmament", "star", "stars", "sun", "moon", "orion", "pleiades", "mazzaroth", "arcturus"]

export function starWordsIn(text: string | null) {
  if (!text) return []
  const lower = text.toLowerCase()
  return starWords.filter((word) => new RegExp(`\\b${word}\\b`).test(lower))
}

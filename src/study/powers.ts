export type PowerEntry = {
  id: string
  name: string
  hebrew?: string
  greek?: string
  strong?: string
  refs: string[]
  writings: string[]
  note: string
}

/** Original short glossary of names that appear in Scripture or Extra-canon. Not Brill DDD. */
export const powers: PowerEntry[] = [
  {
    id: "lilith",
    name: "Lilith",
    hebrew: "לִילִית",
    strong: "H3917",
    refs: ["Isaiah 34:14"],
    writings: ["bensiira", "enoch"],
    note: "Isaiah 34:14’s night-creature (KJV screech owl). Near Eastern lilītu spirits and Qumran hymns stand behind the name; Alphabet of Ben Sira (Extra-canon) tells Adam’s first companion — that tale is not Genesis. See Study → Links · Lilith.",
  },
  {
    id: "azazel",
    name: "Azazel",
    hebrew: "עֲזָאזֵל",
    strong: "H5799",
    refs: ["Leviticus 16:8", "Leviticus 16:10"],
    writings: ["enoch"],
    note: "The goat for Azazel on the Day of Atonement. 1 Enoch names Azazel among the watchers. Keep Leviticus as Scripture and Enoch as Extra-canon.",
  },
  {
    id: "watchers",
    name: "Watchers",
    refs: ["Daniel 4:13", "Genesis 6:2"],
    writings: ["enoch", "enoch-readings"],
    note: "Daniel’s watcher is a holy one from heaven. 1 Enoch tells of watchers who left their station. Genesis 6 names the sons of God; it does not use the word watchers.",
  },
  {
    id: "nephilim",
    name: "Nephilim",
    hebrew: "נְפִלִים",
    strong: "H5303",
    refs: ["Genesis 6:4", "Numbers 13:33"],
    writings: ["enoch", "jasher"],
    note: "Giants in the earth. Numbers 13 repeats the name in the spy report. Jasher retells early Genesis; it is not the Torah.",
  },
  {
    id: "leviathan",
    name: "Leviathan",
    hebrew: "לִוְיָתָן",
    strong: "H3882",
    refs: ["Job 41:1", "Psalm 74:14", "Isaiah 27:1"],
    writings: ["enoch"],
    note: "The twisting serpent the Lord will punish. Job 41 is a creature the Lord questions Job about, not a chart house.",
  },
  {
    id: "rahab",
    name: "Rahab (the deep)",
    hebrew: "רַהַב",
    strong: "H7293",
    refs: ["Isaiah 51:9", "Psalm 89:10", "Job 26:12"],
    writings: [],
    note: "A name for a crushed sea-power, not Rahab of Jericho (H7343). Isaiah 51 asks the arm of the Lord that cut Rahab.",
  },
  {
    id: "beelzebub",
    name: "Beelzebub",
    hebrew: "בַּעַל זְבוּב",
    strong: "H1176",
    refs: ["2 Kings 1:2", "Matthew 12:24"],
    writings: ["thomas"],
    note: "Lord of flies at Ekron. The Gospels use the name for the prince of demons. Matthew is still the King James; Howard’s Hebrew Matthew is not printed here.",
  },
  {
    id: "satan",
    name: "Satan",
    hebrew: "שָׂטָן",
    greek: "Σατανᾶς",
    strong: "H7854",
    refs: ["Job 1:6", "Zechariah 3:1", "Matthew 4:10"],
    writings: ["enoch"],
    note: "The adversary. Job’s satan stands among the sons of God. The Gospels name Satan as the tempter.",
  },
  {
    id: "belial",
    name: "Belial",
    hebrew: "בְּלִיַּעַל",
    strong: "H1100",
    refs: ["Deuteronomy 13:13", "2 Corinthians 6:15"],
    writings: [],
    note: "Worthlessness, then a name. Paul asks what concord Christ has with Belial.",
  },
  {
    id: "abaddon",
    name: "Abaddon",
    hebrew: "אֲבַדּוֹן",
    greek: "Ἀβαδδών",
    strong: "H11",
    refs: ["Job 26:6", "Revelation 9:11"],
    writings: [],
    note: "Destruction. Revelation names a king of the pit in Greek Apollyon.",
  },
  {
    id: "molech",
    name: "Molech",
    hebrew: "מֹלֶךְ",
    strong: "H4432",
    refs: ["Leviticus 18:21", "Jeremiah 32:35"],
    writings: [],
    note: "A forbidden fire-offering. The law forbids passing children through the fire to Molech.",
  },
  {
    id: "baal",
    name: "Baal",
    hebrew: "בַּעַל",
    strong: "H1168",
    refs: ["1 Kings 18:21", "Jeremiah 2:8"],
    writings: [],
    note: "Lord, then a rival. Elijah sets the Lord against Baal on Carmel.",
  },
  {
    id: "asherah",
    name: "Asherah",
    hebrew: "אֲשֵׁרָה",
    strong: "H842",
    refs: ["Deuteronomy 16:21", "2 Kings 23:6"],
    writings: [],
    note: "A grove or post beside an altar the law forbids. Josiah burns it.",
  },
  {
    id: "dagon",
    name: "Dagon",
    hebrew: "דָּגוֹן",
    strong: "H1712",
    refs: ["Judges 16:23", "1 Samuel 5:2"],
    writings: [],
    note: "The Philistine god whose image falls before the ark.",
  },
  {
    id: "mastema",
    name: "Mastema",
    refs: ["Exodus 4:24"],
    writings: ["jubilees", "enoch"],
    note: "A hostile prince in Jubilees (Charles 1917 on this desk). Exodus 4:24 is the Lord meeting Moses; Jubilees retells that scene. Keep the shelves labeled.",
  },
  {
    id: "asmodeus",
    name: "Asmodeus",
    refs: ["Tobit 3:8"],
    writings: [],
    note: "Named in Tobit, which this desk already keeps in the Bible Apocrypha (KJVA), not in Extra-canon.",
  },
  {
    id: "seraphim",
    name: "Seraphim",
    hebrew: "שְׂרָפִים",
    strong: "H8314",
    refs: ["Isaiah 6:2", "Numbers 21:6"],
    writings: [],
    note: "Burning ones. Isaiah sees them above the throne. Numbers 21 has fiery serpents in the wilderness.",
  },
  {
    id: "cherubim",
    name: "Cherubim",
    hebrew: "כְּרוּבִים",
    strong: "H3742",
    refs: ["Genesis 3:24", "Ezekiel 10:1", "Exodus 25:18"],
    writings: [],
    note: "Guards at the garden, figures on the mercy seat, living creatures in Ezekiel.",
  },
]

export function findPower(query: string) {
  const needle = query.trim().toLowerCase()
  if (needle.length < 3) return []
  return powers.filter(
    (item) =>
      item.id.includes(needle) ||
      item.name.toLowerCase().includes(needle) ||
      item.hebrew?.includes(query.trim()) ||
      item.strong?.toLowerCase() === needle.toUpperCase() ||
      item.note.toLowerCase().includes(needle),
  )
}

export function powersInText(text: string) {
  const lower = text.toLowerCase()
  return powers.filter((item) => lower.includes(item.name.toLowerCase()) || (item.id.length >= 4 && lower.includes(item.id)))
}

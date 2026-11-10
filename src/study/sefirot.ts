export type Sefirah = {
  name: string
  hebrew: string
  gloss: string
  ref: string
  note: string
  pillar: "right" | "left" | "middle"
  row: number
}

/** Ten traditional sefirot as a later Jewish study map. Not Scripture, not a Zohar reprint. */
export const sefirot: Sefirah[] = [
  { name: "Keter", hebrew: "כֶּתֶר", gloss: "Crown", ref: "Psalm 8:5", note: "Glory set above the head. The map starts here; Genesis 1 starts with speech.", pillar: "middle", row: 0 },
  { name: "Chokhmah", hebrew: "חָכְמָה", gloss: "Wisdom", ref: "Proverbs 8:22", note: "The Lord possessed wisdom in the beginning of his way.", pillar: "right", row: 1 },
  { name: "Binah", hebrew: "בִּינָה", gloss: "Understanding", ref: "Proverbs 9:10", note: "The knowledge of the holy is understanding.", pillar: "left", row: 1 },
  { name: "Chesed", hebrew: "חֶסֶד", gloss: "Kindness", ref: "Psalm 136:1", note: "His mercy endureth for ever.", pillar: "right", row: 2 },
  { name: "Gevurah", hebrew: "גְּבוּרָה", gloss: "Strength", ref: "Psalm 89:13", note: "Thou hast a mighty arm; strong is thy hand.", pillar: "left", row: 2 },
  { name: "Tiferet", hebrew: "תִּפְאֶרֶת", gloss: "Beauty", ref: "Psalm 27:4", note: "To behold the beauty of the Lord.", pillar: "middle", row: 2 },
  { name: "Netzach", hebrew: "נֶצַח", gloss: "Eternity", ref: "1 Chronicles 29:11", note: "Thine, O Lord, is the greatness, and the power, and the glory, and the victory.", pillar: "right", row: 3 },
  { name: "Hod", hebrew: "הוֹד", gloss: "Splendor", ref: "Psalm 104:1", note: "Thou art clothed with honour and majesty.", pillar: "left", row: 3 },
  { name: "Yesod", hebrew: "יְסוֹד", gloss: "Foundation", ref: "Psalm 11:3", note: "If the foundations be destroyed, what can the righteous do?", pillar: "middle", row: 3 },
  { name: "Malkhut", hebrew: "מַלְכוּת", gloss: "Kingdom", ref: "Psalm 145:13", note: "Thy kingdom is an everlasting kingdom.", pillar: "middle", row: 4 },
]

export const sefirotCaption =
  "Ten sefirot as a later Jewish study map. Traditional names are facts. The English Zohar (Laitman 2009 and others) is not on this desk. Scripture verses are the King James lines this desk already reads."

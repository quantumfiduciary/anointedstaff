/**
 * Scripture-first study of the Mazzaroth as a witness of glory — not a horoscope.
 * Anointed Staff original prose beside Genesis 1:14, Job 38, Psalm 19, and the blessings
 * in Genesis 49 / Deuteronomy 33 / Numbers 2.
 */

import { mazzaroth, type MazzarothStation } from "./mazzaroth"

export const mazzarothStudyStance = [
  "The lights were set for signs, seasons, days, and years (Genesis 1:14). Job asks who can bring forth Mazzaroth in his season (Job 38:32). Psalm 19 says the heavens declare glory — then turns to the law.",
  "Astronomy reads the ordinances of heaven. Divination that claims the stars rule a life is refused beside Deuteronomy 18 and Isaiah 47. This desk casts clocks and Scripture study, not fortunes.",
  "Tribe names beside the stations are a study map next to Jacob’s and Moses’ blessings — not a personality oracle and not a substitute for the written Word.",
  "Older public-domain Mazzaroth studies (Extra-canon → Rolleston, 1862) gather constellation names beside prophecy. This Witness path stays Anointed Staff prose under Scripture — open Rolleston as history, not as Cast data.",
].join(" ")

/**
 * Older Christian star-gospel walks often begin at the Virgin and end at the Lion
 * (seed promised → Lion of Judah). Sphinx figures that join woman and lion appear
 * on ancient temple maps; the desk uses that order only as a reading path beside Scripture.
 */
export const witnessPathOrder = [
  "Virgin",
  "Scales",
  "Scorpion",
  "Archer",
  "Goat",
  "Water-bearer",
  "Fishes",
  "Ram",
  "Bull",
  "Twins",
  "Crab",
  "Lion",
] as const

export type WitnessStep = {
  station: MazzarothStation
  step: number
  /** Original desk line for the redemption-study reading. */
  witness: string
  /** Primary Scripture to open beside this step. */
  ref: string
  /** How the tribal blessing sits beside this station — study, not prediction. */
  tribeStudy: string
}

const witnessByName: Record<string, { witness: string; ref: string; tribeStudy: string }> = {
  Virgin: {
    ref: "Genesis 3:15",
    witness:
      "A maiden with seed — branch or ear — in hand on older maps. The written promise is the seed of the woman who bruises the serpent’s head — glory begins with a promise, not a birth chart. Historical Mazzaroth readers often opened the year-walk here; this desk opens here for Scripture, not for a cusp report.",
    tribeStudy:
      "Zebulun’s blessing is the haven of ships (Genesis 49:13). Read the station for harvest and haven; do not trade the verse for a temperament list.",
  },
  Scales: {
    ref: "Proverbs 16:11",
    witness:
      "Balances hang in the autumn sky. Scripture already weighs with just balances and names a price that covers — debt and ransom belong to the Word, not to a house cusp.",
    tribeStudy:
      "Levi camps in the midst and teaches Jacob judgments (Deuteronomy 33:10). Scales beside Levi keep law and teaching in view.",
  },
  Scorpion: {
    ref: "Genesis 3:15",
    witness:
      "Conflict underfoot: the wound and the crush. Dan’s blessing already speaks of a serpent by the way — read conflict as Scripture’s war with the enemy, not as a ruling spirit over a birthday.",
    tribeStudy:
      "Dan leads the north in Numbers 2. Cornerstone link: serpent language in the blessing meets the scorpion figure on the wheel.",
  },
  Archer: {
    ref: "Psalm 45:5",
    witness:
      "An arrow aimed past the sting. The heavens keep a warrior figure; the desk reads triumph as the Lord’s victory song, not as archery for hire over a life.",
    tribeStudy:
      "Asher’s bread is fat and his dainties royal (Genesis 49:20). Abundance in the blessing; aim on the wheel — keep both under the same God who made the lights.",
  },
  Goat: {
    ref: "Leviticus 16:15",
    witness:
      "A goat that goes down as in death, with life still in the figure. Atonement goats and the blood that covers are already written; the station only keeps a seasonal clock beside that mercy.",
    tribeStudy:
      "Naphtali is a hind let loose with goodly words (Genesis 49:21). Read freedom of speech in the blessing, not Capricorn career forecasts.",
  },
  "Water-bearer": {
    ref: "John 7:38",
    witness:
      "Water poured from above. Living water and rivers of blessing are the Lord’s speech; Reuben’s blessing already names water — unstable or poured out, still under Genesis 1:14’s appointment.",
    tribeStudy:
      "Reuben leads the south. Cornerstone: water in the blessing beside the water-bearer on the ecliptic.",
  },
  Fishes: {
    ref: "Matthew 4:19",
    witness:
      "Two fishes bound on older maps. Multitudes and fishers of men are Gospel speech; Simeon’s blessing stays hard and brotherly — study the knot, do not cast a monthly omen.",
    tribeStudy:
      "Simeon camps under Reuben. Two brothers in the blessing; two fishes on the wheel — a study rhyme, not twin destinies sold by the hour.",
  },
  Ram: {
    ref: "John 1:29",
    witness:
      "A ram or lamb at rest. Passover and the Lamb of God are already preached; Gad’s troop that overcomes sits beside the spring crossing as a study map, not a battle forecast.",
    tribeStudy:
      "Gad: a troop shall overcome him, and he shall overcome at the last (Genesis 49:19). Courage in the blessing; lamb on the wheel — both under the same seasons God set.",
  },
  Bull: {
    ref: "Deuteronomy 33:17",
    witness:
      "A rushing bull — strength and judgment pressing forward. Joseph’s horns already push the peoples together in Moses’ blessing; Orion and the winter path keep time beside that strength.",
    tribeStudy:
      "Joseph (Ephraim/Manasseh) on the west. Cornerstone bull: the blessing names the figure before any modern tribe-scope does.",
  },
  Twins: {
    ref: "Isaiah 9:6",
    witness:
      "Two figures in one station. Peace and double witness belong to the Prince of Peace texts; Benjamin’s wolf blessing is fierce morning and evening — keep the twins as a clock, not as a split personality reading.",
    tribeStudy:
      "Benjamin camps with Joseph’s house. Brother beside brother on the camp map; twins on the ecliptic — camp geometry, not a cusp report.",
  },
  Crab: {
    ref: "John 10:28",
    witness:
      "A gatherer that holds fast. The Redeemer’s own are kept; Issachar couches between burdens — rest and holding are in the blessings already.",
    tribeStudy:
      "Issachar with Judah on the east. Burden-bearing in the blessing; the crab’s hold on the wheel — study endurance, refuse monthly health charts.",
  },
  Lion: {
    ref: "Revelation 5:5",
    witness:
      "The Lion of the tribe of Judah. The walk that began with a promised seed ends with the conquering King — Psalm 19’s sun finishes its circuit; Scripture finishes with the Lamb who is Lion. Older star-gospel maps that join Virgin and Lion only rhyme with that finish; they do not replace Revelation 5:5.",
    tribeStudy:
      "Judah leads the east. Cornerstone lion: Genesis 49:9 already says whelp and lion before any wheel is drawn.",
  },
}

export function witnessSteps(): WitnessStep[] {
  return witnessPathOrder.map((name, index) => {
    const station = mazzaroth.find((item) => item.name === name) ?? mazzaroth[0]
    const pack = witnessByName[name]
    return {
      station,
      step: index + 1,
      witness: pack?.witness ?? station.banner,
      ref: pack?.ref ?? station.blessing,
      tribeStudy: pack?.tribeStudy ?? `${station.tribe} · ${station.blessing}`,
    }
  })
}

export function witnessForStation(name: string): WitnessStep | null {
  return witnessSteps().find((step) => step.station.name === name) ?? null
}

/** Civil tropical spans — public calendar knowledge, not a copyrighted aspectarian. */
export function stationCivilSpan(station: MazzarothStation) {
  const index = mazzaroth.findIndex((item) => item.name === station.name)
  const next = mazzaroth[(index + 1) % 12]
  return `${station.start.replace("-", "/")} → ${next.start.replace("-", "/")}`
}

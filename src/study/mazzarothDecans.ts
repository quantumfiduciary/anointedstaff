import { mazzaroth, type MazzarothStation } from "./mazzaroth"

/** One decan figure beside a Mazzaroth station — desk study, not a fortune ruler. */
export type DecanStudy = {
  name: string
  note: string
  /** Scripture to open beside the figure (clocks and Word, not natal rulers). */
  refs: string[]
}

export type StationDecanStudy = {
  station: MazzarothStation
  latin: string
  stance: string
  decans: DecanStudy[]
}

/**
 * Desk stance for the Decans tool. Rolleston (1862) tables star names as prophecy
 * history; this desk keeps IAU figures, Scripture refs, and refuses birth-angel calendars.
 */
export const decansStudyStance =
  "Thirty-six figures (three under each station) are an old sky map — Egyptian and Greek star lore, later read by Frances Rolleston (1862) as prophecy history. On this desk they name lights beside Scripture. They do not rule a birthday. Isaiah 47 refuses monthly prognosticators."

/** Scripture-linked glosses for each station’s three decans. IAU names stay; notes are desk prose. */
const byLatin: Record<string, DecanStudy[]> = {
  Aries: [
    {
      name: "Cassiopeia",
      note: "The seated woman of the north. Rolleston heard “enthroned” and “freed” in older star-name lists — study history beside Isaiah’s liberty language, not a chart house.",
      refs: ["Isaiah 61:1", "Psalm 45:9"],
    },
    {
      name: "Cetus",
      note: "The sea-monster south of the Ram. Job’s Leviathan and Isaiah’s dragon stay Scripture; the figure is a map label, not a monthly omen.",
      refs: ["Isaiah 27:1", "Job 41:1"],
    },
    {
      name: "Perseus",
      note: "The deliverer with the Gorgon’s head in Greek catalogs. Micah’s “breaker” is Scripture; Perseus is the sky picture later readers set beside it.",
      refs: ["Micah 2:13", "Isaiah 54:11"],
    },
  ],
  Taurus: [
    {
      name: "Orion",
      note: "Kesil in Job. Amos pairs him with the seven stars. The hunter on the winter path is a clock and a name in Scripture — not a natal keyword.",
      refs: ["Job 9:9", "Job 38:31", "Amos 5:8"],
    },
    {
      name: "Eridanus",
      note: "The river from Orion’s foot. Ezekiel’s river of healing is the Word’s image; Eridanus is the sky’s long stream.",
      refs: ["Ezekiel 47:9", "Psalm 46:4"],
    },
    {
      name: "Auriga",
      note: "The charioteer with the goat at the shoulder. Shepherd language in Scripture stands alone; Auriga is the northern cart beside the Bull.",
      refs: ["John 10:11", "Isaiah 40:11"],
    },
  ],
  Gemini: [
    {
      name: "Lepus",
      note: "The hare under Orion. Older maps sometimes cast an enemy underfoot — keep Psalm’s footstool language as Scripture, the hare as a small figure.",
      refs: ["Psalm 8:6", "Psalm 110:1"],
    },
    {
      name: "Canis Major",
      note: "Sirius, the bright heart of the greater dog. A clock for the southern sky; Isaiah’s Prince names belong to the Word, not to the star’s folklore.",
      refs: ["Isaiah 9:6", "Job 38:7"],
    },
    {
      name: "Canis Minor",
      note: "Procyon, the lesser dog. Redeemer titles stay in Isaiah and the Gospel; the star marks the twin’s path.",
      refs: ["Isaiah 59:20", "Psalm 19:1"],
    },
  ],
  Cancer: [
    {
      name: "Ursa Minor",
      note: "The little bear and the pole the sky turns on. A navigation clock. Fold and flock language in the prophets is Scripture, not a “lesser church” horoscope.",
      refs: ["Job 38:32", "Jeremiah 23:3"],
    },
    {
      name: "Ursa Major",
      note: "Ayish / Ash in Job’s list of lights. The great bear keeps the north; the Maker of the assembled stars is the One Job answers.",
      refs: ["Job 9:9", "Job 38:32"],
    },
    {
      name: "Argo",
      note: "The ship (now Carina, Puppis, Vela). Travelers and company in the Psalms; the southern keel is a map, not a voyage omen.",
      refs: ["Psalm 68:11", "Isaiah 60:9"],
    },
  ],
  Leo: [
    {
      name: "Hydra",
      note: "The long water-serpent under the Lion. Revelation’s dragon and Isaiah’s fleeing serpent stay Scripture; Hydra is the stretched figure on the map.",
      refs: ["Revelation 20:2", "Isaiah 27:1"],
    },
    {
      name: "Crater",
      note: "The cup on Hydra’s back. Psalm 75’s cup of wrath is the Word; Crater is the sky’s bowl.",
      refs: ["Psalm 75:8", "Revelation 16:19"],
    },
    {
      name: "Corvus",
      note: "The raven on the same serpent. Birds of prey in the prophets; Corvus is a small southern bird on the desk’s map.",
      refs: ["Revelation 19:17", "Genesis 8:7"],
    },
  ],
  Virgo: [
    {
      name: "Coma",
      note: "Sheaf or hair; older Christian maps kept a child in the Virgin’s hand. Genesis 3:15 and Isaiah’s Branch are Scripture — Coma is history of reading, not a birth sign.",
      refs: ["Genesis 3:15", "Isaiah 7:14", "Isaiah 11:1"],
    },
    {
      name: "Centaurus",
      note: "The southern centaur under the Virgin. Half-human figures on Greek spheres; the desk opens Isaiah 53 and the Gospels for the Servant, not for a hybrid omen.",
      refs: ["Isaiah 53:3", "John 10:18"],
    },
    {
      name: "Boötes",
      note: "The herdsman. Arcturus / Ayish stands here in Job’s sky. Guide and guardian language is Psalm and Gospel; Boötes is the figure that holds the bright northern star.",
      refs: ["Job 38:32", "John 10:14", "Psalm 121:5"],
    },
  ],
  Libra: [
    {
      name: "Crux",
      note: "The southern cross. A later polar landmark; Rolleston linked it to finished work. Keep John 19 and Daniel 9 as Scripture — the cross on the map is a pointer, not a monthly seal.",
      refs: ["John 19:30", "Daniel 9:24"],
    },
    {
      name: "Lupus",
      note: "The wolf beside the centaur. Genesis 49 already names a wolf in Benjamin’s blessing; Lupus is the southern beast on the sphere.",
      refs: ["Genesis 49:27", "Isaiah 53:7"],
    },
    {
      name: "Corona Borealis",
      note: "The northern crown. Psalm and Revelation crown language is the Word; the arc of stars is a clock above the Scales.",
      refs: ["Psalm 21:3", "Revelation 19:12"],
    },
  ],
  Scorpius: [
    {
      name: "Serpens",
      note: "The serpent in Ophiuchus’ hands. Genesis 3:15 remains the first promise; Serpens is the figure held, not a birthday ruler.",
      refs: ["Genesis 3:15", "Psalm 91:13"],
    },
    {
      name: "Ophiuchus",
      note: "The serpent-bearer with a foot toward the scorpion. Conflict and bruise language is Scripture; Ophiuchus is the tall figure on the autumn path.",
      refs: ["Genesis 3:15", "Psalm 91:13", "Haggai 2:7"],
    },
    {
      name: "Hercules",
      note: "The kneeling man above the dragon. Strength and bruising in the Psalms; Hercules is the Greek catalog name for the northern kneeler.",
      refs: ["Psalm 24:8", "Genesis 3:15"],
    },
  ],
  Sagittarius: [
    {
      name: "Lyra",
      note: "The lyre; Vega is its bright string. Eagle and harp appear together in older maps — keep Revelation’s living creatures as Scripture.",
      refs: ["Revelation 4:7", "Psalm 33:2"],
    },
    {
      name: "Ara",
      note: "The altar under the Archer. Altar language in Exodus and Hebrews; Ara is the southern hearth on the map.",
      refs: ["Exodus 20:24", "Hebrews 13:10"],
    },
    {
      name: "Draco",
      note: "The dragon wound near the pole. Psalm 91 and Revelation name the serpent crushed; Draco is the long northern coil.",
      refs: ["Psalm 91:13", "Revelation 20:2"],
    },
  ],
  Capricornus: [
    {
      name: "Sagitta",
      note: "The arrow near the eagle. Psalm 38’s arrows are Scripture; Sagitta is a small northern dart.",
      refs: ["Psalm 38:2", "Habakkuk 3:11"],
    },
    {
      name: "Aquila",
      note: "The eagle; Altair is its eye. Living-creature faces in Ezekiel; Aquila is the bright summer bird.",
      refs: ["Ezekiel 1:10", "Isaiah 40:31"],
    },
    {
      name: "Delphinus",
      note: "The dolphin. Older Egyptian maps sometimes showed a vessel pouring — keep Isaiah 53 and John 4 for water and life; Delphinus is the small northern fish.",
      refs: ["Isaiah 53:12", "John 4:14"],
    },
  ],
  Aquarius: [
    {
      name: "Piscis Austrinus",
      note: "The southern fish that drinks the pour. Ezekiel’s river and John 7 stay Scripture; Fomalhaut marks the southern drinker.",
      refs: ["Ezekiel 47:9", "John 7:37"],
    },
    {
      name: "Pegasus",
      note: "The winged horse of the autumn square. Coming and going in Acts 1; Pegasus is the bright square, not a return-date omen.",
      refs: ["Acts 1:11", "Revelation 19:11"],
    },
    {
      name: "Cygnus",
      note: "The swan on the Milky Way. Bird of passage folk reading; the desk keeps Acts 1 and the ordinances of heaven — clocks, not fortunes.",
      refs: ["Acts 1:11", "Job 38:33"],
    },
  ],
  Pisces: [
    {
      name: "The Band",
      note: "The cord joining the two fishes on older maps. Union language in John 17; the Band is a drawing, not a binding spell.",
      refs: ["John 17:21", "Hosea 11:4"],
    },
    {
      name: "Andromeda",
      note: "The chained maiden of the autumn sky. Liberty and grave language in Isaiah; Andromeda is the Greek figure beside the fishes.",
      refs: ["Isaiah 61:1", "Isaiah 54:11"],
    },
    {
      name: "Cepheus",
      note: "The seated king above Cassiopeia. Branch and crown in Jeremiah and Revelation; Cepheus is the northern throne figure.",
      refs: ["Jeremiah 23:5", "Revelation 14:14"],
    },
  ],
}

export function stationDecanStudies(): StationDecanStudy[] {
  return mazzaroth.map((station) => {
    const desk = byLatin[station.latin]
    const decans: DecanStudy[] = station.decans.map((item, index) => {
      const enriched = desk?.[index]
      if (enriched && enriched.name.toLowerCase().includes(item.name.split(" ")[0].toLowerCase().slice(0, 4))) {
        return enriched
      }
      if (enriched && enriched.name === item.name) return enriched
      return {
        name: item.name,
        note: `${item.note} Desk study only — clocks and Scripture, not a fortune.`,
        refs: ["Genesis 1:14", "Job 38:33"],
      }
    })
    // Prefer desk table when names align loosely by index
    const resolved =
      desk && desk.length === station.decans.length
        ? desk.map((entry, index) => ({
            ...entry,
            name: station.decans[index]?.name ?? entry.name,
          }))
        : decans
    return {
      station,
      latin: station.latin,
      stance: `${station.meaning} · ${station.tribe} study map beside the station — not Scripture’s tribal assignment for every figure.`,
      decans: resolved,
    }
  })
}

export const stationDecanCatalog = stationDecanStudies()

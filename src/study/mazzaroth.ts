import { stations, type SunStation } from "./heavens"
import { formatDegree, type SkyBody } from "./skyBodies"

/** A Mazzaroth station: the sun's path in twelve equal parts, with a tribal study map. */
export type MazzarothStation = SunStation & {
  latin: string
  meaning: string
  tribe: string
  camp: "East" | "South" | "West" | "North" | "Midst"
  blessing: string
  banner: string
  cornerstone: boolean
  decans: { name: string; note: string }[]
}

/**
 * Twelve stations of the year. Figure names stay with this desk.
 * Tribe names are a study map beside the stations — not Scripture.
 * The four cornerstone links (Judah–Lion, Reuben–Water-bearer, Dan–Scorpion, Joseph–Bull) are the ones Genesis 49, Deuteronomy 33, and Numbers 2 already give.
 * Decan notes are original short glosses.
 */
export const mazzaroth: MazzarothStation[] = [
  {
    ...stations[0],
    latin: "Aries",
    meaning: "The Ram",
    tribe: "Gad",
    camp: "South",
    blessing: "Genesis 49:19",
    banner: "A troop shall overcome him, and he shall overcome at the last.",
    cornerstone: false,
    decans: [
      { name: "Cassiopeia", note: "The seated woman. The IAU keeps the Greek throne-name." },
      { name: "Cetus", note: "The sea-monster. A southern figure beside the Ram." },
      { name: "Perseus", note: "The deliverer with the Gorgon's head in the Greek catalog." },
    ],
  },
  {
    ...stations[1],
    latin: "Taurus",
    meaning: "The Bull",
    tribe: "Joseph",
    camp: "West",
    blessing: "Deuteronomy 33:17",
    banner: "His horns are like the horns of unicorns: with them he shall push the people together.",
    cornerstone: true,
    decans: [
      { name: "Orion", note: "Kesil in Job. The hunter stands on the bull's winter path." },
      { name: "Eridanus", note: "The river that runs from Orion's foot." },
      { name: "Auriga", note: "The charioteer, with the goat at his shoulder." },
    ],
  },
  {
    ...stations[2],
    latin: "Gemini",
    meaning: "The Twins",
    tribe: "Benjamin",
    camp: "West",
    blessing: "Genesis 49:27",
    banner: "Benjamin shall ravin as a wolf: in the morning he shall devour the prey.",
    cornerstone: false,
    decans: [
      { name: "Lepus", note: "The hare under Orion's feet." },
      { name: "Canis Major", note: "The greater dog. Sirius is its bright heart." },
      { name: "Canis Minor", note: "The lesser dog, with Procyon." },
    ],
  },
  {
    ...stations[3],
    latin: "Cancer",
    meaning: "The Crab",
    tribe: "Issachar",
    camp: "East",
    blessing: "Genesis 49:14",
    banner: "Issachar is a strong ass couching down between two burdens.",
    cornerstone: false,
    decans: [
      { name: "Ursa Minor", note: "The little bear, and the pole around which the sky turns." },
      { name: "Ursa Major", note: "The great bear. Seven bright stars keep the north." },
      { name: "Argo", note: "The ship. Modern maps split it into Carina, Puppis, and Vela." },
    ],
  },
  {
    ...stations[4],
    latin: "Leo",
    meaning: "The Lion",
    tribe: "Judah",
    camp: "East",
    blessing: "Genesis 49:9",
    banner: "Judah is a lion's whelp. The blessing already names the figure.",
    cornerstone: true,
    decans: [
      { name: "Hydra", note: "The water-serpent that stretches under the Lion." },
      { name: "Crater", note: "The cup set on Hydra's back." },
      { name: "Corvus", note: "The raven perched on the same serpent." },
    ],
  },
  {
    ...stations[5],
    latin: "Virgo",
    meaning: "The Virgin",
    tribe: "Zebulun",
    camp: "East",
    blessing: "Genesis 49:13",
    banner: "Zebulun shall dwell at the haven of the sea; and he shall be for an haven of ships.",
    cornerstone: false,
    decans: [
      { name: "Coma", note: "The sheaf or the hair. Older maps keep a child in the Virgin's hand." },
      { name: "Centaurus", note: "The centaur in the south, under the Virgin." },
      { name: "Boötes", note: "The herdsman. Arcturus, Ayish in Job, stands here." },
    ],
  },
  {
    ...stations[6],
    latin: "Libra",
    meaning: "The Scales",
    tribe: "Levi",
    camp: "Midst",
    blessing: "Deuteronomy 33:10",
    banner: "They shall teach Jacob thy judgments, and Israel thy law.",
    cornerstone: false,
    decans: [
      { name: "Crux", note: "The southern cross, under the Scales." },
      { name: "Lupus", note: "The wolf, beside the centaur." },
      { name: "Corona Borealis", note: "The northern crown." },
    ],
  },
  {
    ...stations[7],
    latin: "Scorpius",
    meaning: "The Scorpion",
    tribe: "Dan",
    camp: "North",
    blessing: "Genesis 49:17",
    banner: "Dan shall be a serpent by the way, an adder in the path.",
    cornerstone: true,
    decans: [
      { name: "Serpens", note: "The serpent in Ophiuchus' hands." },
      { name: "Ophiuchus", note: "The serpent-bearer. He stands on the scorpion." },
      { name: "Hercules", note: "The kneeling man above the scorpion's back." },
    ],
  },
  {
    ...stations[8],
    latin: "Sagittarius",
    meaning: "The Archer",
    tribe: "Asher",
    camp: "North",
    blessing: "Genesis 49:20",
    banner: "Out of Asher his bread shall be fat, and he shall yield royal dainties.",
    cornerstone: false,
    decans: [
      { name: "Lyra", note: "The lyre. Vega is its bright string." },
      { name: "Ara", note: "The altar under the Archer." },
      { name: "Draco", note: "The dragon wound around the pole." },
    ],
  },
  {
    ...stations[9],
    latin: "Capricornus",
    meaning: "The Goat",
    tribe: "Naphtali",
    camp: "North",
    blessing: "Genesis 49:21",
    banner: "Naphtali is a hind let loose: he giveth goodly words.",
    cornerstone: false,
    decans: [
      { name: "Sagitta", note: "The arrow, near the eagle." },
      { name: "Aquila", note: "The eagle. Altair is its eye." },
      { name: "Delphinus", note: "The dolphin, a small northern figure." },
    ],
  },
  {
    ...stations[10],
    latin: "Aquarius",
    meaning: "The Water-bearer",
    tribe: "Reuben",
    camp: "South",
    blessing: "Genesis 49:4",
    banner: "Unstable as water, thou shalt not excel. The blessing already names water.",
    cornerstone: true,
    decans: [
      { name: "Piscis Austrinus", note: "The southern fish that drinks the water." },
      { name: "Pegasus", note: "The winged horse of the autumn square." },
      { name: "Cygnus", note: "The swan on the summer river of the Milky Way." },
    ],
  },
  {
    ...stations[11],
    latin: "Pisces",
    meaning: "The Fishes",
    tribe: "Simeon",
    camp: "South",
    blessing: "Genesis 49:5",
    banner: "Simeon and Levi are brethren; instruments of cruelty are in their habitations.",
    cornerstone: false,
    decans: [
      { name: "The Band", note: "The cord that joins the two fishes on older maps." },
      { name: "Andromeda", note: "The chained maiden of the autumn sky." },
      { name: "Cepheus", note: "The seated king above Cassiopeia." },
    ],
  },
]

export function stationAt(longitude: number) {
  const index = Math.floor(((longitude % 360) + 360) % 360 / 30) % 12
  return mazzaroth[index]
}

export function stationDegree(longitude: number) {
  return Math.round((((longitude % 360) + 360) % 360 % 30) * 10) / 10
}

export function bodiesIn(station: MazzarothStation, bodies: SkyBody[]) {
  return bodies.filter((body) => stationAt(body.longitude).name === station.name)
}

export function skyAngle(longitude: number) {
  return ((180 - longitude) * Math.PI) / 180
}

const elements = ["fire", "earth", "air", "water"] as const
const qualities = ["cardinal", "fixed", "mutable"] as const

export function stationElement(index: number) {
  return elements[((index % 4) + 4) % 4]
}

export function stationQuality(index: number) {
  return qualities[((index % 3) + 3) % 3]
}

export function chartBalance(bodies: SkyBody[]) {
  const elementCount = { fire: 0, earth: 0, air: 0, water: 0 }
  const qualityCount = { cardinal: 0, fixed: 0, mutable: 0 }
  for (const body of bodies) {
    const index = Math.floor((((body.longitude % 360) + 360) % 360) / 30) % 12
    elementCount[stationElement(index)] += 1
    qualityCount[stationQuality(index)] += 1
  }
  const total = bodies.length || 1
  const percent = (count: number) => Math.round((count / total) * 100)
  return {
    elements: elements.map((id) => ({ id, count: elementCount[id], percent: percent(elementCount[id]) })),
    qualities: qualities.map((id) => ({ id, count: qualityCount[id], percent: percent(qualityCount[id]) })),
  }
}

export function chartCaption(date: string, time: string, bodies: SkyBody[]) {
  const sun = bodies.find((body) => body.id === "sun")
  const moon = bodies.find((body) => body.id === "moon")
  const sunStation = sun ? stationAt(sun.longitude) : mazzaroth[0]
  const moonStation = moon ? stationAt(moon.longitude) : mazzaroth[0]
  const lines = bodies.map((body) => {
    const station = stationAt(body.longitude)
    return `${body.name} ${formatDegree(body.longitude)} · ${station.name} · ${station.tribe}${body.retrograde ? " · turning back" : ""}`
  })
  return [
    `Mazzaroth · ${date} ${time}`,
    `Sun in the ${sunStation.name} (${sunStation.tribe}). Moon in the ${moonStation.name} (${moonStation.tribe}).`,
    "Genesis 1:14 sets the lights for signs, seasons, days, and years. Job 38:32 names Mazzaroth in his season.",
    "",
    ...lines,
  ].join("\n")
}

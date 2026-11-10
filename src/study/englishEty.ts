/** Short English trees in the shape of ety-python. Facts follow Skeat (1910) and Webster 1913. Wording is the desk's. Not Wiktionary. */

export type EtyNode = {
  word: string
  lang: string
  note: string
  strong?: string
  kids?: EtyNode[]
}

const trees: Record<string, EtyNode> = {
  amen: {
    word: "amen",
    lang: "English",
    note: "So be it; it is firm.",
    kids: [{ word: "אָמֵן", lang: "Hebrew", note: "firm, faithful, true.", strong: "H543" }],
  },
  angel: {
    word: "angel",
    lang: "English",
    note: "A messenger.",
    kids: [
      {
        word: "angelus",
        lang: "Latin",
        note: "messenger.",
        kids: [{ word: "ἄγγελος", lang: "Greek", note: "messenger.", strong: "G32" }],
      },
    ],
  },
  apostle: {
    word: "apostle",
    lang: "English",
    note: "One sent out.",
    kids: [{ word: "ἀπόστολος", lang: "Greek", note: "a messenger sent forth.", strong: "G652" }],
  },
  baptism: {
    word: "baptism",
    lang: "English",
    note: "A dipping, a washing.",
    kids: [{ word: "βαπτίζω", lang: "Greek", note: "to dip, to wash.", strong: "G907" }],
  },
  bible: {
    word: "bible",
    lang: "English",
    note: "The book.",
    kids: [
      {
        word: "biblia",
        lang: "Latin",
        note: "books.",
        kids: [{ word: "βιβλίον", lang: "Greek", note: "a small book, a scroll.", strong: "G975" }],
      },
    ],
  },
  cherub: {
    word: "cherub",
    lang: "English",
    note: "A winged living creature.",
    kids: [{ word: "כְּרוּב", lang: "Hebrew", note: "a cherub.", strong: "H3742" }],
  },
  christ: {
    word: "christ",
    lang: "English",
    note: "The anointed.",
    kids: [
      {
        word: "Christus",
        lang: "Latin",
        note: "anointed.",
        kids: [{ word: "Χριστός", lang: "Greek", note: "anointed.", strong: "G5547" }],
      },
    ],
  },
  church: {
    word: "church",
    lang: "English",
    note: "The assembly called out.",
    kids: [
      {
        word: "cirice",
        lang: "Old English",
        note: "the Lord's house.",
        kids: [{ word: "κυριακόν", lang: "Greek", note: "belonging to the Lord.", strong: "G2960" }],
      },
    ],
  },
  covenant: {
    word: "covenant",
    lang: "English",
    note: "A coming together; a bond.",
    kids: [
      { word: "convenire", lang: "Latin", note: "to come together." },
      { word: "בְּרִית", lang: "Hebrew", note: "a cutting, a compact.", strong: "H1285" },
    ],
  },
  cross: {
    word: "cross",
    lang: "English",
    note: "A stake; later the Roman instrument.",
    kids: [
      { word: "crux", lang: "Latin", note: "a cross, a stake." },
      { word: "σταυρός", lang: "Greek", note: "an upright stake.", strong: "G4716" },
    ],
  },
  devil: {
    word: "devil",
    lang: "English",
    note: "The slanderer.",
    kids: [
      {
        word: "diabolus",
        lang: "Latin",
        note: "slanderer.",
        kids: [{ word: "διάβολος", lang: "Greek", note: "accuser, slanderer.", strong: "G1228" }],
      },
    ],
  },
  disciple: {
    word: "disciple",
    lang: "English",
    note: "A learner.",
    kids: [{ word: "discipulus", lang: "Latin", note: "a pupil." }],
  },
  eden: {
    word: "eden",
    lang: "English",
    note: "Delight.",
    kids: [{ word: "עֵדֶן", lang: "Hebrew", note: "pleasure, a garden.", strong: "H5731" }],
  },
  faith: {
    word: "faith",
    lang: "English",
    note: "Trust; that which is believed.",
    kids: [
      { word: "feid", lang: "Old French", note: "faith." },
      { word: "fides", lang: "Latin", note: "trust." },
      { word: "πίστις", lang: "Greek", note: "persuasion, trust.", strong: "G4102" },
    ],
  },
  glory: {
    word: "glory",
    lang: "English",
    note: "Renown; brightness.",
    kids: [
      { word: "gloria", lang: "Latin", note: "fame, praise." },
      { word: "כָּבוֹד", lang: "Hebrew", note: "weight, honour.", strong: "H3519" },
    ],
  },
  god: {
    word: "god",
    lang: "English",
    note: "The invoked; the deity.",
    kids: [
      { word: "god", lang: "Old English", note: "deity." },
      { word: "אֱלֹהִים", lang: "Hebrew", note: "God, gods.", strong: "H430" },
      { word: "θεός", lang: "Greek", note: "a god, God.", strong: "G2316" },
    ],
  },
  gospel: {
    word: "gospel",
    lang: "English",
    note: "Good news.",
    kids: [
      {
        word: "gōdspel",
        lang: "Old English",
        note: "good tale.",
        kids: [
          { word: "gōd", lang: "Old English", note: "good." },
          { word: "spell", lang: "Old English", note: "news, a story." },
        ],
      },
      { word: "εὐαγγέλιον", lang: "Greek", note: "good message.", strong: "G2098" },
    ],
  },
  grace: {
    word: "grace",
    lang: "English",
    note: "Favour freely given.",
    kids: [
      { word: "gratia", lang: "Latin", note: "favour, thanks." },
      { word: "χάρις", lang: "Greek", note: "favour, gift.", strong: "G5485" },
    ],
  },
  hallelujah: {
    word: "hallelujah",
    lang: "English",
    note: "Praise ye the Lord.",
    kids: [{ word: "הַלְלוּ־יָהּ", lang: "Hebrew", note: "praise Yah.", strong: "H1984" }],
  },
  heaven: {
    word: "heaven",
    lang: "English",
    note: "The sky; the abode above.",
    kids: [
      { word: "heofon", lang: "Old English", note: "sky." },
      { word: "שָׁמַיִם", lang: "Hebrew", note: "the heavens.", strong: "H8064" },
    ],
  },
  hell: {
    word: "hell",
    lang: "English",
    note: "The covered place; later the place of the dead.",
    kids: [
      { word: "hel", lang: "Old English", note: "the hidden place." },
      { word: "ᾅδης", lang: "Greek", note: "the unseen place.", strong: "G86" },
      { word: "שְׁאוֹל", lang: "Hebrew", note: "the grave, Sheol.", strong: "H7585" },
    ],
  },
  holy: {
    word: "holy",
    lang: "English",
    note: "Set apart; whole.",
    kids: [
      { word: "hālig", lang: "Old English", note: "sacred." },
      { word: "קָדוֹשׁ", lang: "Hebrew", note: "set apart.", strong: "H6918" },
      { word: "ἅγιος", lang: "Greek", note: "sacred, holy.", strong: "G40" },
    ],
  },
  hope: {
    word: "hope",
    lang: "English",
    note: "Expectation.",
    kids: [
      { word: "hopa", lang: "Old English", note: "expectation." },
      { word: "ἐλπίς", lang: "Greek", note: "expectation of good.", strong: "G1680" },
    ],
  },
  israel: {
    word: "israel",
    lang: "English",
    note: "He who strives with God.",
    kids: [{ word: "יִשְׂרָאֵל", lang: "Hebrew", note: "God strives, or prince with God.", strong: "H3478" }],
  },
  jerusalem: {
    word: "jerusalem",
    lang: "English",
    note: "Foundation of peace.",
    kids: [{ word: "יְרוּשָׁלַםִ", lang: "Hebrew", note: "founded peaceful.", strong: "H3389" }],
  },
  jesus: {
    word: "jesus",
    lang: "English",
    note: "The Lord saves.",
    kids: [
      { word: "Ἰησοῦς", lang: "Greek", note: "Jesus, Joshua.", strong: "G2424" },
      { word: "יְהוֹשׁוּעַ", lang: "Hebrew", note: "the Lord is salvation.", strong: "H3091" },
    ],
  },
  jew: {
    word: "jew",
    lang: "English",
    note: "A man of Judah.",
    kids: [
      { word: "Iudaeus", lang: "Latin", note: "a Judahite." },
      { word: "Ἰουδαῖος", lang: "Greek", note: "a Jew.", strong: "G2453" },
      { word: "יְהוּדָה", lang: "Hebrew", note: "Judah, praised.", strong: "H3063" },
    ],
  },
  jordan: {
    word: "jordan",
    lang: "English",
    note: "The descender.",
    kids: [{ word: "יַרְדֵּן", lang: "Hebrew", note: "the descending river.", strong: "H3383" }],
  },
  lamb: {
    word: "lamb",
    lang: "English",
    note: "A young sheep.",
    kids: [
      { word: "lamb", lang: "Old English", note: "a young sheep." },
      { word: "ἀρνίον", lang: "Greek", note: "a little lamb.", strong: "G721" },
      { word: "שֶׂה", lang: "Hebrew", note: "a lamb or kid.", strong: "H7716" },
    ],
  },
  light: {
    word: "light",
    lang: "English",
    note: "Brightness.",
    kids: [
      { word: "lēoht", lang: "Old English", note: "light." },
      { word: "אוֹר", lang: "Hebrew", note: "light.", strong: "H216" },
      { word: "φῶς", lang: "Greek", note: "light.", strong: "G5457" },
    ],
  },
  lord: {
    word: "lord",
    lang: "English",
    note: "The loaf-ward; later the master.",
    kids: [
      { word: "hlāford", lang: "Old English", note: "loaf keeper." },
      { word: "κύριος", lang: "Greek", note: "master, Lord.", strong: "G2962" },
      { word: "יהוה", lang: "Hebrew", note: "the Name.", strong: "H3068" },
    ],
  },
  love: {
    word: "love",
    lang: "English",
    note: "Affection; charity.",
    kids: [
      { word: "lufu", lang: "Old English", note: "love." },
      { word: "ἀγάπη", lang: "Greek", note: "affection, charity.", strong: "G26" },
      { word: "אַהֲבָה", lang: "Hebrew", note: "love.", strong: "H160" },
    ],
  },
  messiah: {
    word: "messiah",
    lang: "English",
    note: "The anointed.",
    kids: [
      { word: "מָשִׁיחַ", lang: "Hebrew", note: "anointed.", strong: "H4899" },
      { word: "Μεσσίας", lang: "Greek", note: "Messiah.", strong: "G3323" },
    ],
  },
  parable: {
    word: "parable",
    lang: "English",
    note: "A placing beside.",
    kids: [{ word: "παραβολή", lang: "Greek", note: "a comparison, a figure.", strong: "G3850" }],
  },
  paradise: {
    word: "paradise",
    lang: "English",
    note: "A park; a garden.",
    kids: [
      { word: "παράδεισος", lang: "Greek", note: "a park.", strong: "G3857" },
      { word: "pairidaēza", lang: "Old Persian", note: "a walled garden." },
    ],
  },
  passover: {
    word: "passover",
    lang: "English",
    note: "A passing over.",
    kids: [{ word: "פֶּסַח", lang: "Hebrew", note: "a skipping over.", strong: "H6453" }],
  },
  peace: {
    word: "peace",
    lang: "English",
    note: "A joining; rest.",
    kids: [
      { word: "pax", lang: "Latin", note: "peace." },
      { word: "שָׁלוֹם", lang: "Hebrew", note: "wholeness, peace.", strong: "H7965" },
      { word: "εἰρήνη", lang: "Greek", note: "peace.", strong: "G1515" },
    ],
  },
  prayer: {
    word: "prayer",
    lang: "English",
    note: "A request; an asking.",
    kids: [
      { word: "preier", lang: "Old French", note: "a request." },
      { word: "precari", lang: "Latin", note: "to entreat." },
    ],
  },
  priest: {
    word: "priest",
    lang: "English",
    note: "An elder who offers.",
    kids: [
      { word: "prēost", lang: "Old English", note: "priest." },
      { word: "πρεσβύτερος", lang: "Greek", note: "an elder.", strong: "G4245" },
      { word: "כֹּהֵן", lang: "Hebrew", note: "a priest.", strong: "H3548" },
    ],
  },
  prophet: {
    word: "prophet",
    lang: "English",
    note: "One who speaks for another.",
    kids: [
      { word: "προφήτης", lang: "Greek", note: "an interpreter, a proclaimer.", strong: "G4396" },
      { word: "נָבִיא", lang: "Hebrew", note: "a spokesman.", strong: "H5030" },
    ],
  },
  redeem: {
    word: "redeem",
    lang: "English",
    note: "To buy back.",
    kids: [
      { word: "redimere", lang: "Latin", note: "to buy back." },
      { word: "גָּאַל", lang: "Hebrew", note: "to redeem as kin.", strong: "H1350" },
    ],
  },
  resurrection: {
    word: "resurrection",
    lang: "English",
    note: "A standing up again.",
    kids: [{ word: "ἀνάστασις", lang: "Greek", note: "a raising up.", strong: "G386" }],
  },
  sabbath: {
    word: "sabbath",
    lang: "English",
    note: "A ceasing.",
    kids: [{ word: "שַׁבָּת", lang: "Hebrew", note: "intermission, rest.", strong: "H7676" }],
  },
  salvation: {
    word: "salvation",
    lang: "English",
    note: "A making safe.",
    kids: [
      { word: "salvatio", lang: "Latin", note: "a saving." },
      { word: "יְשׁוּעָה", lang: "Hebrew", note: "deliverance.", strong: "H3444" },
      { word: "σωτηρία", lang: "Greek", note: "rescue, safety.", strong: "G4991" },
    ],
  },
  satan: {
    word: "satan",
    lang: "English",
    note: "The adversary.",
    kids: [
      { word: "שָׂטָן", lang: "Hebrew", note: "an opponent.", strong: "H7854" },
      { word: "Σατανᾶς", lang: "Greek", note: "the accuser.", strong: "G4567" },
    ],
  },
  scripture: {
    word: "scripture",
    lang: "English",
    note: "That which is written.",
    kids: [
      { word: "scriptura", lang: "Latin", note: "a writing." },
      { word: "γραφή", lang: "Greek", note: "a writing.", strong: "G1124" },
    ],
  },
  seraph: {
    word: "seraph",
    lang: "English",
    note: "A burning one.",
    kids: [{ word: "שָׂרָף", lang: "Hebrew", note: "a burning one.", strong: "H8314" }],
  },
  shepherd: {
    word: "shepherd",
    lang: "English",
    note: "A sheep-herd.",
    kids: [
      { word: "scēaphierde", lang: "Old English", note: "sheep keeper." },
      { word: "ποιμήν", lang: "Greek", note: "a shepherd.", strong: "G4166" },
      { word: "רֹעֶה", lang: "Hebrew", note: "a feeder, a shepherd.", strong: "H7462" },
    ],
  },
  sin: {
    word: "sin",
    lang: "English",
    note: "A missing of the mark.",
    kids: [
      { word: "synn", lang: "Old English", note: "guilt." },
      { word: "ἁμαρτία", lang: "Greek", note: "a missing, an offense.", strong: "G266" },
      { word: "חַטָּאת", lang: "Hebrew", note: "an offense, a sin-offering.", strong: "H2403" },
    ],
  },
  spirit: {
    word: "spirit",
    lang: "English",
    note: "Breath; wind.",
    kids: [
      { word: "spiritus", lang: "Latin", note: "breath." },
      { word: "πνεῦμα", lang: "Greek", note: "wind, breath, spirit.", strong: "G4151" },
      { word: "רוּחַ", lang: "Hebrew", note: "wind, breath, spirit.", strong: "H7307" },
    ],
  },
  star: {
    word: "star",
    lang: "English",
    note: "A light in the sky.",
    kids: [
      { word: "steorra", lang: "Old English", note: "a star." },
      { word: "ἀστήρ", lang: "Greek", note: "a star.", strong: "G792" },
      { word: "כּוֹכָב", lang: "Hebrew", note: "a star.", strong: "H3556" },
    ],
  },
  temple: {
    word: "temple",
    lang: "English",
    note: "A cut-off space; a sanctuary.",
    kids: [
      { word: "templum", lang: "Latin", note: "a sacred precinct." },
      { word: "ναός", lang: "Greek", note: "a shrine.", strong: "G3485" },
      { word: "הֵיכָל", lang: "Hebrew", note: "a palace, a temple.", strong: "H1964" },
    ],
  },
  testament: {
    word: "testament",
    lang: "English",
    note: "A will; a covenant.",
    kids: [
      { word: "testamentum", lang: "Latin", note: "a will." },
      { word: "διαθήκη", lang: "Greek", note: "a disposition, a covenant.", strong: "G1242" },
    ],
  },
  truth: {
    word: "truth",
    lang: "English",
    note: "That which is firm.",
    kids: [
      { word: "trēowth", lang: "Old English", note: "fidelity." },
      { word: "אֱמֶת", lang: "Hebrew", note: "stability, truth.", strong: "H571" },
      { word: "ἀλήθεια", lang: "Greek", note: "truth.", strong: "G225" },
    ],
  },
  word: {
    word: "word",
    lang: "English",
    note: "A saying.",
    kids: [
      { word: "word", lang: "Old English", note: "speech." },
      { word: "λόγος", lang: "Greek", note: "a word, a reason.", strong: "G3056" },
      { word: "דָּבָר", lang: "Hebrew", note: "a word, a matter.", strong: "H1697" },
    ],
  },
  worship: {
    word: "worship",
    lang: "English",
    note: "Worth-ship; honour paid.",
    kids: [{ word: "weorthscipe", lang: "Old English", note: "worthiness, honour." }],
  },
}

const aliases: Record<string, string> = {
  baptize: "baptism",
  baptise: "baptism",
  ecclesia: "church",
  evangile: "gospel",
  hallelujah: "hallelujah",
  alleluia: "hallelujah",
  saviour: "salvation",
  savior: "salvation",
  sheol: "hell",
  hades: "hell",
  yahweh: "lord",
  jehovah: "lord",
  ruach: "spirit",
  pneuma: "spirit",
  logos: "word",
  agape: "love",
  shalom: "peace",
  mashiach: "messiah",
}

function fold(value: string) {
  return value.normalize("NFC").toLowerCase().replace(/[^a-z]/g, "")
}

export const englishFeatured = ["gospel", "angel", "church", "spirit", "word", "love", "grace", "christ"]

export function englishTree(query: string): EtyNode | null {
  const key = fold(query)
  if (!key) return null
  const named = aliases[key] ?? key
  return trees[named] ?? null
}

export function collectStrongs(node: EtyNode, into: string[] = []): string[] {
  if (node.strong && !into.includes(node.strong)) into.push(node.strong)
  for (const kid of node.kids ?? []) collectStrongs(kid, into)
  return into
}

export function flattenTree(node: EtyNode, depth = 0): { depth: number; node: EtyNode }[] {
  return [{ depth, node }, ...(node.kids ?? []).flatMap((kid) => flattenTree(kid, depth + 1))]
}

/** Works named in Scripture that sit outside the sixty-six. Desk-authored notes only. */

export type LostBookStatus = "shipped" | "forgery_labeled" | "lost" | "deferred"

export type LostBook = {
  title: string
  refs: string[]
  note: string
  status: LostBookStatus
  askPrompt: string
  furtherReading?: { label: string; url: string }[]
  /** Extra-canon catalog id when the desk ships a public-domain text. */
  libraryId?: string
}

export const lostBookStatusLabel: Record<LostBookStatus, string> = {
  shipped: "On desk",
  forgery_labeled: "Forgery · study",
  lost: "Lost",
  deferred: "Deferred",
}

export const lostBooks: LostBook[] = [
  {
    title: "Book of the Wars of the Lord",
    refs: ["Numbers 21:14", "Numbers 21:15"],
    note: "Named in the wilderness itinerary. Only a short poetic scrap survives inside Numbers 21; the book itself is not preserved with the sixty-six.",
    status: "lost",
    askPrompt:
      "Open Numbers 21:14–15. What does Scripture quote from the Book of the Wars of the Lord, and what does that tell us about a source that is otherwise lost?",
  },
  {
    title: "Book of Jasher",
    refs: ["Joshua 10:13", "2 Samuel 1:18"],
    note: "Cited for the sun standing still and for the song of the bow. Extra-canon holds the 1840/1887 English Jasher tradition — a later Midrashic work claiming the title, not a recovered Joshua-era scroll.",
    status: "shipped",
    libraryId: "jasher",
    askPrompt:
      "Compare Joshua 10:13 and 2 Samuel 1:18 with the desk’s Book of Jasher. Keep the sixty-six as Scripture and Jasher as Extra-canon Midrashic tradition.",
  },
  {
    title: "Book of the Acts of Solomon",
    refs: ["1 Kings 11:41"],
    note: "Named as a fuller record of Solomon’s reign. No independent book survives; Kings and Chronicles remain the desk’s Scripture witness.",
    status: "lost",
    askPrompt:
      "What does 1 Kings 11:41 imply about lost court records of Solomon, and how should study treat a book named but not preserved?",
  },
  {
    title: "Book of Samuel the Seer",
    refs: ["1 Chronicles 29:29"],
    note: "Listed with Nathan and Gad among the chronicles of David. Likely among the Chronicler’s sources; the text itself is lost.",
    status: "lost",
    askPrompt:
      "Read 1 Chronicles 29:29. How do Samuel, Nathan, and Gad as named sources sit beside Samuel–Kings as Scripture?",
  },
  {
    title: "Book of Nathan the Prophet",
    refs: ["1 Chronicles 29:29", "2 Chronicles 9:29"],
    note: "Named beside Samuel and Gad for David; also cited for Solomon. Not preserved as a separate book on this desk.",
    status: "lost",
    askPrompt:
      "Nathan is named as a source in Chronicles. Summarize what Scripture still tells us about Nathan’s ministry without inventing a lost book.",
  },
  {
    title: "Book of Gad the Seer",
    refs: ["1 Chronicles 29:29"],
    note: "Named with Samuel and Nathan in the acts of David. A later Cochin manuscript titled Words of Gad the Seer exists; scholarly editions are copyrighted. Desk ships Links notes only until a clean public-domain English extract is confirmed.",
    status: "deferred",
    askPrompt:
      "1 Chronicles 29:29 names the book of Gad the seer. Distinguish the lost Chronicler source from later manuscripts that reuse the title.",
    furtherReading: [
      {
        label: "Wikipedia · Book of Gad the Seer (overview)",
        url: "https://en.wikipedia.org/wiki/Book_of_Gad_the_Seer",
      },
    ],
  },
  {
    title: "Prophecy of Ahijah the Shilonite",
    refs: ["2 Chronicles 9:29"],
    note: "Cited among writings about Solomon. Ahijah’s words in Kings remain Scripture; a separate “prophecy” book is not preserved here.",
    status: "lost",
    askPrompt:
      "Open 2 Chronicles 9:29 and the Ahijah scenes in Kings. What does Scripture preserve of Ahijah versus what it only names as a source?",
  },
  {
    title: "Visions of Iddo the Seer",
    refs: ["2 Chronicles 9:29", "2 Chronicles 12:15", "2 Chronicles 13:22"],
    note: "Named for Solomon, Rehoboam, and Abijah. Another lost Chronicler source.",
    status: "lost",
    askPrompt:
      "Chronicles names the visions of Iddo for several kings. What pattern of lost prophetic sources does that show?",
  },
  {
    title: "Book of Shemaiah the Prophet",
    refs: ["2 Chronicles 12:15"],
    note: "Paired with Iddo for the acts of Rehoboam. Not preserved as a separate Extra-canon text.",
    status: "lost",
    askPrompt:
      "Read 2 Chronicles 12 on Shemaiah and Rehoboam. Separate the prophet’s recorded words from the lost “book” named as a source.",
  },
  {
    title: "Book of Jehu son of Hanani",
    refs: ["2 Chronicles 20:34"],
    note: "Said to be written in the book of the kings of Israel. The independent Jehu record is lost.",
    status: "lost",
    askPrompt:
      "What does 2 Chronicles 20:34 say about Jehu son of Hanani, and how does that fit the Chronicler’s habit of naming lost sources?",
  },
  {
    title: "Sayings of the Seers",
    refs: ["2 Chronicles 33:19"],
    note: "Named for Manasseh’s prayer and the places of the high places. Lost as a separate collection.",
    status: "lost",
    askPrompt:
      "Open 2 Chronicles 33:19. What does Scripture still teach about Manasseh, and what does the named “sayings of the seers” leave unknown?",
  },
  {
    title: "Prior letter to the Corinthians",
    refs: ["1 Corinthians 5:9"],
    note: "Paul refers to an earlier letter. That letter is not among the sixty-six; scholars debate whether fragments survive inside later correspondence — the desk does not invent the text.",
    status: "lost",
    askPrompt:
      "1 Corinthians 5:9 mentions a prior letter. Explain what we know from the verse itself without reconstructing a lost epistle as Scripture.",
  },
  {
    title: "Letter from Laodicea",
    refs: ["Colossians 4:16"],
    note: "Paul asks that a letter from Laodicea be read. His letter is lost. Extra-canon ships the later Latin Epistle to the Laodiceans (M.R. James) as a labeled forgery pastiche — not the Colossians original.",
    status: "forgery_labeled",
    libraryId: "laodiceans",
    askPrompt:
      "Colossians 4:16 names a letter from Laodicea. Compare that lost letter with the Latin Epistle to the Laodiceans on Extra-canon — keep the forgery labeled.",
  },
  {
    title: "Prophecy of Enoch",
    refs: ["Jude 1:14"],
    note: "Jude cites Enoch. Extra-canon holds public-domain Enoch readings beside Scripture — Extra-canon, not a sixty-seventh book.",
    status: "shipped",
    libraryId: "enoch-readings",
    askPrompt:
      "Jude 1:14 cites Enoch. Open the desk’s Enoch readings and keep Jude as Scripture and Enoch as Extra-canon.",
  },
]

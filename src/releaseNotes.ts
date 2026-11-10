import { changeLog, type ChangeEntry } from "./changelog"

/** Brief user-facing What’s New / Settings → About entries (not a development log). */
export function releaseChangeLog(): ChangeEntry[] {
  return changeLog
}

export function releaseItems(entry: ChangeEntry) {
  return entry.items
}

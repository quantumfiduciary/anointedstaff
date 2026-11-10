import { changeLog, type ChangeEntry } from "./changelog"

/** User-facing What’s New / Settings → About entries. */
export function releaseChangeLog(): ChangeEntry[] {
  return changeLog
}

export function releaseItems(entry: ChangeEntry) {
  return entry.items
}

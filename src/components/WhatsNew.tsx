import { createPortal } from "react-dom"
import { releaseChangeLog, releaseItems } from "../releaseNotes"
import { Button } from "./ui/button"

export const whatsNewSeenKey = "anointed-staff.whats-new-seen"

export function latestReleaseId() {
  const top = releaseChangeLog()[0]
  return top ? `${top.date}::${top.title}` : ""
}

export function shouldShowWhatsNew() {
  const id = latestReleaseId()
  if (!id) return false
  try {
    return localStorage.getItem(whatsNewSeenKey) !== id
  } catch {
    return false
  }
}

export function markWhatsNewSeen() {
  try {
    localStorage.setItem(whatsNewSeenKey, latestReleaseId())
  } catch {
    /* private mode */
  }
}

type WhatsNewProps = {
  open: boolean
  onClose: () => void
  onOpenGuide?: () => void
}

/** Post-update release card — first launch after a newer published changelog entry. */
export function WhatsNew({ open, onClose, onOpenGuide }: WhatsNewProps) {
  if (!open || typeof document === "undefined") return null
  const entry = releaseChangeLog()[0]
  if (!entry) return null
  const release = releaseItems(entry).slice(0, 5)
  return createPortal(
    <div className="whats-new-backdrop" role="presentation" onClick={onClose}>
      <div
        className="whats-new-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="whats-new-kicker">What’s new · {entry.date}</p>
        <h2 id="whats-new-title">{entry.title}</h2>
        <ul className="whats-new-bullets">
          {release.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="whats-new-actions">
          {onOpenGuide ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose()
                onOpenGuide()
              }}
            >
              Open Guide
            </Button>
          ) : null}
          <Button type="button" size="sm" onClick={onClose}>
            Continue
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

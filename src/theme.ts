/** Desk appearance themes — refine Staff Gold language; add parchment (warm light) and ink (cool night). */

export type DeskTheme = "light" | "dark" | "mystic" | "parchment" | "ink"

export const deskThemes: DeskTheme[] = ["light", "dark", "mystic", "parchment", "ink"]

const order: DeskTheme[] = deskThemes

export function isDeskTheme(value: unknown): value is DeskTheme {
  return value === "light" || value === "dark" || value === "mystic" || value === "parchment" || value === "ink"
}

export function parseDeskTheme(value: unknown, fallback: DeskTheme = "dark"): DeskTheme {
  return isDeskTheme(value) ? value : fallback
}

/** Cycle Light → Dark → Mystic → Parchment → Ink → Light. */
export function nextDeskTheme(current: DeskTheme): DeskTheme {
  const index = order.indexOf(current)
  return order[(index < 0 ? 0 : index + 1) % order.length]
}

export function deskThemeLabel(theme: DeskTheme): string {
  if (theme === "light") return "Light"
  if (theme === "mystic") return "Mystic"
  if (theme === "parchment") return "Parchment"
  if (theme === "ink") return "Ink"
  return "Dark"
}

export function deskThemeHint(theme: DeskTheme): string {
  if (theme === "light") return "Cream desk · Staff Gold"
  if (theme === "dark") return "Warm night · gold voltage"
  if (theme === "mystic") return "Lamp-and-night · indigo ink"
  if (theme === "parchment") return "Warmer paper · soft gold"
  return "Cool night · quiet steel"
}

/** Label for the control that advances to the next theme. */
export function nextDeskThemeLabel(current: DeskTheme): string {
  return `${deskThemeLabel(nextDeskTheme(current))} theme`
}

export function deskThemeMetaColor(theme: DeskTheme): string {
  if (theme === "light") return "#e6e4e1"
  if (theme === "parchment") return "#ebe0cf"
  if (theme === "mystic") return "#0a0c14"
  if (theme === "ink") return "#0b0e12"
  return "#0c0c0e"
}

export function deskAtmosphereSrc(theme: DeskTheme): string {
  if (theme === "light" || theme === "parchment") return "/brand/atmosphere-desk-light.png"
  if (theme === "mystic") return "/brand/desk-atmosphere.png"
  return "/brand/atmosphere-desk.png"
}

/** Light-family themes (cream wordmarks, light Excalidraw). */
export function isLightDeskTheme(theme: string | undefined): boolean {
  return theme === "light" || theme === "parchment"
}

/** Dark-family themes (night chrome, dark Excalidraw). */
export function isDarkDeskTheme(theme: string | undefined): boolean {
  return theme === "dark" || theme === "mystic" || theme === "ink"
}

/** Excalidraw only knows light/dark. */
export function sketchBoardTheme(theme: string | undefined): "light" | "dark" {
  return isLightDeskTheme(theme) ? "light" : "dark"
}

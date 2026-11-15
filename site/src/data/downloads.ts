/** Exact v0.2.2 GitHub Release asset URLs for marketing CTAs. */
export const github = "https://github.com/quantumfiduciary/anointedstaff"
export const releases = `${github}/releases`
export const releaseTag = "v0.2.2"
export const releasePage = `${releases}/tag/${releaseTag}`
const base = `${releases}/download/${releaseTag}`

export const downloads = {
  windows: {
    label: "Windows",
    detail: "NSIS setup",
    href: `${base}/Anointed.Staff_0.2.2_x64-setup.exe`,
    filename: "Anointed.Staff_0.2.2_x64-setup.exe",
  },
  linuxAppImage: {
    label: "Linux AppImage",
    detail: "amd64 · chmod +x then run",
    href: `${base}/Anointed.Staff_0.2.2_amd64.AppImage`,
    filename: "Anointed.Staff_0.2.2_amd64.AppImage",
  },
  linuxDeb: {
    label: "Linux .deb",
    detail: "amd64",
    href: `${base}/Anointed.Staff_0.2.2_amd64.deb`,
    filename: "Anointed.Staff_0.2.2_amd64.deb",
  },
  mac: {
    label: "macOS",
    detail: "Universal .dmg (Apple Silicon + Intel)",
    href: `${base}/Anointed.Staff_0.2.2_universal.dmg`,
    filename: "Anointed.Staff_0.2.2_universal.dmg",
  },
} as const

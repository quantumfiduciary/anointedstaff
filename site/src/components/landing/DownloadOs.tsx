import { motion, useReducedMotion } from "motion/react"
import { Download } from "lucide-react"
import { AppleIcon, GitHubIcon, LinuxIcon, WindowsIcon } from "./OsIcons"
import { usePreferredOs } from "./usePreferredOs"
import { cn } from "../../lib/utils"

type Props = {
  windowsHref: string
  linuxHref: string
  linuxDebHref: string
  macHref: string
  githubHref: string
  releasePage: string
}

const tiles = [
  { os: "windows" as const, label: "Windows", Icon: WindowsIcon, detail: "Desktop installer" },
  { os: "linux" as const, label: "Linux", Icon: LinuxIcon, detail: "AppImage" },
  { os: "mac" as const, label: "macOS", Icon: AppleIcon, detail: "Apple Silicon" },
]

export function DownloadOs({
  windowsHref,
  linuxHref,
  linuxDebHref,
  macHref,
  githubHref,
  releasePage,
}: Props) {
  const preferred = usePreferredOs()
  const reduce = useReducedMotion()
  const hrefs = { windows: windowsHref, linux: linuxHref, mac: macHref }

  return (
    <section className="section download-band relative overflow-hidden py-20" id="download">
      <div className="wrap relative">
        <div className="section-head mb-8 max-w-xl">
          <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--gold-lamp)]">
            Keep the desk
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.35rem)] font-semibold text-[var(--night-ink)]">
            Run Anointed Staff on your machine
          </h2>
          <p className="mt-3 text-[var(--night-muted)]">
            Pick your OS below, or clone the monorepo and run locally. This site does not host the
            study runtime — that is intentional.
          </p>
        </div>

        <div className="os-download-grid grid gap-3 sm:grid-cols-3" data-download-os>
          {tiles.map((tile, i) => {
            const preferredTile = preferred === tile.os
            return (
              <motion.a
                key={tile.os}
                href={hrefs[tile.os]}
                data-os={tile.os}
                data-preferred={preferredTile ? "true" : undefined}
                className={cn(
                  "os-card group flex flex-col items-start gap-3 rounded-[12px] border px-5 py-5 no-underline transition-colors",
                  "border-[color-mix(in_srgb,var(--gold-lamp)_28%,transparent)] bg-[color-mix(in_srgb,var(--night)_72%,#1a1e2a)] text-[var(--night-ink)]",
                  preferredTile &&
                    "border-[var(--gold)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--gold)_50%,transparent),0_0_28px_color-mix(in_srgb,var(--gold)_18%,transparent)]",
                )}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={reduce ? undefined : { scale: 1.02, y: -2 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
              >
                <tile.Icon className="os-icon h-8 w-8 text-[var(--gold-lamp)]" />
                <strong className="font-[family-name:var(--font-display)] text-xl font-semibold">
                  {tile.label}
                </strong>
                <span className="text-sm text-[var(--night-muted)]">{tile.detail}</span>
              </motion.a>
            )
          })}
        </div>

        <p className="mt-4 text-sm text-[var(--night-muted)]">
          Prefer a Debian package?{" "}
          <a className="text-[var(--gold-lamp)] underline-offset-2 hover:underline" href={linuxDebHref}>
            Download Linux .deb
          </a>
        </p>

        <div className="cta-row mt-6 flex flex-wrap gap-3">
          <a
            className="btn btn-ghost inline-flex h-11 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gold-lamp)_40%,transparent)] px-5 text-sm font-medium text-[var(--night-ink)]"
            href={releasePage}
          >
            <Download className="h-4 w-4" />
            All release assets
          </a>
          <a
            className="btn btn-ghost inline-flex h-11 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gold-lamp)_40%,transparent)] px-5 text-sm font-medium text-[var(--night-ink)]"
            href={githubHref}
          >
            <GitHubIcon className="h-4 w-4" />
            View source
          </a>
        </div>
      </div>
    </section>
  )
}

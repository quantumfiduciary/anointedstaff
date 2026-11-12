import { motion, useReducedMotion } from "motion/react"
import { AppleIcon, GitHubIcon, LinuxIcon, WindowsIcon } from "./OsIcons"
import { usePreferredOs } from "./usePreferredOs"
import { cn } from "../../lib/utils"

type Props = {
  windowsHref: string
  linuxHref: string
  macHref: string
  githubHref: string
  releasePage: string
}

export function Hero({ windowsHref, linuxHref, macHref, githubHref, releasePage }: Props) {
  const preferred = usePreferredOs()
  const reduce = useReducedMotion()

  return (
    <section className="hero relative isolate min-h-[min(92vh,56rem)] overflow-hidden" aria-label="Anointed Staff">
      <div className="hero-media absolute inset-0 -z-10" aria-hidden="true">
        <video
          className="hero-desk hero-bed h-full w-full object-cover"
          src="/marketing/comfy/video/bed-lamp-desk.mp4"
          poster="/marketing/stills/landing/hero-lamp-desk-16x9.png"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <img
          className="hero-atmosphere absolute inset-0 h-full w-full object-cover opacity-55 mix-blend-screen"
          src="/marketing/stills/landing/heavens-clocks-16x9.png"
          alt=""
          width={1280}
          height={720}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--night)] via-[color-mix(in_srgb,var(--night)_55%,transparent)] to-[color-mix(in_srgb,var(--night)_25%,transparent)]" />
      </div>

      <div className="wrap relative flex min-h-[min(92vh,56rem)] flex-col justify-end pb-16 pt-28 sm:pb-20">
        <motion.div
          className="hero-copy max-w-2xl"
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            className="hero-wordmark mb-5 w-[min(100%,22rem)]"
            src="/brand/wordmark-dark.png"
            alt="Anointed Staff"
            width={720}
            height={720}
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.85rem,4.5vw,3rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[var(--night-ink)]">
            One desk for the Word—and every tool that serves it.
          </h1>
          <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-[color-mix(in_srgb,var(--night-ink)_82%,transparent)]">
            Public-domain Scripture and Extra-canon shelves. Strong’s, letters, Heavens clocks,
            Notes, Practice—and optional AI beside the open chapter. All of it local, lamp-lit, and
            yours to keep.
          </p>

          <div className="cta-row download-os mt-7 flex flex-wrap gap-3" data-download-os>
            <a
              className={cn(
                "btn inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium",
                preferred === "windows" ? "btn-primary bg-[var(--gold)] text-[var(--on-gold)]" : "btn-ghost border border-[color-mix(in_srgb,var(--gold-lamp)_40%,transparent)] text-[var(--night-ink)]",
              )}
              data-os="windows"
              data-preferred={preferred === "windows" ? "true" : undefined}
              href={windowsHref}
            >
              <WindowsIcon className="h-4 w-4" />
              Windows
            </a>
            <a
              className={cn(
                "btn inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium",
                preferred === "linux" ? "btn-primary bg-[var(--gold)] text-[var(--on-gold)]" : "btn-ghost border border-[color-mix(in_srgb,var(--gold-lamp)_40%,transparent)] text-[var(--night-ink)]",
              )}
              data-os="linux"
              data-preferred={preferred === "linux" ? "true" : undefined}
              href={linuxHref}
            >
              <LinuxIcon className="h-4 w-4" />
              Linux
            </a>
            <a
              className={cn(
                "btn inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium",
                preferred === "mac" ? "btn-primary bg-[var(--gold)] text-[var(--on-gold)]" : "btn-ghost border border-[color-mix(in_srgb,var(--gold-lamp)_40%,transparent)] text-[var(--night-ink)]",
              )}
              data-os="mac"
              data-preferred={preferred === "mac" ? "true" : undefined}
              href={macHref}
            >
              <AppleIcon className="h-4 w-4" />
              macOS
            </a>
            <a
              className="btn btn-ghost inline-flex h-11 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gold-lamp)_40%,transparent)] px-5 text-sm font-medium text-[var(--night-ink)]"
              href={githubHref}
            >
              <GitHubIcon className="h-4 w-4" />
              View source
            </a>
          </div>
          <p className="download-note mt-3 text-sm text-[color-mix(in_srgb,var(--night-ink)_75%,transparent)]">
            Or browse all assets on{" "}
            <a className="text-[var(--gold-lamp)] underline-offset-2 hover:underline" href={releasePage}>
              Releases v0.2.0
            </a>
            . Unsigned macOS builds: right-click → Open if Gatekeeper blocks.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

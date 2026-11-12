import { motion, useReducedMotion } from "motion/react"

export function FilmStage() {
  const reduce = useReducedMotion()

  return (
    <section className="section muted-band py-20" id="film">
      <div className="wrap">
        <motion.div
          className="section-head mb-8 max-w-xl"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--gold)]">
            Watch
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.35rem)] font-semibold text-[var(--ink)]">
            A study desk you keep
          </h2>
          <p className="mt-3 text-[var(--body)]">
            Kinetic type and real panes — Scripture at the center, Hebrew and Strong’s beside the
            line, Heavens as clocks, notes that stay on your machine.
          </p>
        </motion.div>
        <motion.figure
          className="kinetic-feature m-0 max-w-4xl overflow-hidden rounded-[var(--radius)] border border-[var(--hairline)] bg-[#0c0c0b] shadow-[0_18px_40px_color-mix(in_srgb,#000_16%,transparent)]"
          initial={reduce ? false : { opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <video
            className="aspect-video w-full object-cover"
            controls
            playsInline
            preload="metadata"
            poster="/marketing/stills/landing/hero-lamp-desk-16x9.png"
            src="/marketing/comfy/video/kinetic-text-16x9.mp4"
          />
          <figcaption className="border-t border-[var(--hairline)] px-4 py-3 text-sm text-[var(--body)]">
            Kinetic launch cut · 16:9 —
            <a
              className="ml-1 text-[var(--gold-deep)] underline-offset-2 hover:underline"
              href="/marketing/comfy/video/kinetic-text-9x16.mp4"
            >
              download 9:16
            </a>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  )
}

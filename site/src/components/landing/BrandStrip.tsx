import { motion, useReducedMotion } from "motion/react"

export function BrandStrip() {
  const reduce = useReducedMotion()

  return (
    <section className="relative isolate min-h-[min(70vh,34rem)] overflow-hidden" aria-label="Brand">
      <img
        src="/brand/poster-mono-grunge.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        width={1600}
        height={1600}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[color-mix(in_srgb,var(--night)_78%,transparent)] via-[color-mix(in_srgb,var(--night)_45%,transparent)] to-transparent" />
      <div className="wrap relative flex min-h-[min(70vh,34rem)] items-center py-16">
        <motion.div
          className="max-w-lg"
          initial={reduce ? false : { opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src="/brand/wordmark-cream.png"
            alt="Anointed Staff"
            className="mb-6 w-[min(100%,18rem)]"
            width={720}
            height={400}
            loading="lazy"
          />
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--night-ink)] sm:text-3xl">
            Scripture study desk. Local only.
          </p>
          <p className="mt-3 max-w-md text-[var(--night-muted)]">
            Stone · gold · olive on cream and dark sheets — a mark for the walk, not a relic shop.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

import { motion, useReducedMotion } from "motion/react"

export function HebrewPlate() {
  const reduce = useReducedMotion()

  return (
    <section className="section muted-band py-20" id="letters">
      <div className="wrap grid items-center gap-10 lg:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--gold)]">
            Letters
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.35rem)] font-semibold">
            Ayin · Beth · Resh beside the chapter
          </h2>
          <p className="mt-3 max-w-md text-[var(--body)]">
            Gematria and letter study stay on the desk — mothers, doubles, simples, Hear clips, and
            drills that link back to Strong’s and Scripture. Read right to left; keep the Word in
            the center.
          </p>
        </motion.div>
        <motion.img
          src="/brand/words/Hebrew-AyinBethResh.jpg"
          alt="Hebrew letters Ayin, Beth, and Resh with eye, in, and head meanings"
          className="w-full rounded-[var(--radius)] border border-[var(--hairline)] shadow-[0_18px_40px_color-mix(in_srgb,#000_14%,transparent)]"
          width={1024}
          height={1024}
          loading="lazy"
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </section>
  )
}

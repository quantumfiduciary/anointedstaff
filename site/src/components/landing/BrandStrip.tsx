import { motion, useReducedMotion } from "motion/react"

export function BrandStrip() {
  const reduce = useReducedMotion()

  return (
    <section className="relative isolate overflow-hidden" aria-label="Ancient wisdom. Modern tools.">
      <motion.img
        src="/marketing/posters/ancient-wisdom-modern-tools.png"
        alt="Anointed Staff — Ancient wisdom. Modern tools. Scripture study, ancient languages, historical writings, notes, and optional AI assistance."
        className="block h-auto w-full"
        width={1920}
        height={1080}
        loading="lazy"
        initial={reduce ? false : { opacity: 0.75, scale: 1.02 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </section>
  )
}

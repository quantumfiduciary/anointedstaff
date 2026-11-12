import { motion, useReducedMotion } from "motion/react"

type Props = {
  src: string
  alt: string
  id?: string
  caption?: string
}

/** Full-bleed campaign poster — the art carries brand + line; chrome stays thin. */
export function PosterMoment({ src, alt, id, caption }: Props) {
  const reduce = useReducedMotion()

  return (
    <section
      className="relative isolate overflow-hidden"
      id={id}
      aria-label={alt}
    >
      <motion.img
        src={src}
        alt={alt}
        width={1920}
        height={1080}
        loading="lazy"
        className="block h-auto w-full"
        initial={reduce ? false : { opacity: 0.72, scale: 1.03 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      />
      {caption ? (
        <p className="wrap py-4 text-center text-sm text-[var(--muted)]">{caption}</p>
      ) : null}
    </section>
  )
}

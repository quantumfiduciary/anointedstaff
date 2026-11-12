import { motion, useReducedMotion } from "motion/react"
import { BookOpen, Library, Sparkles } from "lucide-react"

const pillars = [
  {
    icon: Library,
    title: "One shelf of witnesses",
    body: "Public-domain Scripture and Extra-canon shelves in one room — labeled, credited, and kept beside the open chapter instead of scattered across sites.",
  },
  {
    icon: BookOpen,
    title: "A full study room",
    body: "Strong’s, Roots, letters, Heavens clocks, Notes, Compare, Voice, and Practice — tools that serve the Word without pulling you into another account.",
  },
  {
    icon: Sparkles,
    title: "AI beside the chapter",
    body: "Optional local or cloud model with study chips for Explain, Strong’s, Extra-canon, and Heavens. Keys default to session-only; the chapter stays the altar.",
  },
]

export function PromiseBand() {
  const reduce = useReducedMotion()

  return (
    <section className="section muted-band py-20" id="promise" aria-label="What makes the desk rare">
      <div className="wrap">
        <div className="section-head mx-auto mb-10 max-w-2xl text-center">
          <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--gold)]">
            The rare room
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.35rem)] font-semibold text-[var(--ink)]">
            Ancient witnesses. Deep tools. AI that stays local.
          </h2>
          <p className="mt-3 text-[var(--body)]">
            Most apps give you a verse feed or a single lexicon. Anointed Staff gathers the glory of
            a scholar’s desk into one lamp-lit window you keep on your machine.
          </p>
        </div>

        <motion.div
          className="grid gap-5 md:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduce ? 0 : 0.1 } },
          }}
        >
          {pillars.map((pillar) => (
            <motion.article
              key={pillar.title}
              className="rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--gold)_22%,var(--hairline))] bg-[color-mix(in_srgb,var(--panel)_94%,transparent)] p-6 shadow-[0_12px_32px_color-mix(in_srgb,#000_8%,transparent)]"
              variants={{
                hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--gold)_14%,transparent)] text-[var(--gold)]">
                <pillar.icon className="h-5 w-5" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--body)]">{pillar.body}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

import type { ComponentType } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Clock, ScrollText, BookMarked, Lock } from "lucide-react"

export type FenceItem = {
  icon: string
  title: string
  body: string
}

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  clock: Clock,
  "scroll-text": ScrollText,
  "book-marked": BookMarked,
  lock: Lock,
}

type Props = { items: FenceItem[] }

export function FenceList({ items }: Props) {
  const reduce = useReducedMotion()

  return (
    <section className="section lore-band py-20" id="fence">
      <div className="wrap">
        <div className="section-head mb-8 max-w-xl">
          <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--gold)]">
            The Fence
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.35rem)] font-semibold">
            What the desk will not become
          </h2>
          <p className="mt-3 text-[var(--body)]">
            Lore without a fence turns into marketing fog. These lines stay visible on the product
            and on this page.
          </p>
        </div>
        <ul className="fence-list m-0 grid max-w-2xl list-none gap-3 p-0">
          {items.map((item, i) => {
            const Icon = iconMap[item.icon] ?? Lock
            return (
              <motion.li
                key={item.title}
                className="rounded-r-[10px] border-l-2 border-[var(--gold)] bg-[color-mix(in_srgb,var(--panel)_85%,transparent)] px-4 py-4"
                initial={reduce ? false : { opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
              >
                <strong className="mb-1 flex items-center gap-2 font-[family-name:var(--font-display)] text-[var(--ink)]">
                  <Icon className="h-4 w-4 text-[var(--gold-deep)]" />
                  {item.title}
                </strong>
                <span className="text-sm text-[var(--body)]">{item.body}</span>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

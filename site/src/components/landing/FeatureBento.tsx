import type { ComponentType } from "react"
import { motion, useReducedMotion } from "motion/react"
import {
  BookOpen,
  Hash,
  GitBranch,
  LayoutGrid,
  Sparkles,
  Mic,
  Library,
  Orbit,
  Flower2,
  AudioLines,
  Palette,
  Type,
} from "lucide-react"
import { Card, CardDescription, CardTitle } from "../ui/card"
import { cn } from "../../lib/utils"

export type FeatureItem = {
  icon: string
  title: string
  body: string
  featured?: boolean
}

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  "book-open": BookOpen,
  hash: Hash,
  "git-branch": GitBranch,
  kanban: LayoutGrid,
  sparkles: Sparkles,
  mic: Mic,
  library: Library,
  "alphabet-hebrew": Type,
  orbit: Orbit,
  "flower-2": Flower2,
  "audio-lines": AudioLines,
  palette: Palette,
}

type Props = { features: FeatureItem[] }

export function FeatureBento({ features }: Props) {
  const reduce = useReducedMotion()

  return (
    <section className="section py-20" id="catalog">
      <div className="wrap">
        <div className="section-head mb-8 max-w-2xl">
          <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--gold)]">
            On the desk
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.35rem)] font-semibold">
            A whole room for Word, language, sky, and growth
          </h2>
          <p className="mt-3 text-[var(--body)]">
            Not a thin verse app — the tools that help you read deeply, remember honestly, and grow
            beside Scripture without leaving the chapter behind.
          </p>
        </div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduce ? 0 : 0.06 } },
          }}
        >
          {features.map((f) => {
            const Icon = iconMap[f.icon] ?? BookOpen
            return (
              <motion.div
                key={f.title}
                className={cn(f.featured && "sm:col-span-2 lg:col-span-2")}
                variants={{
                  hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
                }}
              >
                <Card
                  className={cn(
                    "h-full transition-transform hover:-translate-y-0.5",
                    f.featured &&
                      "border-[color-mix(in_srgb,var(--gold)_40%,var(--hairline))] bg-[color-mix(in_srgb,var(--gold)_6%,var(--panel))]",
                  )}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--gold)_14%,transparent)] text-[var(--gold)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription className={cn(f.featured && "max-w-2xl text-base")}>
                    {f.body}
                  </CardDescription>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

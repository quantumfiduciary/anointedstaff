import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"

export type FaqItem = { q: string; a: string }

type Props = { items: FaqItem[] }

export function FaqAccordion({ items }: Props) {
  return (
    <section className="section py-20" id="faq">
      <div className="wrap">
        <div className="section-head mb-8 max-w-xl">
          <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--gold)]">
            Questions
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.35rem)] font-semibold">
            Before you download
          </h2>
          <p className="mt-3 text-[var(--body)]">
            Plain answers to the objections that usually stop a careful reader.
          </p>
        </div>
        <Accordion type="single" collapsible className="faq grid max-w-2xl gap-3">
          {items.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

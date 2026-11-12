import { cn } from "../../lib/utils"

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--gold)_30%,transparent)] bg-[color-mix(in_srgb,var(--gold)_10%,transparent)] px-3 py-1 text-xs font-medium tracking-wide text-[var(--gold-deep)]",
        className,
      )}
      {...props}
    />
  )
}

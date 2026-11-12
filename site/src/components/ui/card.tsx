import * as React from "react"
import { cn } from "../../lib/utils"

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--gold)_22%,var(--hairline))] bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] p-5 shadow-[0_12px_32px_color-mix(in_srgb,#000_8%,transparent)]",
        className,
      )}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]", className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-2 text-sm leading-relaxed text-[var(--body)]", className)} {...props} />
}

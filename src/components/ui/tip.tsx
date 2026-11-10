import type { ReactElement, ReactNode } from "react"
import * as Tooltip from "@radix-ui/react-tooltip"
import * as Popover from "@radix-ui/react-popover"

export const TipProvider = Tooltip.Provider

type TipProps = {
  content: ReactNode
  children: ReactElement
  side?: "top" | "right" | "bottom" | "left"
  keys?: string
}

/** A short hover or focus hint. The child must be a single element that accepts a ref. */
export function Tip({ content, children, side = "bottom", keys }: TipProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="tip" side={side} sideOffset={6} collisionPadding={8}>
          {content}
          {keys ? <kbd>{keys}</kbd> : null}
          <Tooltip.Arrow className="tip-arrow" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

type PopProps = {
  trigger: ReactElement
  children: ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Pop({ trigger, children, side = "bottom", align = "center", className, open, onOpenChange }: PopProps) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className={className ? `pop ${className}` : "pop"} side={side} align={align} sideOffset={8} collisionPadding={10}>
          {children}
          <Popover.Arrow className="tip-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export const PopClose = Popover.Close

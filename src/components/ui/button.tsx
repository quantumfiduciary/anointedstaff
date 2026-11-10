import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "../../lib/utils"
import { motionDuration, motionTokens } from "../../lib/motionTokens"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--glow-soft)]",
        outline: "border border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-[color-mix(in_srgb,var(--gold)_45%,var(--border))] hover:shadow-[var(--glow-soft)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-[18px] py-2",
        sm: "h-8 rounded-md px-3 text-[0.85rem]",
        lg: "h-11 rounded-lg px-5",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const reduce = useReducedMotion()
  const classes = cn(buttonVariants({ variant, size, className }))

  if (asChild) {
    return <Slot data-slot="button" className={classes} {...props} />
  }

  return (
    <motion.button
      data-slot="button"
      className={classes}
      whileHover={reduce || props.disabled ? undefined : { scale: 1.02, y: -0.5 }}
      whileTap={reduce || props.disabled ? undefined : { scale: 0.97 }}
      transition={{
        duration: motionDuration("fast", !!reduce),
        ease: motionTokens.easing.sharp,
      }}
      {...(props as React.ComponentProps<typeof motion.button>)}
    />
  )
}

export { Button, buttonVariants }

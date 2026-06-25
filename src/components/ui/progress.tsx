"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { clamp } from "@/lib/utils"

const progressVariants = cva("", {
  variants: {
    variant: {
      default: "bg-primary",
      success: "bg-emerald-500",
      warning: "bg-amber-500",
      destructive: "bg-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Progress({
  className,
  value,
  variant = "default",
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> &
  VariantProps<typeof progressVariants> & {
    /** Accessible label describing what this progress represents. */
    "aria-label"?: string
  }) {
  const clamped = clamp(value ?? 0, 0, 100)

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-variant={variant}
      aria-label={ariaLabel ?? `Progress: ${Math.round(clamped)}%`}
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 transition-all",
          progressVariants({ variant }),
        )}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }

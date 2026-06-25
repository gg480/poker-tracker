import { cn } from "@/lib/utils"

function Skeleton({
  className,
  animated = true,
  ...props
}: React.ComponentProps<"div"> & {
  /** Whether to show the pulse animation (default: true).
   *  When true, respects the user's `prefers-reduced-motion` setting. */
  animated?: boolean
}) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "bg-accent rounded-md",
        animated && "motion-safe:animate-pulse",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }

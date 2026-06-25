"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"

import { Button } from "./button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "./tooltip"
import { cn } from "@/lib/utils"

export interface CopyButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  /** The text to copy to clipboard */
  value: string
  /** Whether to show a tooltip on hover (default: true) */
  showTooltip?: boolean
  /** Tooltip text when not yet copied (default: "Copy") */
  tooltipCopy?: string
  /** Tooltip text after successful copy (default: "Copied!") */
  tooltipCopied?: string
}

function CopyButton({
  value,
  showTooltip = true,
  tooltipCopy = "Copy",
  tooltipCopied = "Copied!",
  className,
  variant = "outline",
  size = "icon",
  "aria-label": ariaLabel,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null)

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
      toast.error("Failed to copy to clipboard")
    }
  }, [value])

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const button = (
    <Button
      className={cn(className)}
      variant={variant}
      size={size}
      onClick={handleCopy}
      aria-label={
        copied ? "Copied" : ariaLabel ?? "Copy to clipboard"
      }
      {...props}
    >
      {copied ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
    </Button>
  )

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            {copied ? tooltipCopied : tooltipCopy}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}

export { CopyButton }

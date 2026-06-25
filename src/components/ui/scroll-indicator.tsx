"use client"

import { useRef, useState, useEffect, type ReactNode, type KeyboardEvent } from "react"

import { cn } from "@/lib/utils"

const SCROLL_STEP = 200

interface ScrollIndicatorProps {
  children: ReactNode
  className?: string
  /** Accessible label for the scrollable region (default: "可滚动区域"). */
  label?: string
  /** Hint text shown below when content overflows (default: "← 左右滑动查看更多 →"). */
  hintText?: string
  /** Whether to show the overflow hint indicator (default: true). */
  showHint?: boolean
}

/**
 * Horizontal scroll container that shows a fade-out gradient and an overflow hint
 * when its content overflows the viewport. The hint disappears once the user scrolls.
 *
 * Keyboard: the container is focusable and supports Left / Right arrow keys to scroll.
 */
export function ScrollIndicator({
  children,
  className = "",
  label = "可滚动区域",
  hintText = "← 左右滑动查看更多 →",
  showHint = true,
}: ScrollIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const checkOverflow = () => {
      setCanScroll(el.scrollWidth > el.clientWidth)
    }

    checkOverflow()
    const ro = new ResizeObserver(checkOverflow)
    ro.observe(el)
    return () => ro.disconnect()
  }, [children])

  const handleScroll = () => {
    if (containerRef.current && containerRef.current.scrollLeft > 0 && !hasScrolled) {
      setHasScrolled(true)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault()
        el.scrollBy({ left: SCROLL_STEP, behavior: "smooth" })
        break
      case "ArrowLeft":
        e.preventDefault()
        el.scrollBy({ left: -SCROLL_STEP, behavior: "smooth" })
        break
    }
  }

  const showIndicator = showHint && canScroll && !hasScrolled

  return (
    <div className={cn("relative", className)}>
      {/* Scrollable container with mask fade */}
      <div
        ref={containerRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className={cn(
          "overflow-x-auto overscroll-x-contain scrollbar-hide focus-visible:outline-none",
          showIndicator && "[mask-image:linear-gradient(to_right,black_85%,transparent_98%)]",
        )}
      >
        {children}
      </div>
      {/* Overflow hint */}
      {showIndicator && (
        <div
          className="flex items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground/40 animate-pulse select-none pointer-events-none"
          aria-hidden="true"
        >
          {hintText}
        </div>
      )}
    </div>
  )
}

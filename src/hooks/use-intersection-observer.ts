"use client"

import { useRef, useState, useEffect } from "react"

/**
 * Observe whether an element is visible within the viewport (or a scroll
 * container) using the IntersectionObserver API.
 *
 * @example
 *   const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 })
 *   return <div ref={ref}>{isIntersecting ? "visible" : "hidden"}</div>
 *
 * @example
 *   // Infinite scroll trigger
 *   const { ref, isIntersecting } = useIntersectionObserver()
 *   useEffect(() => { if (isIntersecting) loadMore() }, [isIntersecting])
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit,
): { ref: React.RefCallback<HTMLElement>; isIntersecting: boolean; entry: IntersectionObserverEntry | null } {
  const elementRef = useRef<HTMLElement | null>(null)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)

  const ref: React.RefCallback<HTMLElement> = (node) => {
    elementRef.current = node
  }

  useEffect(() => {
    const el = elementRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([e]) => {
        if (e) setEntry(e)
      },
      options,
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.threshold, options?.rootMargin, options?.root])

  return {
    ref,
    isIntersecting: entry?.isIntersecting ?? false,
    entry,
  }
}

"use client"

import { useEffect, useRef } from "react"

/**
 * Subscribe to a DOM event with automatic cleanup on unmount.
 *
 * The listener reference is kept stable via a ref so the effect
 * does not need to re-run when the callback identity changes.
 *
 * @example
 *   useEventListener("keydown", (e) => { if (e.key === "Escape") close() })
 *   useEventListener("storage", (e) => { if (e.key === "theme") sync() })
 */
export function useEventListener<K extends keyof WindowEventMap>(
  event: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: HTMLElement | Window | MediaQueryList | null,
): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (typeof window === 'undefined') return
    const target = element ?? window
    if (!target) return

    const listener: typeof handler = (e) => handlerRef.current(e)
    target.addEventListener(event, listener as EventListener)
    return () => target.removeEventListener(event, listener as EventListener)
  }, [event, element])
}

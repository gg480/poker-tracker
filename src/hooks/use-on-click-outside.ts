"use client"

import { useEffect, useRef } from "react"

/**
 * Call a handler when a click/touch event occurs outside of the tracked
 * element.  Useful for closing dropdowns, modals, and popovers.
 *
 * @example
 *   const ref = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false))
 *   return <div ref={ref}>...</div>
 */
export function useOnClickOutside<T extends HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null)
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (typeof document === 'undefined') return
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current
      if (!el || el.contains(event.target as Node)) return
      handlerRef.current(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)
    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [])

  return ref
}

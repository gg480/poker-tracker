"use client"

import { useRef, useEffect, useCallback } from "react"

/**
 * Returns a ref-like boolean that is `true` while the component is mounted.
 *
 * Useful for guarding `setState` calls inside async callbacks to avoid
 * the "Can't perform a React state update on an unmounted component" warning.
 *
 * @example
 *   const isMounted = useIsMounted()
 *   const load = async () => {
 *     const data = await fetch("/api/data")
 *     if (!isMounted()) return
 *     setData(data)
 *   }
 */
export function useIsMounted(): () => boolean {
  const ref = useRef(false)

  useEffect(() => {
    ref.current = true
    return () => { ref.current = false }
  }, [])

  return useCallback(() => ref.current, [])
}

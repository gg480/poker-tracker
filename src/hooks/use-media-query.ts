"use client"

import { useState, useEffect } from "react"

/**
 * Subscribe to a CSS media query and return whether it currently matches.
 *
 * @example
 *   const isWide = useMediaQuery("(min-width: 1024px)")
 *   const isDark = useMediaQuery("(prefers-color-scheme: dark)")
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return matches
}

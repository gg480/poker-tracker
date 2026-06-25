"use client"

import { useRef, useEffect } from "react"

/**
 * Track the previous value of a variable across renders.
 *
 * @example
 *   const [count, setCount] = useState(0)
 *   const prevCount = usePrevious(count)
 *   // prevCount holds the value from the prior render
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)

  useEffect(() => {
    ref.current = value
  })

  return ref.current
}

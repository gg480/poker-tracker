"use client"

import { useEffect, useRef } from "react"

/**
 * Like `useEffect` but skips the effect on the initial mount.
 * Fires only when dependencies change after the first render.
 *
 * @example
 *   const [count, setCount] = useState(0)
 *   useUpdateEffect(() => { document.title = `Count: ${count}` }, [count])
 *   // title is NOT set on mount, only when count changes
 */
export function useUpdateEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
): void {
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    return effect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

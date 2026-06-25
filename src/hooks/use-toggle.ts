"use client"

import { useState, useCallback } from "react"

/**
 * A boolean state with toggle / setTrue / setFalse helpers.
 *
 * @example
 *   const [isOpen, toggleOpen, { setTrue, setFalse }] = useToggle(false)
 *   <button onClick={toggleOpen}>{isOpen ? "Close" : "Open"}</button>
 */
export function useToggle(
  initial: boolean = false,
): [boolean, () => void, { setTrue: () => void; setFalse: () => void }] {
  const [value, setValue] = useState(initial)

  const toggle = useCallback(() => setValue((v) => !v), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])

  return [value, toggle, { setTrue, setFalse }]
}

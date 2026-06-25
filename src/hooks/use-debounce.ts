"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"

// ─── useDebounce ─────────────────────────────────────────────────
// Delays updating a value until `delay` ms have elapsed since the
// last change.  Useful for search inputs that trigger filtering or
// API calls on every keystroke.

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// ─── useDebouncedCallback ────────────────────────────────────────
// Returns a stable callback whose invocation is debounced.
// The callback always receives the latest arguments when it fires.
// Note: the returned function identity changes only when `delay` changes.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const callbackRef = useRef<T>(callback)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep the ref in sync so the debounced call always uses the latest callback.
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    // `delay` is the only external dependency — the callback ref keeps
    // `callback` fresh without causing the returned function to change.
    [delay],
  ) as (...args: Parameters<T>) => void
}

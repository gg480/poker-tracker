"use client"

import { useState, useEffect, useCallback } from "react"

// ─── useLocalStorage ─────────────────────────────────────────────
// Persists a value to localStorage and keeps it in sync across
// component re-renders.  Falls back to `initialValue` when:
//   - localStorage is unavailable (SSR / restrictive CSP)
//   - the stored value cannot be parsed
//   - the key does not exist yet

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  // Lazy initializer: read from storage once at mount.
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  // Write to localStorage whenever the value changes.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch {
      // Storage full or unavailable — silently degrade.
    }
  }, [key, storedValue])

  // Listen for storage events from other tabs so all instances stay
  // in sync when the same key is modified elsewhere.
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T)
        } catch {
          // Ignore unparseable values from other tabs.
        }
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [key])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value
        return nextValue
      })
    },
    [],
  )

  return [storedValue, setValue]
}

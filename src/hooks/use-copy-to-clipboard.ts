"use client"

import { useState, useCallback, useRef, useEffect } from "react"

/**
 * Copy text to the clipboard and track whether the copy succeeded.
 *
 * Returns a tuple of `[copied, copy]` where `copied` is `true` for
 * 2 seconds after a successful copy and `copy` is the trigger function.
 *
 * @example
 *   const [copied, copy] = useCopyToClipboard()
 *   <button onClick={() => copy("Hello!")}>
 *     {copied ? "Copied!" : "Copy"}
 *   </button>
 */
export function useCopyToClipboard(): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Clear any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available or permission denied — silently fail
    }
  }, [])

  return [copied, copy]
}

import { BREAKPOINT_MOBILE } from "@/lib/constants"
import { useMediaQuery } from "@/hooks/use-media-query"

/**
 * Reactive check for mobile viewport (< BREAKPOINT_MOBILE).
 * Implemented on top of the generic `useMediaQuery` hook.
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINT_MOBILE - 1}px)`)
}

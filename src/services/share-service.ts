import { generateShareImage } from "./image-service"

/**
 * Generates a share image from a DOM element and triggers a browser download.
 *
 * UI/download concern — delegates image capture to image-service so the
 * download logic can be tested / mocked independently of html2canvas.
 *
 * @param elementId - The id of the DOM element to capture.
 * @param filename - Optional filename for the downloaded PNG.
 * @returns true if the download was triggered, false on failure.
 */
export async function downloadShareImage(
  elementId: string,
  filename?: string
): Promise<boolean> {
  const blob = await generateShareImage(elementId)
  if (!blob) return false

  let link: HTMLAnchorElement | null = null
  try {
    const url = URL.createObjectURL(blob)
    link = document.createElement("a")
    link.href = url
    link.download = filename || `poker-session-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
  } finally {
    // Ensure cleanup even if an intermediate step throws
    if (link?.parentNode) {
      link.parentNode.removeChild(link)
    }
    URL.revokeObjectURL(link?.href ?? "")
  }

  return true
}

/**
 * Returns the player with the highest score from a list of records.
 * When multiple players share the top score the first one wins.
 */
export function getMvp(records: { player: string; score: number }[]): {
  player: string
  score: number
} | null {
  if (records.length === 0) return null
  return records.reduce(
    (best, r) => (r.score > best.score ? { player: r.player, score: r.score } : best),
    { player: records[0].player, score: records[0].score },
  )
}

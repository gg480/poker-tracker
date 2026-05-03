import html2canvas from "html2canvas"

export interface ShareCardData {
  seasonName?: string
  date: string
  records: { player: string; score: number }[]
  mvp?: string
  topScore?: number
}

export async function generateShareImage(
  elementId: string
): Promise<Blob | null> {
  const element = document.getElementById(elementId)
  if (!element) return null

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: "#0a0e1a",
      scale: 2,
      useCORS: true,
      logging: false,
    })

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1.0)
    })
  } catch (error) {
    console.error("Failed to generate share image:", error)
    return null
  }
}

export async function downloadShareImage(
  elementId: string,
  filename?: string
): Promise<boolean> {
  const blob = await generateShareImage(elementId)
  if (!blob) return false

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename || `poker-session-${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return true
}

export function getMvp(records: { player: string; score: number }[]): {
  player: string
  score: number
} | null {
  if (records.length === 0) return null
  const sorted = [...records].sort((a, b) => b.score - a.score)
  return { player: sorted[0].player, score: sorted[0].score }
}

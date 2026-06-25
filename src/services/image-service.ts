import html2canvas from "html2canvas"

/**
 * Captures a DOM element as a PNG Blob using html2canvas.
 *
 * This is the low-level image-generation primitive, separated from
 * download/share UI concerns so it can be reused independently
 * (e.g. clipboard copy, social-share APIs).
 *
 * @param elementId - The id of the DOM element to capture.
 * @returns A PNG Blob, or null if the element is not found or capture fails.
 */
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
    return null
  }
}

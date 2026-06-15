/**
 * Triggers a PNG download of the given canvas.
 * Prefers canvas.toBlob() for efficiency; falls back to toDataURL() if unavailable.
 */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  if (typeof canvas.toBlob === 'function') {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas produced a null blob.'))
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        resolve()
      }, 'image/png')
    })
  }

  // Fallback: synchronous data URL (older browsers)
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  return Promise.resolve()
}

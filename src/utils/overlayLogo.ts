import { QR_LOGO_BG_PADDING, QR_LOGO_RATIO } from '@/constants/qr.constants'

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export async function overlayLogo(canvas: HTMLCanvasElement, logoSrc: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()

    img.onload = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve()
        return
      }

      const size = canvas.width
      const logoSize = Math.round(size * QR_LOGO_RATIO)
      const padding = Math.round(size * QR_LOGO_BG_PADDING)
      const bgSize = logoSize + padding * 2
      const offset = (size - bgSize) / 2
      const radius = Math.round(bgSize * 0.22)

      ctx.save()
      ctx.fillStyle = '#ffffff'
      roundedRect(ctx, offset, offset, bgSize, bgSize, radius)
      ctx.fill()
      ctx.restore()

      const logoOffset = (size - logoSize) / 2
      ctx.drawImage(img, logoOffset, logoOffset, logoSize, logoSize)

      resolve()
    }

    img.onerror = () => resolve()
    img.src = logoSrc
  })
}

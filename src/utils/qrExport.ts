import { generateSvg } from '@/services/qrGenerator'
import type { QRContentType, QrOptions } from '@/types/qr.types'
import { QR_FILENAME_PREFIX, QR_LOGO_BG_PADDING, QR_LOGO_RATIO } from '@/constants/qr.constants'

import { downloadCanvas } from '@/utils/downloadCanvas'

export function buildExportFilename(type: QRContentType, ext: 'png' | 'svg'): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `${QR_FILENAME_PREFIX}-${type}-${date}.${ext}`
}

export async function downloadQrPng(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  await downloadCanvas(canvas, filename)
}

export async function downloadQrSvg(
  text: string,
  filename: string,
  options?: QrOptions,
  logoSrc?: string,
): Promise<void> {
  let svg = await generateSvg(text, options)

  if (logoSrc) {
    svg = await injectLogoIntoSvg(svg, logoSrc)
  }

  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function copyQrToClipboard(canvas: HTMLCanvasElement): Promise<void> {
  const blob = await canvasToBlob(canvas)
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('Canvas produced a null blob.'))
    }, 'image/png')
  })
}

async function loadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth || 256
      c.height = img.naturalHeight || 256
      const ctx = c.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable.'))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve(c.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to load logo image.'))
    img.src = src
  })
}

async function injectLogoIntoSvg(svg: string, logoSrc: string): Promise<string> {
  let logoDataUrl: string
  try {
    logoDataUrl = await loadImageAsDataUrl(logoSrc)
  } catch {
    return svg
  }

  const widthMatch = /width="(\d+)"/.exec(svg)
  const size = widthMatch ? parseInt(widthMatch[1], 10) : 256
  const logoSize = Math.round(size * QR_LOGO_RATIO)
  const padding = Math.round(size * QR_LOGO_BG_PADDING)
  const bgSize = logoSize + padding * 2
  const offset = Math.round((size - bgSize) / 2)
  const radius = Math.round(bgSize * 0.22)
  const logoOffset = Math.round((size - logoSize) / 2)

  const logoElements =
    `<rect x="${offset}" y="${offset}" width="${bgSize}" height="${bgSize}" rx="${radius}" ry="${radius}" fill="#ffffff"/>` +
    `\n<image x="${logoOffset}" y="${logoOffset}" width="${logoSize}" height="${logoSize}" href="${logoDataUrl}"/>`

  return svg.replace('</svg>', `${logoElements}\n</svg>`)
}

import { toCanvas, toDataURL, toString as qrToString } from 'qrcode'

import {
  DEFAULT_QR_BACKGROUND,
  DEFAULT_QR_ERROR_CORRECTION,
  DEFAULT_QR_FOREGROUND,
  DEFAULT_QR_MARGIN,
  DEFAULT_QR_SIZE,
  MAX_QR_LENGTH,
} from '@/constants/qr.constants'
import type { QrOptions } from '@/types/qr.types'

function assertLength(text: string): void {
  if (text.length > MAX_QR_LENGTH) {
    throw new Error(`Input exceeds maximum QR code length of ${MAX_QR_LENGTH} characters.`)
  }
}

function buildRenderOptions(options?: QrOptions): object {
  return {
    width: options?.size ?? DEFAULT_QR_SIZE,
    margin: options?.margin ?? DEFAULT_QR_MARGIN,
    errorCorrectionLevel: options?.errorCorrectionLevel ?? DEFAULT_QR_ERROR_CORRECTION,
    color: {
      dark: options?.foreground ?? DEFAULT_QR_FOREGROUND,
      light: options?.background ?? DEFAULT_QR_BACKGROUND,
    },
  }
}

export async function generateDataUrl(text: string, options?: QrOptions): Promise<string> {
  assertLength(text)
  return toDataURL(text, buildRenderOptions(options))
}

export async function generateCanvas(
  text: string,
  canvas: HTMLCanvasElement,
  options?: QrOptions
): Promise<void> {
  assertLength(text)
  await toCanvas(canvas, text, buildRenderOptions(options))
}

export async function generateSvg(text: string, options?: QrOptions): Promise<string> {
  assertLength(text)
  return qrToString(text, {
    type: 'svg',
    ...(buildRenderOptions(options) as object),
  })
}

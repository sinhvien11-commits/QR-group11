import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'

import {
  SCANNER_ERROR_MESSAGES,
  SCANNER_FPS,
  SCANNER_QR_BOX_RATIO,
} from '@/constants/scanner.constants'
import type { ScannerError, ScannerErrorType } from '@/types/scanner.types'

export interface QrScannerHandle {
  start(onSuccess: (text: string) => void): Promise<void>
  stop(): Promise<void>
  pause(): void
  resume(): void
}

export function createQrScanner(elementId: string): QrScannerHandle {
  // ✅ Khai báo nhưng CHƯA tạo — chờ đến khi start() được gọi
  let instance: Html5Qrcode | null = null

  return {
    async start(onSuccess) {
      // ✅ Tạo instance tại đây — DOM đã sẵn sàng
      instance = new Html5Qrcode(elementId, /* verbose= */ false)

      await instance.start(
        { facingMode: 'environment' },
        {
          fps: SCANNER_FPS,
          qrbox: (w: number, h: number) => {
            const edge = Math.round(Math.min(w, h) * SCANNER_QR_BOX_RATIO)
            return { width: edge, height: edge }
          },
        },
        (text) => onSuccess(text),
        () => {}
      )
    },

    async stop() {
      if (!instance) return
      const state = instance.getState()
      if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
        await instance.stop()
      }
      instance = null // ✅ cleanup
    },

    pause() {
      if (!instance) return
      if (instance.getState() === Html5QrcodeScannerState.SCANNING) {
        instance.pause()
      }
    },

    resume() {
      if (!instance) return
      if (instance.getState() === Html5QrcodeScannerState.PAUSED) {
        instance.resume()
      }
    },
  }
}

function classifyError(err: unknown): ScannerErrorType {
  if (!navigator.mediaDevices || !window.isSecureContext) return 'unsupported'
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()
  if (
    lower.includes('notallowederror') ||
    lower.includes('permission denied') ||
    lower.includes('denied')
  ) {
    return 'permission-denied'
  }
  if (
    lower.includes('notfounderror') ||
    lower.includes('device not found') ||
    lower.includes('no camera')
  ) {
    return 'no-camera'
  }
  if (
    lower.includes('notreadableerror') ||
    lower.includes('could not start') ||
    lower.includes('in use')
  ) {
    return 'camera-unavailable'
  }
  return 'unknown'
}

export function mapScannerError(err: unknown): ScannerError {
  const type = classifyError(err)
  return { type, message: SCANNER_ERROR_MESSAGES[type] }
}

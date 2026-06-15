import type { ScannerErrorType } from '@/types/scanner.types'

export const SCANNER_ELEMENT_ID = 'qr-scanner-viewport'
export const SCANNER_FPS = 10
export const SCANNER_QR_BOX_RATIO = 0.8
export const SCAN_TIMEOUT_MS = 30_000

export const SCANNER_ERROR_MESSAGES: Record<ScannerErrorType, string> = {
  'permission-denied':
    'Camera access was denied. Please allow camera access in your browser settings and try again.',
  'camera-unavailable': 'Your camera is unavailable or in use by another application.',
  'camera-disconnected': 'Camera connection was lost. Please reconnect your camera and try again.',
  'no-camera': 'No camera was found on this device.',
  timeout: 'No QR code detected within 30 seconds. Press Start Camera to try again.',
  unsupported: 'Camera access requires a modern browser served over HTTPS.',
  unknown: 'An unexpected error occurred while accessing the camera.',
}

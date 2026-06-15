import type { QRContentType } from '@/types/qr.types'

export interface ScanResult {
  raw: string
  normalized: string
  contentType: QRContentType | 'unknown'
  detectedAt: Date
  source: 'camera'
}

export function createScanResult(
  raw: string,
  normalized: string,
  contentType: QRContentType | 'unknown'
): ScanResult {
  return {
    raw,
    normalized,
    contentType,
    detectedAt: new Date(),
    source: 'camera',
  }
}

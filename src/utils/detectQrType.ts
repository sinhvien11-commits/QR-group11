import { detectContentType } from '@/services/scanner/contentDetector'
import type { QrType } from '@/types/qrHistory.types'

export function detectQrType(content: string): QrType {
  const result = detectContentType(content)
  return result === 'unknown' ? 'text' : result
}

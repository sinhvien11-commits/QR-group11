import { isValidEmail } from '@/services/formatters/emailFormatter'
import { isValidPhone } from '@/services/formatters/phoneFormatter'
import { isValidUrl } from '@/services/formatters/urlFormatter'
import { isWifiPayload } from '@/services/formatters/wifiFormatter'

import type { QRContentType } from '@/types/qr.types'

export function detectContentType(normalized: string): QRContentType | 'unknown' {
  if (isWifiPayload(normalized)) return 'wifi'
  if (isValidUrl(normalized)) return 'url'
  if (normalized.startsWith('mailto:') || isValidEmail(normalized)) return 'email'
  if (normalized.startsWith('tel:') || isValidPhone(normalized)) return 'phone'
  return 'text'
}

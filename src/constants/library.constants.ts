import type { AiRisk, QrSource, QrType } from '@/types/qrHistory.types'

export const QR_DEFAULT_TITLES: Record<QrType, string> = {
  text: 'Text',
  url: 'Website',
  email: 'Email',
  phone: 'Phone',
  wifi: 'WiFi',
}

export const QR_TYPE_LABELS: Record<QrType, string> = {
  text: 'Text',
  url: 'URL',
  email: 'Email',
  phone: 'Phone',
  wifi: 'Wi-Fi',
}

export const QR_SOURCE_LABELS: Record<QrSource, string> = {
  generator: 'Generated',
  scanner: 'Scanned',
}

export const AI_RISK_LABELS: Record<AiRisk, string> = {
  safe: 'Safe',
  suspicious: 'Suspicious',
  blocked: 'Blocked',
  unknown: 'Unknown',
}

export const LIBRARY_RENAME_MAX_LENGTH = 100

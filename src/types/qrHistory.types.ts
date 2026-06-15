export type QrType = 'text' | 'url' | 'email' | 'phone' | 'wifi'

export type QrSource = 'generator' | 'scanner'

export type AiRisk = 'safe' | 'suspicious' | 'blocked' | 'unknown'

export interface QrHistoryItem {
  id: string
  title: string
  content: string
  type: QrType
  source: QrSource
  aiRisk: AiRisk | null
  aiSummary: string | null
  createdAt: Date
  updatedAt: Date
}

export type QrHistoryInput = Omit<QrHistoryItem, 'id' | 'createdAt' | 'updatedAt'>

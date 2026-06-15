export type ModerationRisk = 'safe' | 'suspicious' | 'blocked' | 'unknown'

export interface LocalModerationResult {
  matched: boolean
  matchedPattern?: string
  reason?: string
}

export interface GeminiModerationResult {
  risk: ModerationRisk
  summary: string
  categories: string[]
  confidence: number
}

export interface ModerationResult {
  risk: ModerationRisk
  summary: string
  categories: string[]
  confidence: number
  blockedLocally: boolean
}

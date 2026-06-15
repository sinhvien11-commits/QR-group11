import type { ModerationRisk } from '@/types/moderation.types'

// Small starter set — intentionally not exhaustive.
// Patterns run against normalizeContent() output (lowercase, separators collapsed).
export const PROFANITY_PATTERNS: RegExp[] = [
  // English
  /\bfuck(ing|ed|er|s)?\b/,
  /\bshit(ty|s)?\b/,
  /\bbitch(es|y)?\b/,
  /\basshole(s)?\b/,
  /\bcunt(s)?\b/,
  // Vietnamese (diacritic forms; ASCII evasion is a known limitation)
  /địt/,
  /đụ/,
  /cặc/,
  /lồn/,
  /đéo\b/,
]

export const RISK_BADGE_LABELS: Record<ModerationRisk, string> = {
  safe: 'Safe',
  suspicious: 'Suspicious',
  blocked: 'Blocked',
  unknown: 'Unknown',
}

export const RISK_RECOMMENDATIONS: Record<ModerationRisk, string> = {
  safe: 'Content appears safe to share.',
  suspicious: 'Exercise caution before sharing this content.',
  blocked: 'This content was flagged and cannot be saved to your library.',
  unknown: 'Content could not be fully analyzed. Review before sharing.',
}

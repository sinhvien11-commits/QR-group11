import { PROFANITY_PATTERNS } from '@/constants/moderation.constants'
import type { LocalModerationResult } from '@/types/moderation.types'

export function runLocalModeration(normalizedContent: string): LocalModerationResult {
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(normalizedContent)) {
      return {
        matched: true,
        matchedPattern: pattern.source,
        reason: 'Content contains explicit or inappropriate language.',
      }
    }
  }
  return { matched: false }
}

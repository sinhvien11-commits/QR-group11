import { analyzeWithGemini } from '@/services/gemini'
import { normalizeContent } from '@/utils/normalizeContent'
import type { ModerationResult } from '@/types/moderation.types'

import { runLocalModeration } from './localModeration'

export async function moderateContent(text: string): Promise<ModerationResult> {
  const normalized = normalizeContent(text)

  // Local moderation always runs first — Gemini never receives blocked content
  const local = runLocalModeration(normalized)

  if (local.matched) {
    return {
      risk: 'blocked',
      summary: local.reason ?? 'Content matched a local moderation rule.',
      categories: ['profanity'],
      confidence: 1,
      blockedLocally: true,
    }
  }

  if (!navigator.onLine) {
    return {
      risk: 'unknown',
      summary: 'Content analysis skipped — device is offline.',
      categories: [],
      confidence: 0,
      blockedLocally: false,
    }
  }

  try {
    const gemini = await analyzeWithGemini(text)
    return { ...gemini, blockedLocally: false }
  } catch {
    return {
      risk: 'unknown',
      summary: 'Content analysis could not be completed.',
      categories: [],
      confidence: 0,
      blockedLocally: false,
    }
  }
}

import { ref } from 'vue'

import { moderateContent } from '@/services/moderation/moderation'
import type { ModerationResult } from '@/types/moderation.types'

export function useModeration() {
  const result = ref<ModerationResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function analyze(text: string): Promise<void> {
    loading.value = true
    error.value = null
    result.value = null
    try {
      result.value = await moderateContent(text)
    } catch {
      error.value = 'Moderation failed.'
    } finally {
      loading.value = false
    }
  }

  function reset(): void {
    result.value = null
    loading.value = false
    error.value = null
  }

  return { result, loading, error, analyze, reset }
}

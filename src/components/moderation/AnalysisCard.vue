<script setup lang="ts">
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

import type { ModerationResult } from '@/types/moderation.types'
import { RISK_BADGE_LABELS, RISK_RECOMMENDATIONS } from '@/constants/moderation.constants'

defineProps<{
  result: ModerationResult | null
  loading: boolean
}>()
</script>

<template>
  <div class="analysis-card" aria-label="Content analysis result">
    <div v-if="loading" class="analysis-loading" aria-live="polite">
      <LoadingSpinner size="sm" label="Analyzing content" />
      <span>Analyzing content…</span>
    </div>

    <template v-else-if="result">
      <div class="analysis-header">
        <span class="analysis-title">Content Analysis</span>
        <span :class="['risk-badge', `risk-badge--${result.risk}`]" role="status">
          {{ RISK_BADGE_LABELS[result.risk] }}
        </span>
      </div>

      <p class="analysis-summary">{{ result.summary }}</p>

      <div v-if="result.categories.length > 0" class="analysis-categories" aria-label="Detected categories">
        <span v-for="cat in result.categories" :key="cat" class="category-chip">
          {{ cat }}
        </span>
      </div>

      <p :class="['analysis-recommendation', `rec--${result.risk}`]">
        {{ RISK_RECOMMENDATIONS[result.risk] }}
      </p>
    </template>

    <EmptyState
      v-else
      title="No analysis yet"
      description="Generate or scan a QR code to see content analysis."
    />
  </div>
</template>

<style scoped>
.analysis-card {
  padding: 16px 20px;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-size: 14px;
}

.analysis-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.analysis-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text);
}

.risk-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

.risk-badge--safe {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.risk-badge--suspicious {
  background: rgba(249, 115, 22, 0.15);
  color: #f97316;
}

.risk-badge--blocked {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.risk-badge--unknown {
  background: rgba(107, 99, 117, 0.12);
  color: var(--text);
}

.analysis-summary {
  font-size: 14px;
  color: var(--text-h);
  line-height: 1.55;
  margin: 0;
}

.analysis-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.category-chip {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(170, 59, 255, 0.1);
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

.analysis-recommendation {
  font-size: 13px;
  margin: 0;
  padding: 8px 12px;
  border-radius: 6px;
  line-height: 1.4;
}

.rec--safe {
  background: rgba(34, 197, 94, 0.08);
  color: #22c55e;
}

.rec--suspicious {
  background: rgba(249, 115, 22, 0.08);
  color: #f97316;
}

.rec--blocked {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
}

.rec--unknown {
  background: rgba(107, 99, 117, 0.08);
  color: var(--text);
}
</style>

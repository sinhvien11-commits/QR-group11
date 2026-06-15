<script setup lang="ts">
import { computed } from 'vue'

import type { TourStep } from '@/types/tour.types'

const props = defineProps<{
  active: boolean
  index: number
  total: number
  currentStep: TourStep | undefined
  isFirst: boolean
  isLast: boolean
  targetRect: DOMRect | null
}>()

const emit = defineEmits<{
  next: []
  prev: []
  finish: []
}>()

const PAD = 8

const highlightStyle = computed((): Record<string, string> => {
  const r = props.targetRect
  if (!r) return {}
  return {
    top: `${r.top - PAD}px`,
    left: `${r.left - PAD}px`,
    width: `${r.width + PAD * 2}px`,
    height: `${r.height + PAD * 2}px`,
  }
})

const tooltipStyle = computed((): Record<string, string> => {
  const r = props.targetRect
  if (!r) return {}
  const leftPos = Math.max(16, Math.min(r.left, window.innerWidth - 316))
  const spaceBelow = window.innerHeight - r.bottom - PAD * 2
  if (spaceBelow >= 160) {
    return { top: `${r.bottom + PAD * 2}px`, left: `${leftPos}px` }
  }
  return { bottom: `${window.innerHeight - r.top + PAD * 2}px`, left: `${leftPos}px` }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="active && targetRect"
      class="tour-root"
      role="dialog"
      aria-modal="true"
      aria-label="Product tour"
    >
      <div class="tour-highlight" :style="highlightStyle" aria-hidden="true" />

      <div v-if="currentStep" class="tour-tooltip" :style="tooltipStyle">
        <p class="tour-counter">{{ index + 1 }} / {{ total }}</p>
        <h3 class="tour-title">{{ currentStep.title }}</h3>
        <p class="tour-body">{{ currentStep.body }}</p>
        <div class="tour-footer">
          <button class="tour-btn tour-btn--ghost" @click="emit('finish')">Skip tour</button>
          <div class="tour-nav">
            <button v-if="!isFirst" class="tour-btn tour-btn--ghost" @click="emit('prev')">
              Back
            </button>
            <button class="tour-btn tour-btn--primary" @click="emit('next')">
              {{ isLast ? 'Done' : 'Next' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tour-root {
  position: fixed;
  inset: 0;
  z-index: 9000;
  pointer-events: none;
}

.tour-highlight {
  position: fixed;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  transition:
    top 0.25s ease,
    left 0.25s ease,
    width 0.25s ease,
    height 0.25s ease;
}

.tour-tooltip {
  position: fixed;
  width: 300px;
  padding: 20px;
  background: var(--bg);
  border: 1px solid var(--accent-border);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  pointer-events: all;
  z-index: 9001;
}

.tour-counter {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  margin: 0 0 8px;
}

.tour-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-h);
  margin: 0 0 8px;
  letter-spacing: -0.3px;
}

.tour-body {
  font-size: 14px;
  color: var(--text);
  line-height: 1.55;
  margin: 0 0 16px;
}

.tour-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tour-nav {
  display: flex;
  gap: 8px;
}

.tour-btn {
  padding: 7px 14px;
  border-radius: 6px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.tour-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.tour-btn--primary {
  background: var(--accent);
  color: #fff;
}

.tour-btn--primary:hover {
  opacity: 0.88;
}

.tour-btn--ghost {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}

.tour-btn--ghost:hover {
  background: var(--accent-bg);
  color: var(--text-h);
}
</style>

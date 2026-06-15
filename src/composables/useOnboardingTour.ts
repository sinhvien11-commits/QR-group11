import { computed, nextTick, ref } from 'vue'

import type { TourStep } from '@/types/tour.types'
import { TOUR_STORAGE_KEY } from '@/constants/tour.constants'

export function useOnboardingTour(steps: TourStep[]) {
  const active = ref(false)
  const index = ref(0)
  const targetRect = ref<DOMRect | null>(null)

  const currentStep = computed((): TourStep | undefined => steps[index.value])
  const isFirst = computed((): boolean => index.value === 0)
  const isLast = computed((): boolean => index.value === steps.length - 1)

  function hasCompleted(): boolean {
    return localStorage.getItem(TOUR_STORAGE_KEY) === '1'
  }

  async function resolveRect(stepIndex: number): Promise<DOMRect | null> {
    await nextTick()
    const step = steps[stepIndex]
    if (!step) return null
    const el = document.querySelector(step.target)
    return el ? el.getBoundingClientRect() : null
  }

  async function goTo(stepIndex: number): Promise<void> {
    if (stepIndex >= steps.length) {
      finish()
      return
    }
    const rect = await resolveRect(stepIndex)
    if (!rect) {
      await goTo(stepIndex + 1)
      return
    }
    index.value = stepIndex
    targetRect.value = rect
  }

  async function start(): Promise<void> {
    if (hasCompleted()) return
    active.value = true
    await goTo(0)
  }

  async function next(): Promise<void> {
    await goTo(index.value + 1)
  }

  async function prev(): Promise<void> {
    if (index.value > 0) await goTo(index.value - 1)
  }

  function finish(): void {
    localStorage.setItem(TOUR_STORAGE_KEY, '1')
    active.value = false
    targetRect.value = null
  }

  return {
    active,
    index,
    currentStep,
    isFirst,
    isLast,
    targetRect,
    total: steps.length,
    start,
    next,
    prev,
    finish,
  }
}

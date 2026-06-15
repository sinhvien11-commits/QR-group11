<script setup lang="ts">
import type { ToastItem } from '@/composables/useToast'

defineProps<{
  toasts: ToastItem[]
}>()

const emit = defineEmits<{ dismiss: [id: string] }>()
</script>

<template>
  <div class="toast-container" aria-live="assertive" aria-atomic="false">
    <TransitionGroup name="toast" tag="div" class="toast-list">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['app-toast', `app-toast--${toast.type}`]"
        role="alert"
      >
        <span class="toast-message">{{ toast.message }}</span>
        <button
          class="toast-dismiss"
          aria-label="Dismiss notification"
          @click="emit('dismiss', toast.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
  width: max-content;
  max-width: 90vw;
}

.toast-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.app-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  min-width: 220px;
  max-width: 90vw;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  pointer-events: all;
}

.app-toast--success {
  background: #22c55e;
  color: #fff;
}

.app-toast--error {
  background: #ef4444;
  color: #fff;
}

.app-toast--warning {
  background: #f97316;
  color: #fff;
}

.app-toast--info {
  background: var(--accent);
  color: #fff;
}

.toast-message {
  flex: 1;
}

.toast-dismiss {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  opacity: 0.75;
  line-height: 1;
  flex-shrink: 0;
}

.toast-dismiss:hover {
  opacity: 1;
}

.toast-dismiss:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.6);
  outline-offset: 2px;
  border-radius: 2px;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>

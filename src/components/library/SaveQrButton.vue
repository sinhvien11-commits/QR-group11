<script setup lang="ts">
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

defineProps<{
  loading: boolean
  disabled: boolean
}>()

defineEmits<{ save: [] }>()
</script>

<template>
  <button class="save-qr-btn" :disabled="disabled || loading" @click="$emit('save')">
    <LoadingSpinner v-if="loading" size="sm" />
    {{ loading ? 'Saving…' : 'Save to Library' }}
  </button>
</template>

<style scoped>
.save-qr-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 8px;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition:
    opacity 0.2s,
    background 0.2s;
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

.save-qr-btn:hover:not(:disabled) {
  background: var(--accent-bg);
}

.save-qr-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.save-qr-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

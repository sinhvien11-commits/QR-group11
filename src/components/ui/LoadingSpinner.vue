<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
  label?: string
}>()
</script>

<template>
  <span
    class="loading-spinner"
    :class="`loading-spinner--${size ?? 'md'}`"
    role="status"
    :aria-label="label ?? undefined"
    :aria-hidden="!label ? true : undefined"
  >
    <span class="spinner-ring" aria-hidden="true" />
    <span v-if="label" class="sr-only">{{ label }}</span>
  </span>
</template>

<style scoped>
.loading-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.spinner-ring {
  display: block;
  border-style: solid;
  border-color: var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spinner-rotate 0.7s linear infinite;
}

.loading-spinner--sm .spinner-ring {
  width: 14px;
  height: 14px;
  border-width: 2px;
}

.loading-spinner--md .spinner-ring {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.loading-spinner--lg .spinner-ring {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="empty-state" role="status" aria-live="polite">
    <div v-if="$slots.icon" class="empty-icon">
      <slot name="icon" />
    </div>
    <p class="empty-title">{{ title }}</p>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <div v-if="$slots.default" class="empty-action">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 60px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 40px;
  line-height: 1;
  margin-bottom: 4px;
  opacity: 0.45;
}

.empty-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-h);
  margin: 0;
}

.empty-description {
  font-size: 14px;
  color: var(--text);
  margin: 0;
  max-width: 320px;
}

.empty-action {
  margin-top: 8px;
}
</style>

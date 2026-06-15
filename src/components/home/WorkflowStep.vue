<script setup lang="ts">
defineProps<{
  step: number
  title: string
  description: string
}>()
</script>

<template>
  <div class="step-card">
    <span class="step-badge" :aria-label="`Step ${step} of 3`">{{ step }}</span>
    <h3 class="step-title">{{ title }}</h3>
    <p class="step-desc">{{ description }}</p>
  </div>
</template>

<style scoped>
.step-card {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  transition:
    border-color 0.25s,
    box-shadow 0.25s;
}

.step-card:hover {
  border-color: var(--accent-border);
  box-shadow: var(--shadow);
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--accent-bg);
  border: 1.5px solid var(--accent-border);
  color: var(--accent);
  font-weight: 700;
  font-size: 14px;
  font-family: var(--mono);
  margin-bottom: 4px;
  flex-shrink: 0;
}

.step-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-h);
  margin: 0;
  letter-spacing: -0.15px;
}

.step-desc {
  font-size: 14px;
  line-height: 155%;
  color: var(--text);
  margin: 0;
}
</style>

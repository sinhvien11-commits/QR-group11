<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  icon: 'generate' | 'scan' | 'library' | 'ai'
  title: string
  description: string
  to?: string
}>()
</script>

<template>
  <component :is="to ? RouterLink : 'article'" :to="to" class="feature-card">
    <div class="icon-wrap" aria-hidden="true">
      <svg
        v-if="icon === 'generate'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>

      <svg
        v-else-if="icon === 'scan'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>

      <svg
        v-else-if="icon === 'library'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>

      <svg
        v-else
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        <path d="M20 3v4M22 5h-4M4 17v4M6 19H2" />
      </svg>
    </div>

    <h3 class="feature-title">{{ title }}</h3>
    <p class="feature-desc">{{ description }}</p>
  </component>
</template>

<style scoped>
.feature-card {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  transition:
    border-color 0.25s,
    box-shadow 0.25s,
    transform 0.25s;
  cursor: default;
  text-decoration: none;
  color: inherit;
}

a.feature-card {
  cursor: pointer;
}

.feature-card:hover {
  border-color: var(--accent-border);
  box-shadow:
    0 0 0 1px var(--accent-border),
    var(--shadow);
  transform: translateY(-2px);
}

.icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--accent-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  margin-bottom: 4px;
  flex-shrink: 0;
}

.icon-wrap svg {
  width: 22px;
  height: 22px;
}

.feature-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-h);
  margin: 0;
  letter-spacing: -0.15px;
}

.feature-desc {
  font-size: 14px;
  line-height: 155%;
  color: var(--text);
  margin: 0;
}
</style>

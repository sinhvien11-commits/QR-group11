<script setup lang="ts">
import { ref } from 'vue'

import type { QrHistoryItem } from '@/types/qrHistory.types'
import {
  AI_RISK_LABELS,
  LIBRARY_RENAME_MAX_LENGTH,
  QR_SOURCE_LABELS,
  QR_TYPE_LABELS,
} from '@/constants/library.constants'
import { formatDate } from '@/utils/formatDate'

import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

const props = defineProps<{ item: QrHistoryItem }>()
const emit = defineEmits<{
  rename: [id: string, title: string]
  delete: [id: string]
}>()

const isRenaming = ref(false)
const draftTitle = ref('')
const confirmingDelete = ref(false)

function startRename(): void {
  draftTitle.value = props.item.title
  isRenaming.value = true
}

function confirmRename(): void {
  const title = draftTitle.value.trim()
  if (!title) return
  emit('rename', props.item.id, title)
  isRenaming.value = false
}

function cancelRename(): void {
  isRenaming.value = false
}

function requestDelete(): void {
  confirmingDelete.value = true
}

function confirmDelete(): void {
  emit('delete', props.item.id)
  confirmingDelete.value = false
}

function cancelDelete(): void {
  confirmingDelete.value = false
}
</script>

<template>
  <article class="history-card">
    <div class="card-header">
      <p v-if="!isRenaming" class="card-title">{{ item.title }}</p>
      <div v-else class="rename-wrap">
        <input
          v-model="draftTitle"
          class="rename-input"
          :maxlength="LIBRARY_RENAME_MAX_LENGTH"
          aria-label="New title for QR code"
          @keyup.enter="confirmRename"
          @keyup.escape="cancelRename"
        />
        <div class="inline-actions">
          <button class="card-btn card-btn--primary" @click="confirmRename">Save</button>
          <button class="card-btn card-btn--ghost" @click="cancelRename">Cancel</button>
        </div>
      </div>
    </div>

    <dl class="card-meta">
      <div class="meta-item">
        <dt class="meta-label">Type</dt>
        <dd class="meta-value">{{ QR_TYPE_LABELS[item.type] }}</dd>
      </div>
      <div class="meta-item">
        <dt class="meta-label">Source</dt>
        <dd class="meta-value">{{ QR_SOURCE_LABELS[item.source] }}</dd>
      </div>
      <div v-if="item.aiRisk !== null" class="meta-item">
        <dt class="meta-label">AI Risk</dt>
        <dd class="meta-value" :class="`risk-${item.aiRisk}`">{{ AI_RISK_LABELS[item.aiRisk] }}</dd>
      </div>
      <div class="meta-item">
        <dt class="meta-label">Saved</dt>
        <dd class="meta-value">{{ formatDate(item.createdAt) }}</dd>
      </div>
    </dl>

    <div class="card-actions">
      <button class="card-btn card-btn--ghost" :disabled="isRenaming" @click="startRename">
        Rename
      </button>
      <button
        class="card-btn card-btn--danger"
        :aria-label="`Delete QR code: ${item.title}`"
        @click="requestDelete"
      >
        Delete
      </button>
    </div>

    <ConfirmDialog
      :open="confirmingDelete"
      title="Delete QR Code"
      :message="`Delete &quot;${item.title}&quot;? This action cannot be undone.`"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </article>
</template>

<style scoped>
.history-card {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-h);
  word-break: break-word;
  margin: 0;
}

.rename-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rename-input {
  width: 100%;
  padding: 8px 10px;
  font: inherit;
  font-size: 14px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-h);
  box-sizing: border-box;
}

.rename-input:focus {
  outline: 2px solid var(--accent);
  outline-offset: -1px;
  border-color: transparent;
}

.card-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 0;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.meta-value {
  font-size: 13px;
  color: var(--text-h);
  margin: 0;
}

.risk-safe {
  color: #22c55e;
}

.risk-suspicious {
  color: #f97316;
}

.risk-blocked {
  color: #ef4444;
}

.card-actions,
.inline-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-btn {
  padding: 7px 14px;
  border-radius: 6px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}

.card-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.card-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.card-btn--primary {
  background: var(--accent);
  color: #fff;
  border: none;
}

.card-btn--primary:hover:not(:disabled) {
  opacity: 0.88;
}

.card-btn--ghost {
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

.card-btn--ghost:hover:not(:disabled) {
  background: var(--accent-bg);
}

.card-btn--danger {
  background: transparent;
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.card-btn--danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.08);
}
</style>

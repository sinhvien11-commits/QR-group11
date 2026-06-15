<script setup lang="ts">
import { onMounted } from 'vue'

import { useQrStore } from '@/stores/useQrStore'
import { useToast } from '@/composables/useToast'
import { getFirestoreErrorMessage } from '@/utils/firestoreError'

import QrHistoryCard from '@/components/qr/QrHistoryCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AppToast from '@/components/ui/AppToast.vue'

const qrStore = useQrStore()
const { toasts, show: showToast, dismiss: dismissToast } = useToast()

onMounted(() => {
  void qrStore.loadLibrary()
})

async function handleRename(id: string, title: string): Promise<void> {
  try {
    await qrStore.rename(id, title)
  } catch (err) {
    showToast(getFirestoreErrorMessage(err), 'error')
  }
}

async function handleDelete(id: string): Promise<void> {
  try {
    await qrStore.remove(id)
  } catch (err) {
    showToast(getFirestoreErrorMessage(err), 'error')
  }
}
</script>

<template>
  <main class="library-page">
    <div class="library-header">
      <h1 class="library-title">My QR Library</h1>
    </div>

    <div v-if="qrStore.loading" class="library-loading" aria-live="polite" aria-label="Loading your library">
      <div class="library-spinner">
        <LoadingSpinner size="md" label="Loading your library" />
        <span class="loading-label" aria-hidden="true">Loading your library…</span>
      </div>
      <div class="library-grid library-grid--skeleton">
        <SkeletonCard v-for="n in 3" :key="n" />
      </div>
    </div>

    <div
      v-else-if="qrStore.error"
      class="library-error"
      role="alert"
    >
      <EmptyState title="Could not load library" :description="qrStore.error">
        <button class="retry-btn" @click="qrStore.loadLibrary()">Try again</button>
      </EmptyState>
    </div>

    <EmptyState
      v-else-if="qrStore.items.length === 0"
      title="No QR codes saved yet"
      description="Generate or scan a QR code, then press Save to Library."
    >
      <template #icon>📂</template>
    </EmptyState>

    <div v-else class="library-grid">
      <QrHistoryCard
        v-for="item in qrStore.items"
        :key="item.id"
        :item="item"
        @rename="handleRename"
        @delete="handleDelete"
      />
    </div>

    <AppToast :toasts="toasts" @dismiss="dismissToast" />
  </main>
</template>

<style scoped>
.library-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 40px 24px;
  box-sizing: border-box;
  gap: 24px;
  text-align: left;
}

.library-title {
  font-size: 28px;
  margin: 0;
  letter-spacing: -0.5px;
  color: var(--text-h);
}

.library-loading {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.library-spinner {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-label {
  font-size: 14px;
  color: var(--text);
}

.library-error {
  display: flex;
  justify-content: center;
}

.retry-btn {
  padding: 9px 20px;
  border-radius: 8px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: var(--accent);
  color: #fff;
  border: none;
}

.retry-btn:hover {
  opacity: 0.88;
}

.retry-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.library-grid--skeleton {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

@media (max-width: 480px) {
  .library-page {
    padding: 24px 16px;
  }

  .library-grid,
  .library-grid--skeleton {
    grid-template-columns: 1fr;
  }
}
</style>

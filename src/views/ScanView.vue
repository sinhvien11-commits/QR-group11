<script setup lang="ts">
import { ref, watch } from 'vue'

import type { ScanResult } from '@/services/scanner/scanResult'

import QrScanner from '@/components/qr/QrScanner.vue'
import SaveQrButton from '@/components/library/SaveQrButton.vue'
import AppToast from '@/components/ui/AppToast.vue'
import AnalysisCard from '@/components/moderation/AnalysisCard.vue'

import { QR_DEFAULT_TITLES } from '@/constants/library.constants'
import { useModeration } from '@/composables/useModeration'
import { useToast } from '@/composables/useToast'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { detectQrType } from '@/utils/detectQrType'
import { getFirestoreErrorMessage } from '@/utils/firestoreError'
import { useQrStore } from '@/stores/useQrStore'

const qrStore = useQrStore()
const moderation = useModeration()
const { toasts, show: showToast, dismiss: dismissToast } = useToast()
const { isOnline } = useNetworkStatus()

const detectedText = ref<ScanResult | null>(null)
const saving = ref(false)

watch(isOnline, (online) => {
  if (!online) {
    showToast('You are offline. Save and analysis features are disabled.', 'warning')
  }
})

function handleDetected(result: ScanResult): void {
  detectedText.value = result
  moderation.analyze(result.normalized)
}

function handleCleared(): void {
  detectedText.value = null
  moderation.reset()
}

async function saveToLibrary(): Promise<void> {
  if (!detectedText.value) return
  if (!isOnline.value) {
    showToast('Cannot save while offline.', 'warning')
    return
  }
  saving.value = true
  try {
    const type = detectQrType(detectedText.value.normalized)
    await qrStore.save({
      title: QR_DEFAULT_TITLES[type],
      content: detectedText.value.normalized,
      type,
      source: 'scanner',
      aiRisk: moderation.result.value?.risk ?? null,
      aiSummary: moderation.result.value?.summary ?? null,
    })
    showToast('QR saved successfully.')
  } catch (err) {
    showToast(getFirestoreErrorMessage(err), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="scan-page">
    <div class="scan-card">
      <h1 class="scan-title">Scan QR Code</h1>
      <QrScanner @detected="handleDetected" @cleared="handleCleared" />

      <template v-if="detectedText">
        <AnalysisCard :result="moderation.result.value" :loading="moderation.loading.value" />

        <div class="scan-save-section">
          <SaveQrButton
            :loading="saving"
            :disabled="
              moderation.loading.value || moderation.result.value?.risk === 'blocked' || !isOnline
            "
            @save="saveToLibrary"
          />
        </div>
      </template>
    </div>

    <AppToast :toasts="toasts" @dismiss="dismissToast" />
  </main>
</template>

<style scoped>
.scan-page {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 40px 16px;
  box-sizing: border-box;
}

.scan-card {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.scan-title {
  font-size: 28px;
  margin: 0;
  letter-spacing: -0.5px;
  color: var(--text-h);
}

.scan-save-section {
  display: flex;
  justify-content: flex-start;
}
</style>

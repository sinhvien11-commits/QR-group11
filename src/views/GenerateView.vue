<script setup lang="ts">
import { ref, watch } from 'vue'

import QRPreview from '@/components/qr/QRPreview.vue'
import SaveQrButton from '@/components/library/SaveQrButton.vue'
import AppToast from '@/components/ui/AppToast.vue'
import AnalysisCard from '@/components/moderation/AnalysisCard.vue'

import {
  MAX_INPUT_EMAIL,
  MAX_INPUT_PHONE,
  MAX_INPUT_SSID,
  MAX_INPUT_URL,
  MAX_INPUT_WIFI_PASSWORD,
  MAX_QR_LENGTH,
} from '@/constants/qr.constants'
import { QR_DEFAULT_TITLES } from '@/constants/library.constants'
import { useQrGenerator } from '@/composables/useQrGenerator'
import { useModeration } from '@/composables/useModeration'
import { useToast } from '@/composables/useToast'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { buildExportFilename, copyQrToClipboard, downloadQrPng, downloadQrSvg } from '@/utils/qrExport'
import { getFirestoreErrorMessage } from '@/utils/firestoreError'
import { useQrStore } from '@/stores/useQrStore'

import logoUrl from '@/assets/logo/group11.png'

const { contentType, qrText, formError, canGenerate, textInput, urlInput, emailInput, phoneInput, wifiInput, generate } =
  useQrGenerator()

const qrStore = useQrStore()
const moderation = useModeration()
const { toasts, show: showToast, dismiss: dismissToast } = useToast()
const { isOnline } = useNetworkStatus()

const canvasForDownload = ref<HTMLCanvasElement | null>(null)
const saving = ref(false)

watch(qrText, (text) => {
  if (text) {
    moderation.analyze(text)
  } else {
    moderation.reset()
    canvasForDownload.value = null
  }
})

watch(isOnline, (online) => {
  if (!online) {
    showToast('You are offline. Save and analysis features are disabled.', 'warning')
  }
})

function handleGenerated(canvas: HTMLCanvasElement): void {
  canvasForDownload.value = canvas
}

async function downloadPng(): Promise<void> {
  if (!canvasForDownload.value) return
  try {
    await downloadQrPng(canvasForDownload.value, buildExportFilename(contentType.value, 'png'))
  } catch {
    showToast('Failed to download PNG.', 'error')
  }
}

async function downloadSvg(): Promise<void> {
  if (!qrText.value) return
  try {
    await downloadQrSvg(qrText.value, buildExportFilename(contentType.value, 'svg'), undefined, logoUrl)
  } catch {
    showToast('Failed to download SVG.', 'error')
  }
}

async function copyToClipboard(): Promise<void> {
  if (!canvasForDownload.value) return
  try {
    await copyQrToClipboard(canvasForDownload.value)
    showToast('Image copied to clipboard.')
  } catch {
    showToast('Failed to copy image. Use a modern browser with HTTPS.', 'error')
  }
}

async function saveToLibrary(): Promise<void> {
  if (!qrText.value) return
  if (!isOnline.value) {
    showToast('Cannot save while offline.', 'warning')
    return
  }
  saving.value = true
  try {
    await qrStore.save({
      title: QR_DEFAULT_TITLES[contentType.value],
      content: qrText.value,
      type: contentType.value,
      source: 'generator',
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
  <main class="generate-page">
    <div class="generate-card">
      <h1 class="generate-title">Generate QR Code</h1>

      <div class="gen-field">
        <label for="content-type">Type</label>
        <select id="content-type" v-model="contentType" class="gen-select">
          <option value="text">Plain text</option>
          <option value="url">URL</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="wifi">Wi-Fi</option>
        </select>
      </div>

      <template v-if="contentType === 'text'">
        <div class="gen-field">
          <label for="input-text">Text</label>
          <textarea
            id="input-text"
            v-model="textInput.text"
            class="gen-textarea"
            rows="3"
            :maxlength="MAX_QR_LENGTH"
            placeholder="Enter text to encode…"
          />
          <span class="char-hint" aria-live="polite">{{ textInput.text.length }} / {{ MAX_QR_LENGTH }}</span>
        </div>
      </template>

      <template v-else-if="contentType === 'url'">
        <div class="gen-field">
          <label for="input-url">URL</label>
          <input
            id="input-url"
            v-model="urlInput.url"
            type="url"
            class="gen-input"
            :maxlength="MAX_INPUT_URL"
            autocomplete="url"
            placeholder="https://example.com"
          />
        </div>
      </template>

      <template v-else-if="contentType === 'email'">
        <div class="gen-field">
          <label for="input-email">Email address</label>
          <input
            id="input-email"
            v-model="emailInput.email"
            type="email"
            class="gen-input"
            :maxlength="MAX_INPUT_EMAIL"
            autocomplete="email"
            placeholder="user@example.com"
          />
        </div>
      </template>

      <template v-else-if="contentType === 'phone'">
        <div class="gen-field">
          <label for="input-phone">Phone number</label>
          <input
            id="input-phone"
            v-model="phoneInput.phone"
            type="tel"
            class="gen-input"
            :maxlength="MAX_INPUT_PHONE"
            autocomplete="tel"
            placeholder="+84123456789"
          />
        </div>
      </template>

      <template v-else-if="contentType === 'wifi'">
        <div class="gen-field">
          <label for="input-ssid">Network name (SSID)</label>
          <input
            id="input-ssid"
            v-model="wifiInput.ssid"
            type="text"
            class="gen-input"
            :maxlength="MAX_INPUT_SSID"
            autocomplete="off"
            placeholder="My Network"
          />
        </div>
        <div class="gen-field">
          <label for="input-security">Security</label>
          <select id="input-security" v-model="wifiInput.security" class="gen-select">
            <option value="WPA">WPA / WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">None (open network)</option>
          </select>
        </div>
        <div v-if="wifiInput.security !== 'nopass'" class="gen-field">
          <label for="input-wifi-pass">Password</label>
          <input
            id="input-wifi-pass"
            v-model="wifiInput.password"
            type="password"
            class="gen-input"
            :maxlength="MAX_INPUT_WIFI_PASSWORD"
            autocomplete="off"
            placeholder="Wi-Fi password"
          />
        </div>
        <div class="gen-field gen-field--check">
          <input
            id="input-hidden"
            v-model="wifiInput.hidden"
            type="checkbox"
            class="gen-checkbox"
          />
          <label for="input-hidden">Hidden network</label>
        </div>
      </template>

      <p v-if="formError" class="gen-error" role="alert">{{ formError }}</p>

      <button class="generate-btn" :disabled="!canGenerate" @click="generate">Generate</button>

      <template v-if="qrText">
        <QRPreview :text="qrText" @generated="handleGenerated" />

        <AnalysisCard :result="moderation.result.value" :loading="moderation.loading.value" />

        <div v-if="canvasForDownload" class="gen-actions">
          <button
            class="export-btn"
            aria-label="Download QR code as PNG"
            @click="downloadPng"
          >
            Download PNG
          </button>
          <button
            class="export-btn"
            aria-label="Download QR code as SVG"
            @click="downloadSvg"
          >
            Download SVG
          </button>
          <button
            class="export-btn"
            aria-label="Copy QR code image to clipboard"
            @click="copyToClipboard"
          >
            Copy Image
          </button>
          <SaveQrButton
            :loading="saving"
            :disabled="moderation.loading.value || moderation.result.value?.risk === 'blocked' || !isOnline"
            @save="saveToLibrary"
          />
        </div>
      </template>
    </div>

    <AppToast :toasts="toasts" @dismiss="dismissToast" />
  </main>
</template>

<style scoped>
.generate-page {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 40px 16px;
  box-sizing: border-box;
}

.generate-card {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.generate-title {
  font-size: 28px;
  margin: 0;
  letter-spacing: -0.5px;
  color: var(--text-h);
}

.gen-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gen-field label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-h);
}

.gen-field--check {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.gen-input,
.gen-select,
.gen-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-h);
  font: inherit;
  font-size: 15px;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.gen-input:focus,
.gen-select:focus,
.gen-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
}

.gen-textarea {
  resize: vertical;
}

.gen-select {
  cursor: pointer;
}

.char-hint {
  font-size: 12px;
  color: var(--text);
  text-align: right;
}

.gen-error {
  margin: 0;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  font-size: 14px;
  color: #ef4444;
}

.generate-btn {
  align-self: flex-start;
  padding: 10px 24px;
  border-radius: 8px;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
  background: var(--accent);
  color: #fff;
  border: none;
}

.generate-btn:hover:not(:disabled) {
  opacity: 0.88;
}

.generate-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gen-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.export-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent-border);
  white-space: nowrap;
}

.export-btn:hover {
  background: var(--accent-bg);
}

.export-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
</style>

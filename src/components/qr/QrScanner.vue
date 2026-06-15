<script setup lang="ts">
import { watch } from 'vue'

import { useQrScanner } from '@/composables/useQrScanner'
import type { ScanResult } from '@/services/scanner/scanResult'

import { SCANNER_ELEMENT_ID } from '@/constants/scanner.constants'

const emit = defineEmits<{
  detected: [result: ScanResult]
  cleared: []
}>()

const { status, scanError, lastResult, start, stop, resume } = useQrScanner()

watch(lastResult, (result, prev) => {
  if (result !== null) emit('detected', result)
  if (result === null && prev !== null) emit('cleared')
})
</script>

<template>
  <div class="scanner-card">
    <div class="scanner-wrap" role="region" aria-label="Camera viewfinder">
      <div :id="SCANNER_ELEMENT_ID" class="scanner-viewport" />

      <div v-if="status === 'idle'" class="scanner-overlay">
        <p class="overlay-text">Press Start Camera to begin scanning</p>
      </div>

      <div v-else-if="status === 'loading'" class="scanner-overlay" aria-live="polite">
        <p class="overlay-text">Requesting camera access…</p>
      </div>

      <div
        v-else-if="status === 'paused' && lastResult"
        class="scanner-overlay scanner-overlay--success"
        aria-live="polite"
      >
        <p class="overlay-text">QR code detected!</p>
      </div>

      <div v-else-if="status === 'error'" class="scanner-overlay scanner-overlay--error">
        <p class="overlay-text" role="alert">{{ scanError?.message }}</p>
      </div>
    </div>

    <div class="scanner-controls" role="group" aria-label="Scanner controls">
      <button
        v-if="status === 'idle' || status === 'error'"
        class="scan-btn scan-btn--primary"
        @click="start"
      >
        Start Camera
      </button>

      <template v-else>
        <button class="scan-btn scan-btn--secondary" @click="stop">Stop Camera</button>
        <button v-if="status === 'paused'" class="scan-btn scan-btn--primary" @click="resume">
          Scan Again
        </button>
      </template>
    </div>

    <div
      v-if="lastResult"
      class="scanner-result"
      role="region"
      aria-label="Decoded QR content"
      aria-live="polite"
    >
      <p class="result-label">Decoded content</p>
      <p class="result-text">{{ lastResult?.normalized }}</p>
    </div>
  </div>
</template>

<style scoped>
.scanner-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scanner-wrap {
  position: relative;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  aspect-ratio: 1;
  background: #0a0a0a;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.scanner-viewport {
  width: 100%;
  height: 100%;
}

.scanner-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(10, 10, 10, 0.75);
}

.scanner-overlay--success {
  background: rgba(34, 197, 94, 0.25);
}

.scanner-overlay--error {
  background: rgba(10, 10, 10, 0.9);
}

.overlay-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  margin: 0;
  line-height: 1.5;
}

.scanner-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.scan-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.scan-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.scan-btn--primary {
  background: var(--accent);
  color: #fff;
  border: none;
}

.scan-btn--primary:hover {
  opacity: 0.88;
}

.scan-btn--secondary {
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

.scan-btn--secondary:hover {
  background: var(--accent-bg);
}

.scanner-result {
  padding: 16px;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  text-align: left;
}

.result-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 8px;
}

.result-text {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--text-h);
  word-break: break-all;
  white-space: pre-wrap;
  margin: 0;
}
</style>

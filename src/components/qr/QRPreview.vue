<script setup lang="ts">
import { ref, watch } from 'vue'

import { generateCanvas } from '@/services/qrGenerator'
import { overlayLogo } from '@/utils/overlayLogo'

import logoUrl from '@/assets/logo/group11.png'

const props = defineProps<{
  text: string
  size?: number
}>()

const emit = defineEmits<{
  generated: [canvas: HTMLCanvasElement]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const hasGenerated = ref(false)

let renderSeq = 0

function clearCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx?.clearRect(0, 0, canvas.width, canvas.height)
}

async function renderQr(): Promise<void> {
  const seq = ++renderSeq
  if (!props.text.trim()) {
    isLoading.value = false
    clearCanvas()
    hasGenerated.value = false
    errorMessage.value = null
    return
  }
  if (!canvasRef.value) return
  isLoading.value = true
  errorMessage.value = null
  try {
    await generateCanvas(props.text, canvasRef.value, { size: props.size })
    if (seq !== renderSeq) return
    await overlayLogo(canvasRef.value, logoUrl)
    if (seq !== renderSeq) return
    hasGenerated.value = true
    emit('generated', canvasRef.value)
  } catch {
    if (seq !== renderSeq) return
    errorMessage.value = 'Failed to generate QR code.'
    hasGenerated.value = false
  } finally {
    if (seq === renderSeq) isLoading.value = false
  }
}

watch(
  [() => props.text, () => props.size],
  ([newText, newSize], prevValues) => {
    if (prevValues && newText === prevValues[0] && newSize === prevValues[1]) return
    void renderQr()
  },
  { immediate: true, flush: 'post' },
)
</script>

<template>
  <div class="qr-preview">
    <canvas
      v-show="hasGenerated && !isLoading"
      ref="canvasRef"
      class="qr-canvas"
      :aria-label="hasGenerated ? `QR code for: ${text}` : undefined"
    />
    <p v-if="isLoading" class="qr-status">Generating…</p>
    <p v-if="errorMessage" class="qr-error" role="alert">{{ errorMessage }}</p>
    <p v-if="!text.trim() && !isLoading" class="qr-placeholder">
      Enter content above and press Generate.
    </p>
  </div>
</template>

<style scoped>
.qr-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 0 8px;
  min-height: 180px;
}

.qr-canvas {
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.qr-status,
.qr-placeholder {
  font-size: 14px;
  color: var(--text);
  margin: 0;
}

.qr-error {
  font-size: 14px;
  color: #ef4444;
  margin: 0;
}
</style>

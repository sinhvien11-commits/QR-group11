import { onMounted, onUnmounted, ref } from 'vue'

import { createQrScanner, mapScannerError } from '@/services/qrScanner'
import type { QrScannerHandle } from '@/services/qrScanner'
import { detectContentType } from '@/services/scanner/contentDetector'
import { normalize } from '@/services/scanner/normalizer'
import { createScanResult } from '@/services/scanner/scanResult'
import type { ScanResult } from '@/services/scanner/scanResult'

import {
  SCAN_TIMEOUT_MS,
  SCANNER_ELEMENT_ID,
  SCANNER_ERROR_MESSAGES,
} from '@/constants/scanner.constants'
import type { ScannerError, ScannerStatus } from '@/types/scanner.types'

export function useQrScanner() {
  const status = ref<ScannerStatus>('idle')
  const scanError = ref<ScannerError | null>(null)
  const lastResult = ref<ScanResult | null>(null)

  let handle: QrScannerHandle | null = null
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  function clearScanTimeout(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  async function stopHardware(): Promise<void> {
    if (!handle) return
    try {
      await handle.stop()
    } finally {
      handle = null
      lastResult.value = null
    }
  }

  async function start(): Promise<void> {
    if (status.value === 'loading' || status.value === 'scanning' || status.value === 'paused')
      return
    status.value = 'loading'
    scanError.value = null
    try {
      handle = createQrScanner(SCANNER_ELEMENT_ID)
      await handle.start((raw) => {
        clearScanTimeout()
        const normalized = normalize(raw)
        const contentType = detectContentType(normalized)
        lastResult.value = createScanResult(raw, normalized, contentType)
        handle?.pause()
        status.value = 'paused'
      })
      status.value = 'scanning'

      timeoutId = setTimeout(() => {
        if (status.value === 'scanning') {
          void stopHardware()
          scanError.value = { type: 'timeout', message: SCANNER_ERROR_MESSAGES['timeout'] }
          status.value = 'error'
        }
      }, SCAN_TIMEOUT_MS)
    } catch (err: unknown) {
      clearScanTimeout()
      scanError.value = mapScannerError(err)
      status.value = 'error'
      handle = null
    }
  }

  async function stop(): Promise<void> {
    clearScanTimeout()
    if (!handle) return
    try {
      await handle.stop()
    } finally {
      handle = null
      lastResult.value = null
      status.value = 'idle'
    }
  }

  function pause(): void {
    if (!handle) return
    handle.pause()
    status.value = 'paused'
  }

  function resume(): void {
    if (!handle) return
    handle.resume()
    lastResult.value = null
    status.value = 'scanning'

    timeoutId = setTimeout(() => {
      if (status.value === 'scanning') {
        void stopHardware()
        scanError.value = { type: 'timeout', message: SCANNER_ERROR_MESSAGES['timeout'] }
        status.value = 'error'
      }
    }, SCAN_TIMEOUT_MS)
  }

  function handleDeviceChange(): void {
    if (status.value !== 'scanning' && status.value !== 'paused') return
    if (!navigator.mediaDevices) return
    void navigator.mediaDevices.enumerateDevices().then((devices) => {
      const hasCamera = devices.some((d) => d.kind === 'videoinput')
      if (!hasCamera) {
        clearScanTimeout()
        void stopHardware()
        scanError.value = {
          type: 'camera-disconnected',
          message: SCANNER_ERROR_MESSAGES['camera-disconnected'],
        }
        status.value = 'error'
      }
    })
  }

  onMounted(() => {
    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange)
  })

  onUnmounted(() => {
    clearScanTimeout()
    navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange)
    void stop()
  })

  return { status, scanError, lastResult, start, stop, pause, resume }
}

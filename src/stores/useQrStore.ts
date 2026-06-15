import { ref } from 'vue'
import { defineStore } from 'pinia'

import { deleteQr, listQrs, saveQr, updateQrTitle } from '@/services/firestore'
import { useAuthStore } from '@/stores/useAuthStore'
import type { QrHistoryInput, QrHistoryItem } from '@/types/qrHistory.types'

export const useQrStore = defineStore('qr', () => {
  const items = ref<QrHistoryItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function uid(): string {
    const authStore = useAuthStore()
    if (!authStore.currentUser) throw new Error('Not authenticated')
    return authStore.currentUser.uid
  }

  async function loadLibrary(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      items.value = await listQrs(uid())
    } catch {
      error.value = 'Failed to load your library. Please try again.'
    } finally {
      loading.value = false
    }
  }

  async function save(input: QrHistoryInput): Promise<void> {
    const id = await saveQr(uid(), input)
    const now = new Date()
    items.value.unshift({ ...input, id, createdAt: now, updatedAt: now })
  }

  async function remove(docId: string): Promise<void> {
    await deleteQr(uid(), docId)
    items.value = items.value.filter((item) => item.id !== docId)
  }

  async function rename(docId: string, title: string): Promise<void> {
    await updateQrTitle(uid(), docId, title)
    const item = items.value.find((i) => i.id === docId)
    if (item) {
      item.title = title
      item.updatedAt = new Date()
    }
  }

  return { items, loading, error, loadLibrary, save, remove, rename }
})

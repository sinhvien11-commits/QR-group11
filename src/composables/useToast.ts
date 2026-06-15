import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

let seq = 0

export function useToast() {
  const toasts = ref<ToastItem[]>([])

  function dismiss(id: string): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function show(message: string, type: ToastType = 'success', duration = 3000): void {
    const id = String(++seq)
    toasts.value.push({ id, message, type })
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
  }

  return { toasts, show, dismiss }
}

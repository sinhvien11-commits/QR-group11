import { onMounted, onUnmounted, ref } from 'vue'

export function useNetworkStatus() {
  const isOnline = ref(navigator.onLine)

  function setOnline(): void {
    isOnline.value = true
  }

  function setOffline(): void {
    isOnline.value = false
  }

  onMounted(() => {
    window.addEventListener('online', setOnline)
    window.addEventListener('offline', setOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', setOnline)
    window.removeEventListener('offline', setOffline)
  })

  return { isOnline }
}

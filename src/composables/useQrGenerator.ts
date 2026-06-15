import { computed, reactive, ref, watch } from 'vue'

import { formatEmail, formatPhone, formatText, formatUrl, formatWifi } from '@/services/formatters'
import type { WifiSecurity } from '@/services/formatters'

import type { QRContentType } from '@/types/qr.types'

export function useQrGenerator() {
  const contentType = ref<QRContentType>('text')
  const qrText = ref('')
  const formError = ref<string | null>(null)

  const textInput = reactive({ text: '' })
  const urlInput = reactive({ url: '' })
  const emailInput = reactive({ email: '' })
  const phoneInput = reactive({ phone: '' })
  const wifiInput = reactive({
    ssid: '',
    password: '',
    security: 'WPA' as WifiSecurity,
    hidden: false,
  })

  const canGenerate = computed<boolean>(() => {
    switch (contentType.value) {
      case 'text':
        return !!textInput.text.trim()
      case 'url':
        return !!urlInput.url.trim()
      case 'email':
        return !!emailInput.email.trim()
      case 'phone':
        return !!phoneInput.phone.trim()
      case 'wifi':
        return !!wifiInput.ssid.trim()
      default:
        return false
    }
  })

  watch(contentType, () => {
    qrText.value = ''
    formError.value = null
  })

  function generate(): void {
    formError.value = null
    try {
      switch (contentType.value) {
        case 'text':
          qrText.value = formatText(textInput)
          break
        case 'url':
          qrText.value = formatUrl(urlInput)
          break
        case 'email':
          qrText.value = formatEmail(emailInput)
          break
        case 'phone':
          qrText.value = formatPhone(phoneInput)
          break
        case 'wifi':
          qrText.value = formatWifi(wifiInput)
          break
      }
    } catch (err: unknown) {
      if (err instanceof Error) formError.value = err.message
    }
  }

  return {
    contentType,
    qrText,
    formError,
    canGenerate,
    textInput,
    urlInput,
    emailInput,
    phoneInput,
    wifiInput,
    generate,
  }
}

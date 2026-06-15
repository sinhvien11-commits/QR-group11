import { MAX_INPUT_SSID, MAX_INPUT_WIFI_PASSWORD } from '@/constants/qr.constants'

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass'

export interface WifiInput {
  ssid: string
  password: string
  security: WifiSecurity
  hidden: boolean
}

export function isWifiPayload(text: string): boolean {
  return text.startsWith('WIFI:')
}

function escapeWifiValue(value: string): string {
  return value.replace(/[\\;,"]/g, (ch) => `\\${ch}`)
}

export function formatWifi(input: WifiInput): string {
  if (!input.ssid.trim()) throw new Error('Network name (SSID) is required.')
  if (input.ssid.length > MAX_INPUT_SSID) {
    throw new Error(`SSID must be ${MAX_INPUT_SSID} characters or fewer.`)
  }
  if (input.security !== 'nopass' && !input.password.trim()) {
    throw new Error('Password is required for WPA and WEP networks.')
  }
  if (input.security !== 'nopass' && input.password.length > MAX_INPUT_WIFI_PASSWORD) {
    throw new Error(`Password must be ${MAX_INPUT_WIFI_PASSWORD} characters or fewer.`)
  }
  const ssid = escapeWifiValue(input.ssid)
  const pass = input.security === 'nopass' ? '' : escapeWifiValue(input.password)
  const hidden = input.hidden ? 'H:true;' : ''
  return `WIFI:T:${input.security};S:${ssid};P:${pass};${hidden};`
}

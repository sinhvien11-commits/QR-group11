import { MAX_INPUT_URL } from '@/constants/qr.constants'

export interface UrlInput {
  url: string
}

const BLOCKED_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'blob:', 'file:']

export function isValidUrl(text: string): boolean {
  if (!/^https?:\/\//i.test(text)) return false
  try {
    const parsed = new URL(text)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function formatUrl(input: UrlInput): string {
  const url = input.url.trim()
  if (!url) throw new Error('URL is required.')
  if (url.length > MAX_INPUT_URL) {
    throw new Error(`URL must be ${MAX_INPUT_URL} characters or fewer.`)
  }

  const lower = url.toLowerCase()
  if (BLOCKED_SCHEMES.some((s) => lower.startsWith(s))) {
    throw new Error('URL scheme not allowed. Use http:// or https://.')
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Enter a valid URL (e.g. https://example.com).')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL must start with http:// or https://.')
  }
  return url
}

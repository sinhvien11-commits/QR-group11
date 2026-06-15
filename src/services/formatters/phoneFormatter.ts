import { MAX_INPUT_PHONE } from '@/constants/qr.constants'

const PHONE_ALLOWED_RE = /^[+\d\s\-().]+$/
const MIN_DIGITS = 7
const MAX_DIGITS = 15

function countDigits(value: string): number {
  return (value.match(/\d/g) ?? []).length
}

export interface PhoneInput {
  phone: string
}

export function isValidPhone(text: string): boolean {
  const phone = text.trim()
  if (!PHONE_ALLOWED_RE.test(phone)) return false
  const digits = countDigits(phone)
  return digits >= MIN_DIGITS && digits <= MAX_DIGITS
}

export function formatPhone(input: PhoneInput): string {
  const phone = input.phone.trim()
  if (!phone) throw new Error('Phone number is required.')
  if (phone.length > MAX_INPUT_PHONE) {
    throw new Error(`Phone number must be ${MAX_INPUT_PHONE} characters or fewer.`)
  }
  if (!PHONE_ALLOWED_RE.test(phone)) {
    throw new Error('Enter a valid phone number (e.g. +84123456789).')
  }
  const digits = countDigits(phone)
  if (digits < MIN_DIGITS || digits > MAX_DIGITS) {
    throw new Error(`Phone number must have ${MIN_DIGITS}–${MAX_DIGITS} digits.`)
  }
  return `tel:${phone}`
}

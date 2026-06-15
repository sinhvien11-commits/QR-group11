import { MAX_INPUT_EMAIL } from '@/constants/qr.constants'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export interface EmailInput {
  email: string
}

export function isValidEmail(text: string): boolean {
  return EMAIL_RE.test(text.trim())
}

export function formatEmail(input: EmailInput): string {
  const email = input.email.trim()
  if (!email) throw new Error('Email address is required.')
  if (email.length > MAX_INPUT_EMAIL) {
    throw new Error(`Email must be ${MAX_INPUT_EMAIL} characters or fewer.`)
  }
  if (!EMAIL_RE.test(email)) throw new Error('Enter a valid email address.')
  return `mailto:${email}`
}

import { MAX_QR_LENGTH } from '@/constants/qr.constants'

export interface TextInput {
  text: string
}

export function formatText(input: TextInput): string {
  if (!input.text.trim()) throw new Error('Text is required.')
  if (input.text.length > MAX_QR_LENGTH) {
    throw new Error(`Text must be ${MAX_QR_LENGTH} characters or fewer.`)
  }
  return input.text
}

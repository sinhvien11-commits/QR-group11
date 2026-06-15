export interface QrOptions {
  size?: number
  foreground?: string
  background?: string
  margin?: number
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

export type QRContentType = 'text' | 'url' | 'email' | 'phone' | 'wifi'

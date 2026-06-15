/** Pixel width of generated QR code images. */
export const DEFAULT_QR_SIZE = 256

/** Quiet zone width in QR modules around the symbol. */
export const DEFAULT_QR_MARGIN = 2

/** Maximum character length supported by QR Code v40, byte encoding, ECC level L. */
export const MAX_QR_LENGTH = 2953

/** Error correction level used for all generated QR codes. H allows 30% damage recovery, required when overlaying a logo. */
export const DEFAULT_QR_ERROR_CORRECTION = 'H' as const

export const DEFAULT_QR_FOREGROUND = '#000000'
export const DEFAULT_QR_BACKGROUND = '#ffffff'

/** Logo occupies this fraction of the QR canvas width. Kept at 20% to stay within the ECC-H recovery zone. */
export const QR_LOGO_RATIO = 0.2

/** Extra padding between logo edge and white background, as a fraction of QR canvas width. */
export const QR_LOGO_BG_PADDING = 0.028

/** Brand prefix used in exported filenames. */
export const QR_FILENAME_PREFIX = 'group11'

/** Per-field input length limits enforced in both HTML maxlength and formatters. */
export const MAX_INPUT_URL = 2048
export const MAX_INPUT_EMAIL = 320
export const MAX_INPUT_PHONE = 32
export const MAX_INPUT_SSID = 64
export const MAX_INPUT_WIFI_PASSWORD = 128

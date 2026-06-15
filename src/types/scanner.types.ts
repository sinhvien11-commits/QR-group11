export type ScannerStatus = 'idle' | 'loading' | 'scanning' | 'paused' | 'error'

export type ScannerErrorType =
  | 'permission-denied'
  | 'camera-unavailable'
  | 'camera-disconnected'
  | 'no-camera'
  | 'timeout'
  | 'unsupported'
  | 'unknown'

export interface ScannerError {
  type: ScannerErrorType
  message: string
}

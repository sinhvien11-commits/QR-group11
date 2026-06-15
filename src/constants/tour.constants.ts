import type { TourStep } from '@/types/tour.types'

export const TOUR_STORAGE_KEY = 'qr11-tour-done' as const

export const HOME_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="hero"]',
    title: 'Welcome to QR Group 11',
    body: 'A platform to generate, scan, and manage QR codes — powered by Gemini AI.',
  },
  {
    target: '[data-tour="generate"]',
    title: 'Generate QR Codes',
    body: 'Encode URLs, text, email, Wi-Fi credentials, and more into a QR code in seconds.',
  },
  {
    target: '[data-tour="scan"]',
    title: 'Scan QR Codes',
    body: 'Point your camera at any QR code for instant decoding and AI-powered content analysis.',
  },
  {
    target: '[data-tour="features"]',
    title: 'All Features',
    body: 'Explore Smart QR generation, scanning, a cloud-synced library, and AI safety analysis.',
  },
]

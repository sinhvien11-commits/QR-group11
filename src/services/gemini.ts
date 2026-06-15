import { GoogleGenerativeAI } from '@google/generative-ai'

import type { GeminiModerationResult, ModerationRisk } from '@/types/moderation.types'

const GEMINI_MODEL = 'gemini-1.5-flash'
const VALID_RISKS: ModerationRisk[] = ['safe', 'suspicious', 'blocked', 'unknown']

/** Hard cap on content sent to Gemini — prevents runaway tokens and prompt-stuffing attacks. */
const MAX_GEMINI_INPUT = 2000

/** Escape the ---END--- delimiter to prevent content from breaking out of the prompt boundary. */
function sanitizeForPrompt(content: string): string {
  return content.replace(/---END---/g, '---END\\---')
}

function buildPrompt(content: string): string {
  const safe = sanitizeForPrompt(content)
  return `Analyze the following QR code content for moderation purposes.

Content:
---START---
${safe}
---END---

Respond with ONLY a JSON object, no additional text, no markdown fences:
{
  "risk": "safe" | "suspicious" | "blocked" | "unknown",
  "summary": "brief plain-language description (1-2 sentences)",
  "categories": [],
  "confidence": 0.0
}

Risk levels:
- "safe": no harmful content detected
- "suspicious": potentially harmful, misleading, or inappropriate
- "blocked": clearly harmful (explicit profanity, hate speech, threats, illegal content)
- "unknown": analysis inconclusive

Applicable category values (include only those that apply): profanity, hate, violence, sexual, spam
confidence: 0.0 (low) to 1.0 (high certainty)`
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const braced = text.match(/\{[\s\S]*\}/)
  if (braced) return braced[0].trim()
  return text.trim()
}

function parseResponse(text: string): GeminiModerationResult {
  const raw: unknown = JSON.parse(extractJson(text))
  if (typeof raw !== 'object' || raw === null) throw new Error('Unexpected Gemini response shape')

  const obj = raw as Record<string, unknown>
  const risk = VALID_RISKS.includes(obj['risk'] as ModerationRisk)
    ? (obj['risk'] as ModerationRisk)
    : 'unknown'
  const summary = typeof obj['summary'] === 'string' ? obj['summary'] : 'No summary available.'
  const categories = Array.isArray(obj['categories'])
    ? obj['categories'].filter((c): c is string => typeof c === 'string')
    : []
  const confidence =
    typeof obj['confidence'] === 'number' ? Math.max(0, Math.min(1, obj['confidence'])) : 0

  return { risk, summary, categories, confidence }
}

export async function analyzeWithGemini(content: string): Promise<GeminiModerationResult> {
  const apiKey = import.meta.env['VITE_GEMINI_API_KEY'] as string | undefined
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not configured')

  const truncated =
    content.length > MAX_GEMINI_INPUT ? content.slice(0, MAX_GEMINI_INPUT) : content

  const client = new GoogleGenerativeAI(apiKey)
  const model = client.getGenerativeModel({ model: GEMINI_MODEL })
  const response = await model.generateContent(buildPrompt(truncated))
  return parseResponse(response.response.text())
}

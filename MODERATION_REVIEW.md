# MODERATION_REVIEW.md

Sprint 7A — Content Moderation Engine Review

---

## Architecture

### Layer map

```
src/
  types/
    moderation.types.ts        — all moderation interfaces and union types
  constants/
    moderation.constants.ts    — PROFANITY_PATTERNS, RISK_BADGE_LABELS, RISK_RECOMMENDATIONS
  utils/
    normalizeContent.ts        — pure content normalization (no I/O, no Vue)
  services/
    gemini.ts                  — Gemini API client, prompt, JSON parsing
    moderation/
      localModeration.ts       — regex-based pattern matching on normalized content
      moderation.ts            — public pipeline: normalize → local → Gemini → unified result
  composables/
    useModeration.ts           — reactive wrapper: loading, result, error; used by views
  components/
    moderation/
      AnalysisCard.vue         — display: risk badge, summary, categories, recommendation
  views/
    GenerateView.vue           — triggers analysis when qrText changes; wires save payload
    ScanView.vue               — triggers analysis when QR detected; wires save payload
```

### Type hierarchy

```
ModerationRisk     = 'safe' | 'suspicious' | 'blocked' | 'unknown'
AiRisk (updated)   = 'safe' | 'suspicious' | 'blocked' | 'unknown'   ← persistence layer

LocalModerationResult   { matched, matchedPattern?, reason? }
GeminiModerationResult  { risk, summary, categories, confidence }
ModerationResult        { risk, summary, categories, confidence, blockedLocally }
```

---

## Pipeline

```
moderateContent(text)
        │
        ▼
normalizeContent(text)
  • trim
  • remove zero-width chars (U+200B–200F, U+FEFF) via codepoint Set
  • NFKC unicode normalize
  • guard: if URL → return unchanged
  • lowercase
  • collapse spaced single letters: "F U C K" → "fuck", "đ ị t" → "địt"
  • collapse repeated spaces
        │
        ▼
runLocalModeration(normalized)
  • iterate PROFANITY_PATTERNS (RegExp[])
  • first match → { matched: true, matchedPattern, reason }
  • no match   → { matched: false }
        │
        ├── matched: true ──→ return ModerationResult
        │                       risk: 'blocked', blockedLocally: true
        │                       (Gemini is skipped entirely)
        │
        └── matched: false ─→ analyzeWithGemini(original text)
                                  • build prompt with ---START---/---END--- delimiters
                                  • call gemini-1.5-flash
                                  • extractJson: strip markdown fences if present
                                  • parseResponse: validate & clamp all fields
                                  → GeminiModerationResult
                              │
                         catch ──→ return { risk: 'unknown', blockedLocally: false }
                              │
                              ▼
                         return { ...geminiResult, blockedLocally: false }
```

### UI flow (both views)

```
QR generated / detected
        │
        ▼
useModeration.analyze(content)
  loading = true → AnalysisCard shows spinner
        │
        ▼
moderateContent() resolves
  result = ModerationResult
  loading = false → AnalysisCard shows risk badge + summary + categories + recommendation
        │
   risk === 'blocked' ──→ SaveQrButton disabled
   otherwise          ──→ SaveQrButton enabled
        │
   user clicks Save
        │
        ▼
  qrStore.save({
    aiRisk:    result.risk,
    aiSummary: result.summary,
    ...
  })
```

---

## Strengths

- **Layered, single-responsibility.** Each layer (normalize → local → Gemini → result) is a separate file with one job. Swapping or mocking any layer requires touching only that file.
- **Local-first, Gemini-optional.** Clearly blocked content is returned immediately from `localModeration.ts` without a network call. This reduces latency and Gemini API costs for obvious violations.
- **Prompt injection mitigated.** User content is wrapped in `---START---` / `---END---` delimiters in the Gemini prompt, preventing instructions embedded in a QR code from hijacking the analysis.
- **Resilient Gemini error handling.** `analyzeWithGemini` throws on API errors; `moderateContent` catches them and falls back to `{ risk: 'unknown' }` so the UI never breaks regardless of API availability.
- **Type-safe response parsing.** `parseResponse` validates every field from the Gemini JSON and falls back to safe defaults; no `as unknown` casts propagate into the application.
- **Zero-width bypass prevention.** The normalizer removes U+200B, U+200C, U+200D, U+200E, U+200F, and U+FEFF before local pattern matching. A QR code containing "f​u​c​k" would still be caught.
- **Single letter separation bypass prevention.** `collapseSpacedLetters` handles "F U C K", "f.u.c.k", "f-u-c-k", and "đ ị t" via a single token-analysis pass.
- **URL preservation.** `normalizeContent` detects HTTP/HTTPS URLs and returns them unchanged, preventing mangling of legitimate URL QR codes while still sending them to Gemini for analysis.
- **`blockedLocally` flag.** `ModerationResult` carries this field so future analytics or audit logs can distinguish Gemini-blocked content from locally-blocked content without re-running analysis.
- **`AiRisk` extended consistently.** Adding `'blocked'` to `AiRisk` in `qrHistory.types.ts` and `AI_RISK_LABELS` means saved QR codes accurately reflect their moderation outcome, including the library card display.
- **No Vue in services.** All moderation logic is plain TypeScript. The `useModeration` composable is the only Vue-aware layer.

---

## Known Limitations

- **ASCII evasion for Vietnamese.** Patterns match diacritic forms (`địt`, `đụ`, etc.) but NOT ASCII approximations (`dit`, `du`, etc.). A user who omits diacritics will bypass local detection. Gemini covers this case when available.
- **No English l33tspeak / symbol substitution.** Inputs like `f*ck`, `@ss`, `$hit` are not normalized or matched locally. Gemini is the backstop.
- **Race condition on rapid re-generation.** Clicking Generate multiple times quickly starts multiple Gemini calls; the last resolved call wins. Results from earlier calls silently overwrite. No abort controller is implemented.
- **Single-language PROFANITY_PATTERNS.** Only English and Vietnamese are in the starter set. Malicious content in other languages relies entirely on Gemini.
- **`collapseSpacedLetters` and short words.** A two-letter word like `"no"` would be mistakenly treated as two spaced-out single chars if separated: `"n o"` → `"no"`. This is correct for profanity detection purposes but could mangle legitimate two-character words elsewhere in the normalization pipeline.
- **Gemini model hardcoded.** `GEMINI_MODEL = 'gemini-1.5-flash'` is a constant in `gemini.ts`. Upgrading requires a code change rather than a config change.

---

## Technical Debt

- **`GenerateView.vue` exceeds 200-line guideline.** The form's five content-type templates make inline extraction difficult. Acceptable for now; individual form sections could be extracted into `<QrFormText />`, `<QrFormUrl />` etc. sub-components in a future polish sprint.
- **No unit tests for `normalizeContent` or `runLocalModeration`.** These are pure functions with well-defined I/O and are ideal candidates for unit tests in Milestone 8.
- **`PROFANITY_PATTERNS` is not deduplication-safe.** If a pattern appears multiple times (e.g., after future additions), it runs multiple times. A `Set` or a deduplication step in `runLocalModeration` would be the fix.
- **`RISK_RECOMMENDATIONS` live in constants, but the AnalysisCard could accept a custom `recommendation` prop.** This would allow per-view overrides (e.g., "cannot be generated" vs "cannot be saved") without changing constants.
- **Gemini confidence score is received but not displayed.** `ModerationResult.confidence` is stored and saved but not shown in `AnalysisCard`. A visual confidence indicator (e.g., a progress bar) would give users more context.

---

## Future Improvements

- **Abort previous Gemini requests on re-generation.** Use a request-ID counter or `AbortController` to cancel in-flight Gemini calls when analysis is re-triggered before the previous call resolves.
- **Expand `collapseSpacedLetters` to handle mixed separators.** Currently "f-u.c_k" splits into single chars and collapses correctly, but "fu_ck" (partial separator) stays as-is. A more thorough bypass-detection pass could catch these.
- **Pattern versioning.** Store a version hash of `PROFANITY_PATTERNS` in the saved QR record so that historical results can be understood in the context of the rule set that produced them.
- **Remote pattern updates.** Load `PROFANITY_PATTERNS` from a Firestore config document or a cloud function so the list can be updated without a code deploy.
- **Structured Gemini output (JSON mode).** When the Gemini SDK supports `responseMimeType: 'application/json'`, switch to it to eliminate the `extractJson` / `parseResponse` fragility.
- **Confidence threshold to escalate.** If Gemini returns `confidence < 0.4`, treat the result as `'unknown'` regardless of the raw risk value to avoid false positives.
- **Global notification for blocked saves.** Currently blocked content silently disables the SaveQrButton. A toast explaining *why* the save is blocked would improve UX.
- **Add `displayRisk` to `AnalysisCard`.** A confidence-bar or star-rating-style indicator for the `confidence` value is stored in `ModerationResult` but currently not surfaced in the UI.

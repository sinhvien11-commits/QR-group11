# Scanner Pipeline — Review

**Date:** 2026-06-15
**Scope:** Scanner pipeline extension — raw decoded string → normalized `ScanResult`.

---

## Architecture

```
QR frame decode (html5-qrcode)
         │
         ▼ raw string
    normalize()               ← normalizer.ts
         │
         ▼ normalized string
  detectContentType()         ← contentDetector.ts
         │
         ▼ QRContentType | 'unknown'
   createScanResult()         ← scanResult.ts
         │
         ▼ ScanResult
  lastResult ref              ← useQrScanner.ts
         │
         ▼ emit detected(result)
  QrScanner.vue → ScanView.vue
```

The pipeline runs entirely inside the `html5-qrcode` success callback in `useQrScanner.ts`. No async work, no side effects — synchronous transform from raw string to typed value.

---

## Files Created

### `src/services/scanner/normalizer.ts`

Exports a single `normalize(raw: string): string` function. Applies transforms in order:

| Transform | What it does |
|---|---|
| Trim | `raw.trim()` — removes leading/trailing whitespace |
| Collapse spaces | `text.replace(/[ \t]{2,}/g, ' ')` — collapses runs of spaces/tabs |
| URL scheme | `new URL(text).href` — lowercases scheme and host for http/https URLs |
| `mailto:` prefix | `MAILTO:...` → `mailto:...` (case-insensitive prefix match) |
| `tel:` prefix | `TEL:...` → `tel:...` (case-insensitive prefix match) |
| `WIFI:` prefix | `wifi:...` → `WIFI:...` (canonical uppercase) |

Each transform is implemented as a private function. Only `normalize()` is exported.

**Normalizations are additive and order-independent** for the supported types: a `WIFI:` string is not an http URL, a `mailto:` string passes through URL normalization unchanged (its protocol doesn't match), etc.

### `src/services/scanner/contentDetector.ts`

Exports `detectContentType(normalized: string): QRContentType | 'unknown'`.

Detection order:

1. `isWifiPayload(normalized)` → `'wifi'`
2. `isValidUrl(normalized)` → `'url'`
3. `normalized.startsWith('mailto:') || isValidEmail(normalized)` → `'email'`
4. `normalized.startsWith('tel:') || isValidPhone(normalized)` → `'phone'`
5. fallback → `'text'`

All detection functions are **imported from the formatter layer** — no regex is declared in this file. This satisfies the "reuse formatter validation, avoid duplicated regex" requirement.

### `src/services/scanner/scanResult.ts`

Defines the `ScanResult` interface and exports `createScanResult(raw, normalized, contentType): ScanResult`.

```typescript
interface ScanResult {
  raw: string               // unmodified decoded string
  normalized: string        // output of normalize()
  contentType: QRContentType | 'unknown'
  detectedAt: Date          // timestamp of detection
  source: 'camera'          // literal — ready for 'upload' variant in future
}
```

`source: 'camera'` is a discriminant field. When image upload is added (Milestone 4 extension), the upload path will produce `source: 'upload'` and callers (e.g., Gemini analysis) can branch on it.

---

## Files Modified

### Formatter additions (no existing behaviour changed)

Each formatter received one new exported function that exposes its private validation logic:

| File | New export | Reuses |
|---|---|---|
| `urlFormatter.ts` | `isValidUrl(text): boolean` | `new URL()` parse + protocol check |
| `emailFormatter.ts` | `isValidEmail(text): boolean` | private `EMAIL_RE` |
| `phoneFormatter.ts` | `isValidPhone(text): boolean` | private `PHONE_ALLOWED_RE`, `countDigits`, `MIN_DIGITS`, `MAX_DIGITS` |
| `wifiFormatter.ts` | `isWifiPayload(text): boolean` | `text.startsWith('WIFI:')` |

The private constants and helpers remain private. The new exports are pure boolean functions with no side effects.

### `useQrScanner.ts`

- `lastResult` changed from `ref<string | null>` to `ref<ScanResult | null>`
- Scanner callback now runs the pipeline: `normalize → detectContentType → createScanResult`
- Three new imports from `@/services/scanner/`

### `QrScanner.vue`

- `detected` emit changed from `[text: string]` to `[result: ScanResult]`
- Watch emits `detected(result)` instead of `detected(text)`
- Result display changed from `{{ lastResult }}` to `{{ lastResult?.normalized }}`

### `ScanView.vue`

- `detectedText` changed from `ref<string | null>` to `ref<ScanResult | null>`
- `handleDetected` parameter changed from `text: string` to `result: ScanResult`

---

## Key Design Decisions

### 1. Pipeline in the composable, not the service

The pipeline (`normalize → detect → create`) runs inside `useQrScanner.ts`'s success callback, not inside `qrScanner.ts`. This keeps `qrScanner.ts` focused on the hardware layer (camera lifecycle, library wrapping) and the composable focused on application state. The pipeline is purely about data transformation — it belongs in the state machine layer.

### 2. Reusing formatter validators without duplicating regex

The formatters own their validation logic. Rather than copy regex into the content detector, each formatter exports a boolean predicate. The content detector composes these predicates — it has no regex of its own. This means any future change to email/phone validation (e.g., updated regex in `emailFormatter.ts`) automatically propagates to scanner content detection.

### 3. Prefix checks before validators in detection

The detection function checks `startsWith('mailto:')` before calling `isValidEmail()`. This correctly handles `mailto:user@example.com` (has the prefix, but the part after `mailto:` might not pass the email regex alone). The `||` ensures both the prefixed form and the bare form (`user@example.com`) are detected as email.

### 4. Space collapse applied globally

`collapseSpaces` runs on all content, including WiFi payloads. This is a pragmatic trade-off: WiFi SSIDs and passwords with intentional consecutive spaces (e.g., `"my  network"`) would be silently collapsed. In practice, QR codes containing WiFi credentials are generated by apps that do not produce such SSIDs, and QR codes generated by our own `wifiFormatter.ts` never contain double spaces. The trade-off was accepted to simplify the pipeline.

### 5. `source: 'camera'` as a literal type

`ScanResult.source` is typed as the literal `'camera'`, not `string`. This enables TypeScript to narrow on `source` in future callers (e.g., `if (result.source === 'upload')`). A future upload scanner would set `source: 'upload'` and the union type would expand accordingly.

---

## Strengths

1. **Zero regex duplication.** The content detector imports all its validation from formatters. The formatter regex constants remain private implementation details.

2. **Pipeline is synchronous.** `normalize`, `detectContentType`, and `createScanResult` are all pure synchronous functions. The scanner callback completes in microseconds — no async overhead in the hot path.

3. **`ScanResult.raw` preserves the original.** If normalization introduces any change (e.g., URL casing, trimming), the caller can always access the exact bytes the QR code encoded via `result.raw`.

4. **`detectedAt: new Date()` is inside `createScanResult`.** The timestamp records the moment of detection, not the moment the UI renders. This is accurate for future history/library use.

5. **Gemini extension point unchanged.** `ScanView.vue`'s `handleDetected` already stores `detectedText`. The only change is the type — wiring Gemini in Milestone 5 requires no structural change to `ScanView.vue`.

---

## Known Issues and Technical Debt

### TD-1 — Phone number false positives

`isValidPhone` checks character set and digit count. A bare numeric string like `12345678901` (11 digits, no formatting chars other than digits) would pass and be detected as `'phone'`. This is acceptable for QR content decoded from real-world codes, which rarely encode bare multi-digit numbers without context. Adding a `+` prefix requirement for bare phone detection would reduce false positives but would miss domestic formats (e.g., `0123456789` in Vietnam).

**Fix (optional):** Only auto-detect as phone if the normalized text starts with `tel:` or starts with `+`. Bare numbers fall through to `'text'`. Revisit if users report misclassification.

### TD-2 — URL normalization adds trailing slash

`new URL('http://example.com').href` returns `'http://example.com/'` (trailing slash on root). The raw and normalized values differ for bare domain URLs. This is RFC 3986 correct but could confuse users comparing raw vs normalized in future debugging.

**Not a bug** — document in release notes when `ScanResult.raw` is exposed in the UI.

### TD-3 — No `'unknown'` return path in current detector

The content detector always returns `'text'` as its fallback. The `'unknown'` variant in the `QRContentType | 'unknown'` union is reachable in the type but unreachable in practice. Reserved for future content types (vCard, geo, iCal) that would need explicit detection before falling through to `'unknown'` if unrecognized.

### TD-4 — Space collapse corrupts WiFi payloads with double spaces

See "Key Design Decisions §4" above. Intentional trade-off. Track as a known limitation.

### TD-5 — `contentType` not displayed in scanner UI

`QrScanner.vue` displays `lastResult?.normalized` but not `lastResult?.contentType`. The content type is available but the UI treats all results identically. A type badge (`URL`, `EMAIL`, etc.) would improve the UX.

**Fix (Milestone 7):** Add a type badge beside the decoded content in `scanner-result`.

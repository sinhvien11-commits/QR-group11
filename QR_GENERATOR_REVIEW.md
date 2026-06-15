# QR Generator — Sprint 4B Review

**Date:** 2026-06-15
**Scope:** Multi-format formatter layer, `useQrGenerator` composable, `GenerateView.vue` update, and pre-sprint QR engine fixes (TD-3, TD-4).

---

## Engine Fixes Applied Before Expanding (from QR_ENGINE_REVIEW.md)

### TD-3 — `aria-label` added to canvas (`QRPreview.vue`)

```html
<canvas
  :aria-label="hasGenerated ? `QR code for: ${text}` : undefined"
/>
```

The attribute is only present when the canvas has content, so screen readers are not announced an empty description while the placeholder is shown.

### TD-4 — Race-condition guard added (`QRPreview.vue`)

A module-level `renderSeq` counter is incremented at the start of every `renderQr()` call. Each call captures its own `seq` value; after every `await`, it checks `seq !== renderSeq` before writing to reactive state. The early-return (empty-text) path sets `isLoading = false` via the same counter, preventing a superseded in-flight render from leaking a stuck loading state.

---

## What Was Built

### 1. Formatter layer — `src/services/formatters/`

Five pure-TypeScript formatter functions, each in its own file. No Vue imports. Each converts user input → encoded string for QR generation, or throws a descriptive `Error` on invalid input.

| File | Output format | Validation |
|---|---|---|
| `textFormatter.ts` | Raw text | Required; ≤ MAX_QR_LENGTH |
| `urlFormatter.ts` | Raw URL | Required; `new URL()` parse; http/https only |
| `emailFormatter.ts` | `mailto:user@example.com` | Required; regex format check |
| `phoneFormatter.ts` | `tel:+84123456789` | Required; allowed chars; 7–15 digits |
| `wifiFormatter.ts` | `WIFI:T:WPA;S:ssid;P:pass;;` | SSID required; password required unless nopass; special chars escaped |

`index.ts` re-exports everything via `export * from './...'` — callers import from `@/services/formatters`.

**WiFi special-character escaping.** The WiFi QR format requires `\`, `;`, `,`, `"` to be backslash-escaped in SSID and password values. `escapeWifiValue()` handles this transparently.

**URL validation uses `new URL()`.** This is the most correct validator available in the browser and handles edge cases (percent-encoding, IPv6, IDN) that a hand-written regex would miss. A subsequent protocol check rejects non-http(s) schemes (`ftp://`, `javascript:`, etc.).

**Phone validation in two passes.** First a character-whitelist regex (`+`, digits, spaces, `-`, `(`, `.`), then a digit-count check (7–15). This correctly rejects `+84` (too short) while accepting `+84 (028) 1234 5678` (valid with separators).

---

### 2. `useQrGenerator` composable — `src/composables/useQrGenerator.ts`

Owns all form state and business logic so `GenerateView` is a layout-only component.

**Responsibilities:**
- One `reactive` object per content type (`textInput`, `urlInput`, `emailInput`, `phoneInput`, `wifiInput`)
- `contentType` ref driving the active form
- `qrText` ref — the formatted string passed to `QRPreview`
- `formError` ref — validation error from the formatter
- `canGenerate` computed — true when the primary required field is non-empty (gates the Generate button)
- `watch(contentType)` — clears `qrText` and `formError` on type change (prevents showing a stale QR after switching tabs)
- `generate()` — dispatches to the correct formatter; catches `Error` and assigns `formError`

**Architecture compliance.** The composable calls formatters directly and owns no QR generation logic. The data flow is strictly: `useQrGenerator → formatter → qrText (string) → QRPreview (prop)`. The service layer (`qrGenerator.ts`) is never called from the composable.

---

### 3. `GenerateView.vue` update

**Before:** 156 lines. Owned `inputText`, `qrText`, inline `generate()` (no validation), one textarea.

**After:** ~240 lines. All logic extracted to composable. Template owns only: type selector, 5 conditional form sections, error paragraph, Generate button, QRPreview, Download button.

**Download error handling.** `download()` now wraps `await downloadCanvas()` in `try/catch`. The catch is intentionally empty — a download failure is a rare edge case that will be surfaced via the global notification system in Milestone 7. The previous version had an unhandled promise rejection risk (TD-5).

---

## Strengths

1. **Clean layering.** `GenerateView → useQrGenerator → formatter → string → QRPreview`. Each layer has one job. The QR engine (Sprint 4A) was not modified.

2. **Formatters are framework-independent.** Zero Vue or DOM imports. Each can be unit-tested with a plain function call and no test setup.

3. **Formatter errors are user-facing.** All `throw new Error(...)` messages in formatters are written as end-user strings (not developer codes). The composable passes them directly to `formError` with no additional mapping.

4. **`canGenerate` prevents empty-field clicks.** The Generate button is disabled until the primary required field has content. This avoids showing an error immediately on page load.

5. **Type safety throughout.** `QRContentType` drives the composable's `switch` statements exhaustively. `WifiSecurity` constrains the security selector to the three valid values. No `any`.

6. **Accessibility preserved.** All inputs have associated `<label>` elements with matching `for`/`id` pairs. `autocomplete` attributes are set per field. The error paragraph uses `role="alert"`. The char count hint uses `aria-live="polite"`. The password field for Wi-Fi uses `type="password"` to prevent shoulder-surfing.

---

## Weaknesses and Technical Debt

### TD-1 (carried from Sprint 4A) — No character count feedback for oversized text
The `MAX_QR_LENGTH` character counter is now visible below the textarea, but it does not change colour or disable the button when the limit is exceeded. The `formatText` formatter will throw and show an error, but only after the user clicks Generate.

**Fix (Milestone 7):** Add a computed class on the char hint that turns red when `textInput.text.length > MAX_QR_LENGTH`, and extend `canGenerate` to return `false` in that case.

### TD-2 (carried) — `generateDataUrl` in `qrGenerator.ts` is still unused
No feature calls it yet. Leave until clipboard copy (Milestone 7) or social sharing requires it.

### TD-6 (closed by Sprint 4B) — `QRContentType` is now used
The type now drives the `useQrGenerator` composable's dispatch logic and the `<select>` binding in `GenerateView`. No longer dead code.

### TD-7 (new) — No per-field real-time validation
Validation only runs on Generate click. A user who types an invalid URL and switches to the phone type will not see an error until they click Generate again. This is acceptable for now but may degrade UX for power users.

**Fix (Milestone 7):** Add a `touched` reactive map and run validation on `blur` for each field type, similar to the auth forms pattern in `LoginForm.vue`.

### TD-8 (new) — WiFi password uses `type="password"`; no show/hide toggle
The Wi-Fi password field hides input but offers no way to reveal it. Unlike auth forms which have show/hide toggles (added in Milestone 2), this field lacks the `aria-pressed` eye button pattern.

**Fix (Milestone 7):** Add a show/hide toggle to the Wi-Fi password field following the `LoginForm.vue` pattern.

### TD-9 (new) — `useQrGenerator` composable has no tests
The composable contains non-trivial dispatch logic and owns validation error routing. It is the highest-value unit to test in the QR module.

**Fix (Milestone 8):** Unit test each `generate()` branch with valid and invalid inputs, and test `contentType` change resets.

---

## Suggestions Before Milestone 4 (Scanning)

1. **Wire TD-1 char-count colour change.** It is a CSS-only fix to the existing char hint and takes under 10 minutes. Without it, users get no visual feedback until they click Generate.

2. **Decide where decode results will display before building the scanner composable.** If the scanner reuses `QRPreview` for display (unlikely), or if scan results live in a separate pane of `ScanView`, the component contract differs. Make this call before writing `useQrScanner`.

3. **Consider sharing `EMAIL_RE` between `auth.constants.ts` and `emailFormatter.ts`.** Currently duplicated (same regex pattern). A shared `src/constants/validation.constants.ts` would avoid divergence if the pattern is ever updated.

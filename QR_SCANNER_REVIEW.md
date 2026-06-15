# QR Scanner — Milestone 4 Review

**Date:** 2026-06-15
**Scope:** Scanner core — camera lifecycle, QR decoding, error handling, scanner UI.

---

## Architecture

```
ScanView.vue
└── QrScanner.vue
     └── useQrScanner.ts (composable)
          └── qrScanner.ts (service)
               └── html5-qrcode (library)
```

Each layer has exactly one responsibility:

| Layer | Responsibility |
|---|---|
| `qrScanner.ts` | Wraps `html5-qrcode` API; maps errors to typed values |
| `useQrScanner.ts` | Scanner lifecycle state machine; cleans up on unmount |
| `QrScanner.vue` | Camera UI, overlays, controls; emits `detected` / `cleared` |
| `ScanView.vue` | Page layout; receives detected text for future Gemini wiring |

Vue components never import from `html5-qrcode` directly — all library interactions flow through `qrScanner.ts`.

---

## Status Machine

```
idle ──[Start Camera]──▶ loading ──[permission granted]──▶ scanning
                              └──[error]──▶ error ──[Start Camera]──▶ loading

scanning ──[QR detected]──▶ paused ──[Scan Again]──▶ scanning
         └──[Stop]──▶ idle          └──[Stop]──▶ idle

error ──[Start Camera]──▶ loading
```

`status` is the single source of truth for the scanner's current state. The composable is the only writer; the component is read-only.

---

## Key Design Decisions

### 1. Auto-pause on first detection

When a QR code is decoded, the composable immediately calls `handle.pause()` and sets `status = 'paused'`. This prevents the same code from being detected on every subsequent frame. The user must press "Scan Again" to resume.

### 2. `cleared` emit pattern

`QrScanner.vue` emits two events:
- `detected(text)` — when `lastResult` changes from null to a value
- `cleared()` — when `lastResult` changes from a value back to null (on Scan Again or Stop)

`ScanView.vue` holds `detectedText` and resets it on `cleared`. This prepares the extension point for Milestone 5 (Gemini analysis): `ScanView` will send `detectedText` to the Gemini service without touching `QrScanner.vue`.

### 3. Factory pattern for `QrScannerHandle`

`createQrScanner()` returns a `QrScannerHandle` interface, not a class instance directly. The composable holds this handle as a plain variable (not a ref) — it is control-plane state, not reactive data. The composable owns the reactive refs (`status`, `lastResult`, `scanError`) and the handle is just the imperative controller.

### 4. Error classification

`mapScannerError()` converts `html5-qrcode` string errors (which vary by browser and OS) into a typed `ScannerError`. The classification checks for `NotAllowedError` patterns first (most common), then `NotFoundError`, then `NotReadableError`. All unrecognised errors fall through to `'unknown'`. The messages in `SCANNER_ERROR_MESSAGES` are written as end-user strings, not developer codes.

### 5. Responsive QR box

The `qrbox` option in the scanner config uses the function form: `(w, h) => size` where `size` is 80% of the smaller dimension. This makes the scanning region proportionally sized to the viewfinder on all screen sizes, rather than a fixed 250×250 pixel box that would overflow on narrow screens.

### 6. Camera-facing mode

The scanner requests `{ facingMode: 'environment' }` (rear/back camera) as the default. On desktop browsers without a rear camera, this falls back to whatever camera is available. On mobile, this selects the camera most useful for scanning physical QR codes.

### 7. Cleanup on unmount

`useQrScanner` registers an `onUnmounted` hook that calls `stop()`. This ensures the camera stream is always released when the component leaves the DOM, regardless of whether the user clicked "Stop Camera" manually. Without this, navigating away from ScanView would leave the camera running.

---

## Strengths

1. **Clean extension point for Gemini (Milestone 5).** `ScanView.vue` already holds `detectedText` and clears it on `cleared`. Adding Gemini analysis means wiring `handleDetected` to call the Gemini service — no changes to `QrScanner.vue` or `useQrScanner`.

2. **No auto-start.** Camera permission is requested only when the user presses "Start Camera". The `onMounted` lifecycle is not used to auto-start scanning.

3. **State machine prevents impossible transitions.** The `if (!handle) return` guards in `stop()`, `pause()`, and `resume()` make all transitions safe to call at any time. The composable cannot be driven into an inconsistent state.

4. **Verbose mode disabled.** `new Html5Qrcode(elementId, false)` suppresses the library's internal `console.log` output that would otherwise pollute the browser console.

5. **Error messages cover all defined cases.** `ScannerErrorType` is used as the key type for `SCANNER_ERROR_MESSAGES`, so TypeScript enforces that every error type has a user-facing message string.

---

## Known Issues and Technical Debt

### TD-1 — No scan timeout

If the camera is running but no QR code is ever detected, it will scan indefinitely. The task specifies "scan timeout" as a handled case. Currently, the composable has no timer to stop scanning after a period of no results.

**Fix (Milestone 7):** Add a `SCANNER_TIMEOUT_MS` constant and a `setTimeout` in `start()` that stops the scanner and sets `status = 'error'` with a timeout message if no QR is detected within the limit. The timeout must be cancelled on first successful detection.

### TD-2 — `ScanView.vue` holds `detectedText` but does not display it

`ScanView.vue` stores the detected text in `detectedText` for future Gemini use but does not render it. The decoded result IS shown inside `QrScanner.vue` (in the `scanner-result` div). This means the data flows up via emit only to be stored, not to be re-displayed. This is intentional — the separation exists to keep Milestone 5 wiring clean — but could be confusing if read without context.

**Fix (Milestone 5):** When the Gemini analysis card is added to `ScanView.vue`, `detectedText` will drive both the analysis call and the result display. The duplication will be resolved then.

### TD-3 — `QrScanner.vue` cannot handle multiple camera devices

The current implementation always requests `{ facingMode: 'environment' }`. If the user has multiple cameras (e.g., wide and telephoto) and wants a specific one, there is no UI to select it.

**Fix (post-Milestone 7):** Add an optional camera selector using `Html5Qrcode.getCameras()`. Only expose this UI if multiple cameras are available.

### TD-4 — Large bundle chunk

`html5-qrcode` adds ~373 KB (minified) to the `ScanView` chunk. The library bundles its own QR detection algorithm (ZXing-based) which accounts for most of this size. This is a lazy-loaded route chunk, so it does not affect initial page load.

**Fix (Milestone 8):** Evaluate whether `@zxing/library` or the native `BarcodeDetector` API (available in Chromium 83+) can replace or supplement `html5-qrcode` to reduce bundle size. `BarcodeDetector` has no JS overhead but is not available in Firefox or Safari.

### TD-5 — No image upload fallback

The functional requirements list image upload as a scanning fallback. `html5-qrcode` supports this via `Html5Qrcode.scanFile()`. Not implemented in Milestone 4.

**Fix (Milestone 4 extension or Milestone 7):** Add a file input below the scanner controls that calls `qrScanner.scanFile()` and emits `detected` with the result.

### TD-6 — Empty catch in `QrScannerHandle.start`

The `onScanFailure` callback (called every frame that has no QR code) is wired to an empty arrow function `() => {}`. This is intentional — per-frame failures are not errors — but ESLint may flag the empty function body depending on rule configuration.

**Fix:** If ESLint raises `@typescript-eslint/no-empty-function`, add an ESLint disable comment on that line, or use `(_err: string) => { /* expected: no QR in frame */ }`.

---

## Suggestions Before Milestone 5 (Gemini)

1. **Test the scanner on a real device with HTTPS.** The scanner requires `window.isSecureContext` (HTTPS or localhost). Vite's dev server on localhost satisfies this. Firebase Hosting (Milestone 8) uses HTTPS. Avoid testing on plain `http://` in production.

2. **Wire `detectedText` in `ScanView.vue` to a Gemini service call.** The architecture is already in place — `handleDetected` just needs one more line to call `geminiService.analyzeContent(text)` and a result card below `QrScanner` to show the response.

3. **Consider a `useGemini` composable.** Following the `useQrGenerator` pattern, Gemini analysis state (`loading`, `result`, `error`) belongs in a composable, not directly in `ScanView.vue`.

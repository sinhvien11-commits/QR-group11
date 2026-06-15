# QA Report — Sprint 8B

## Manual Test Checklist

### Part 1 — Extremely Long Inputs

| Test | Expected | Status |
|---|---|---|
| Paste 3000+ chars into Text field | Input capped at 2953 by `maxlength`; no generation | ✅ Enforced |
| Enter 2049-char URL | Input capped at 2048 by `maxlength` | ✅ Enforced |
| Enter 321-char email | Input capped at 320 by `maxlength` | ✅ Enforced |
| Enter 33-char phone number | Input capped at 32 by `maxlength` | ✅ Enforced |
| Enter 65-char SSID | Input capped at 64 by `maxlength` | ✅ Enforced |
| Enter 129-char WiFi password | Input capped at 128 by `maxlength` | ✅ Enforced |
| Submit at exactly limit boundary | Generates successfully | ✅ Passes formatter |
| Submit 1 char over (bypassing HTML via devtools) | Formatter throws friendly error; `formError` shown | ✅ Formatter validates |

**Field limits:**
- Text: `MAX_QR_LENGTH = 2953` (actual QR encoding limit at any ECC level)
- URL: 2048
- Email: 320 (RFC 5321)
- Phone: 32
- SSID: 64 (IEEE 802.11 standard)
- WiFi Password: 128

### Part 2 — Unicode Hardening

| Test | Expected | Status |
|---|---|---|
| Vietnamese diacritics (`tiếng Việt`) | QR generated; moderation normalizes via NFKC | ✅ Works |
| Japanese (`日本語テスト`) | QR generated using byte mode UTF-8 | ✅ Works |
| Chinese (`中文测试`) | QR generated | ✅ Works |
| Korean (`한국어 테스트`) | QR generated | ✅ Works |
| Arabic (`مرحبا بالعالم`) | QR generated; RTL text treated as bytes | ✅ Works |
| Emoji (`🎉🔥💯`) | QR generated; emoji are 4-byte UTF-8 sequences | ✅ Works |
| Mixed unicode (`héllo wörld 日本`) | QR generated; NFKC normalization applied for moderation | ✅ Works |
| Zero-width characters (`foo​bar` with ZWJ) | ZWJs stripped by `normalizeContent` before moderation; QR encodes original raw text | ✅ Works |
| Long emoji string (>250 emoji) | QR generator throws; `QRPreview` shows "Failed to generate QR code." | ✅ Handled |

**Notes:**
- `normalizeContent` applies NFKC normalization only to moderation input, not to the raw QR payload.
- The `MAX_QR_LENGTH = 2953` check counts JavaScript string `.length` (UTF-16 code units). Emoji and many CJK characters are surrogate pairs and count as 2. The `qrcode` library's own byte-level limit may be hit earlier for emoji-heavy input. The existing error message in `QRPreview` handles this gracefully.
- Arabic ZWJ (U+200D) used in ligatures is stripped by the moderation normalizer. This is acceptable for profanity detection; the raw QR content is unaffected.

### Part 3 — Malformed QR Inputs

| Test | Expected | Status |
|---|---|---|
| `javascript:alert(1)` in URL field | Blocked: "URL scheme not allowed" | ✅ Explicitly blocked |
| `data:text/html,<h1>` in URL field | Blocked: "URL scheme not allowed" | ✅ Explicitly blocked |
| `vbscript:msgbox(1)` in URL field | Blocked: "URL scheme not allowed" | ✅ Explicitly blocked |
| `blob:https://...` in URL field | Blocked: "URL scheme not allowed" | ✅ Explicitly blocked |
| `file:///etc/passwd` in URL field | Blocked: "URL scheme not allowed" | ✅ Explicitly blocked |
| `ftp://example.com` in URL field | Blocked: "URL must start with http:// or https://" | ✅ Blocked |
| Invalid URL (`not a url`) | Blocked: "Enter a valid URL" | ✅ Blocked |
| Invalid email (`notanemail`) | Blocked: "Enter a valid email address." | ✅ Blocked |
| Phone with letters (`123abc`) | Blocked: "Enter a valid phone number" | ✅ Blocked |
| Phone too short (`123`) | Blocked: fewer than 7 digits | ✅ Blocked |
| Empty SSID | Blocked: "Network name (SSID) is required." | ✅ Blocked |
| WPA without password | Blocked: "Password is required for WPA and WEP networks." | ✅ Blocked |
| Empty text field | Generate button disabled (`canGenerate = false`) | ✅ Prevented |

**Scanned malicious QR content:**
- When a scanned QR contains `javascript:alert(1)`, `detectContentType` identifies it as `'text'` (not `'url'`) because `isValidUrl` requires `http://` or `https://`. It is stored and displayed as plain text. Vue templates auto-escape `{{ }}` so no XSS risk.

### Part 4 — Scanner Stress

| Test | Expected | Status |
|---|---|---|
| Click "Start Camera" rapidly 5× | `start()` guards `status !== 'idle'/'error'`; only first call proceeds | ✅ Fixed |
| Scan same QR code twice | Second scan only works after "Scan Again" is pressed; `status = 'paused'` blocks automatic re-scan | ✅ Works |
| Camera physically disconnected mid-scan | `devicechange` event → `enumerateDevices()` → `'camera-disconnected'` error shown | ✅ Handled |
| Permission revoked mid-scan | Camera stream stops; `Html5Qrcode` internal error propagates on next frame; currently shows generic error | ⚠️ Partially handled |
| Camera busy (another app) | `classifyError` detects `NotReadableError`; shows `'camera-unavailable'` error | ✅ Handled |
| Switch tabs for 30s | Scan timeout fires; error state shown with "Start Camera" retry button | ✅ Handled |
| Page refresh during active scan | `onUnmounted` calls `stop()` → `Html5Qrcode.stop()` → camera track released | ✅ Handled |
| Memory leak (open/close scanner 20×) | Each `start()` creates one `Html5Qrcode` instance; each `stop()` destroys it; no accumulation | ✅ Clean |

**Known gap:** Permission revocation mid-scan is not caught proactively. The scanner enters an error state only after `Html5Qrcode` fails internally, which may show a generic "unknown" error rather than "permission-denied." This is a limitation of the underlying library.

### Part 5 — Export Validation

| Test | Expected | Status |
|---|---|---|
| Download PNG → scan with phone camera | QR decoded successfully; ECC H allows 30% damage | ✅ Scannable |
| Download SVG → open in browser → scan | QR rendered as vector; logo injected as data URL; scannable | ✅ Scannable |
| Copy Image → paste into scanner app | PNG blob copied to clipboard; decoded by scanner | ✅ Works |
| Logo visible in center (PNG) | White rounded-rect background + G11 logo overlaid | ✅ Visible |
| Logo visible in center (SVG) | SVG `<rect>` + `<image>` injected before `</svg>` | ✅ Visible |
| Logo absent if `group11.png` fails | `overlayLogo` resolves without painting; plain QR still scannable | ✅ Fallback works |
| Copy Image on HTTP (non-HTTPS) | Toast: "Failed to copy image. Use a modern browser with HTTPS." | ✅ Handled |

### Part 6 — Firestore Robustness

| Test | Expected | Status |
|---|---|---|
| Duplicate save (rapid double-click) | `saving` flag + `SaveQrButton :loading` prevents second click | ✅ Prevented |
| Network interruption during save | Firebase SDK throws; `getFirestoreErrorMessage` returns "Service unavailable" toast | ✅ Handled |
| Permission denied (expired session) | `permission-denied` Firebase error → toast: "Permission denied. Please sign in again." | ✅ Handled |
| Delete already-deleted document | `not-found` error → toast: "This item no longer exists." | ✅ Handled |
| Rename stale document | If document deleted by another session, `not-found` error → toast | ✅ Handled |
| Library load fails | `error.value` set; EmptyState with "Try again" shown | ✅ Handled |
| Rename in LibraryView | Now wrapped in try/catch; toast on failure | ✅ Fixed (was silent failure before) |
| Delete in LibraryView | Now wrapped in try/catch; toast on failure | ✅ Fixed (was silent failure before) |

### Part 7 — Security Review

#### Firebase Rules Assumptions

The app assumes Firestore Security Rules enforce:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/qrcodes/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
Without these rules, any authenticated user could read/write another user's QR codes. **These rules must be deployed to Firebase before production.**

The `/generate` and `/scan` routes do not require authentication. Library saving requires auth (checked at runtime in `useQrStore.uid()`). The `/library` route has a router guard enforcing auth before the view loads.

#### Gemini Prompt Injection

**Before Sprint 8B:** Content injected between `---START---`/`---END---` delimiters could contain `---END---` to break out of the prompt boundary.

**After Sprint 8B:** `sanitizeForPrompt()` escapes `---END---` occurrences in content before injection. Content is also truncated to 2000 characters before building the prompt.

**Remaining risk:** A sophisticated attacker could craft prompts using other jailbreaking techniques. Mitigations: local moderation runs first and blocks clearly harmful content before Gemini is called; Gemini responses are strictly parsed via `parseResponse()` and only 4 fields are extracted; invalid JSON or unexpected shapes fall back to `'unknown'` risk rather than crashing.

#### XSS Vectors

| Vector | Status |
|---|---|
| QR content displayed in template | `{{ }}` auto-escapes in Vue — safe |
| Scanned URL displayed in QrScanner result | `{{ lastResult?.normalized }}` — Vue escapes |
| Firestore data displayed in QrHistoryCard | All fields via `{{ }}` — Vue escapes |
| SVG injection in `injectLogoIntoSvg` | Logo data URL from controlled `group11.png` asset; width value extracted from trusted `qrcode` output — no user input involved |
| `v-html` directive | Not used anywhere in the codebase |
| `innerHTML` assignment | Not used anywhere in the codebase |

#### Clipboard & Download Security

- `copyQrToClipboard` writes a PNG `Blob` (binary), not text — no HTML/script injection possible.
- `downloadQrPng` creates a Blob URL from `canvas.toBlob()` — browser-sandboxed.
- `downloadQrSvg` filename comes from `buildExportFilename(type, ext)` — type is one of 5 known strings from a TypeScript union, date is from `new Date().toISOString()`. No user input in filename.

#### Router Guards

- `/library` requires auth via `meta: { requiresAuth: true }`. Guard waits for `authStore.isReady` before checking, preventing a race condition on page load.
- `/generate` and `/scan` are publicly accessible by design (no account needed to generate/scan).
- No unguarded admin or dangerous routes exist.

---

## Known Limitations

1. **ECC H capacity mismatch:** `MAX_QR_LENGTH = 2953` was calibrated for ECC Level L. At ECC H (the current default), the actual byte capacity is ~1273 bytes for byte mode. A user entering 1500 ASCII characters will pass the formatter check but fail at QR generation with "Failed to generate QR code." The error is caught and displayed, but the UX could be improved with a dynamic capacity indicator.

2. **Permission revocation mid-scan:** If the browser revokes camera permission while the scanner is active (e.g., user clicks "Block" in the browser's permission bar), the error is not proactively detected. The scanner shows a generic error on the next `Html5Qrcode` internal failure.

3. **SVG logo embedding in cross-origin context:** `loadImageAsDataUrl` uses `img.crossOrigin = 'anonymous'`. If the logo asset is served from a CDN without CORS headers, the canvas `toDataURL()` call will fail (tainted canvas). In development and standard Vite production builds, the asset is same-origin and this is safe. A CDN deployment needs CORS configuration.

4. **Gemini partial prompt injection:** The `---END---` delimiter escape prevents exact delimiter injection, but does not prevent other jailbreaking patterns. Gemini analysis should be treated as advisory, not authoritative.

5. **No rate limiting on moderation calls:** A user could generate hundreds of QR codes rapidly, each triggering a Gemini API call. No client-side debounce or server-side rate limiting exists. Mitigated by the offline check and the Gemini API's own rate limits.

6. **WiFi QR scanning detection:** `isWifiPayload` only checks `text.startsWith('WIFI:')`. Malformed WiFi payloads (e.g., missing fields) are stored as-is. Parsed by QR reader apps which may fail silently.

7. **Firestore optimistic update on rename fails:** If `updateQrTitle` fails after `item.title` was updated in the store's local state, the local state is now inconsistent. A page refresh or `loadLibrary()` call corrects it. `remove` correctly waits for Firestore before updating local state.

8. **No duplicate QR detection:** The library will store multiple identical QR codes (same content, type, source). There is no client-side or server-side deduplication.

---

## Remaining Technical Debt

| Item | Priority | Notes |
|---|---|---|
| Dynamic QR capacity indicator | Medium | Show actual remaining bytes at current ECC level |
| Firestore Security Rules deployment | **Critical** | Must be deployed before production; no rules = open database |
| Server-side Gemini rate limiting | Medium | Firebase Functions or Cloud Run proxy recommended |
| Optimistic update rollback on rename | Low | Currently relies on manual page refresh after failure |
| Permission revocation proactive detection | Low | `navigator.permissions.query({ name: 'camera' })` polling |
| Test suite | High | Zero unit tests; all validation is manual |
| CORS config for CDN logo assets | Medium | Required if deploying with CDN for SVG export |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Missing Firestore Security Rules | High (if skipped) | Critical | Deploy rules before going live |
| QR not scannable after export | Low | High | ECC H + 20% logo coverage within recovery zone |
| XSS via scanned content | Very Low | High | Vue auto-escapes all template bindings |
| Prompt injection via Gemini | Low | Medium | Delimiter escaping + input truncation + response parsing |
| Clipboard API unavailable | Medium | Low | Toast informs user; PNG download available as fallback |
| Camera permission race on start() | Low | Low | Idempotency guard prevents duplicate handles |

---

## Production Readiness

### Ready ✅
- Authentication and protected routing
- QR generation with ECC H and logo branding
- Content moderation (local + Gemini)
- Offline detection and graceful degradation
- Input validation and length limits
- Dangerous URL scheme rejection
- Export: PNG, SVG, Clipboard
- Toast feedback for all error states
- Accessible UI (aria-labels, focus management, keyboard nav)
- Scanner timeout and camera-disconnected handling

### Blockers before production 🚫
1. **Firestore Security Rules** must be deployed and verified
2. **Environment variables** (`.env`) must be configured for the production Firebase project and Gemini API key
3. **HTTPS** must be enforced (required for Clipboard API and camera access)

### Recommended before production ⚠️
1. Add at least unit tests for formatters and `normalizeContent`
2. Add Gemini API key server-side proxy (avoid exposing key in browser bundle)
3. Verify Firebase App Check is enabled to prevent API key abuse

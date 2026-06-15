# Sprint 7B Review — UX Polish, Security Hardening & Edge Case Handling

## Summary

Sprint 7B hardened the existing QR app with production-quality loading states, empty states, a native accessible dialog, a queue-based toast system, offline detection, scanner timeout/disconnection handling, moderation hardening, and accessibility improvements. No existing business logic or architecture was changed.

---

## Architecture

### No architectural changes

The folder structure, routing, stores, and Firebase/Gemini service boundaries are identical to Sprint 7A. All new code follows the established `composables/`, `components/ui/`, `types/`, `constants/` conventions.

---

## Changes by Part

### Part 1 — Loading States

**New files:**
- `src/components/ui/LoadingSpinner.vue` — single source of truth for all spinner CSS. Props: `size?: 'sm' | 'md' | 'lg'`, `label?: string`. Uses `role="status"`, `aria-label`, `aria-hidden`. Sizes: 14 / 20 / 32 px.
- `src/components/ui/SkeletonCard.vue` — shimmer placeholder matching `QrHistoryCard` shape. `aria-hidden="true"`. Used in `LibraryView` while loading.

**Updated files:**
- `src/components/library/SaveQrButton.vue` — replaced inline spinner HTML/CSS with `<LoadingSpinner size="sm" />`.
- `src/components/moderation/AnalysisCard.vue` — replaced inline spinner with `<LoadingSpinner size="sm" label="Analyzing content" />`.
- `src/components/auth/LoginForm.vue` — added `<LoadingSpinner size="sm" />` inside submit button when `authStore.loading`.
- `src/components/auth/RegisterForm.vue` — same as above.
- `src/assets/auth-form.css` — added `display: inline-flex; align-items: center; justify-content: center; gap: 8px` to `.submit-btn` for spinner alignment.
- `src/views/LibraryView.vue` — replaced ad-hoc loading indicator with `<LoadingSpinner>` + three `<SkeletonCard>` placeholders during data fetch.

### Part 2 — Empty States

**New files:**
- `src/components/ui/EmptyState.vue` — reusable empty state. Props: `title: string`, `description?: string`. Slots: `#icon` (optional), `default` (action button). Uses `role="status"` and `aria-live="polite"`.

**Updated files:**
- `src/views/LibraryView.vue` — uses `<EmptyState>` for zero items and error states.
- `src/components/moderation/AnalysisCard.vue` — uses `<EmptyState title="No analysis yet">` when no result and not loading.

### Part 3 — Confirmation Dialog

**New files:**
- `src/components/ui/ConfirmDialog.vue` — uses native `<dialog>` element with `showModal()`. Features: built-in focus trap (browser), ESC key via `@cancel.prevent` event, `::backdrop` overlay, `aria-labelledby` + `aria-describedby`, `autofocus` on Cancel button (safe default).

**Updated files:**
- `src/components/qr/QrHistoryCard.vue` — replaced inline delete confirmation HTML with `<ConfirmDialog>`. Delete button has `aria-label="Delete QR code: ${item.title}"`. Rename input has `aria-label="New title for QR code"`.

### Part 4 — Toast Queue System

**Rewritten files:**
- `src/composables/useToast.ts` — queue-based API replacing single-toast API. Exports `ToastType = 'success' | 'error' | 'warning' | 'info'` and `ToastItem { id, message, type }`. `show(message, type, duration)` pushes to queue and auto-dismisses. `dismiss(id)` removes by ID.
- `src/components/ui/AppToast.vue` — accepts `toasts: ToastItem[]`, emits `dismiss: [id: string]`. Uses `<TransitionGroup>` for slide-in animation. `aria-live="assertive"` for screen readers.

**Updated files:**
- `src/views/GenerateView.vue` — updated to new toast API (`toasts`, `show`, `dismiss`).
- `src/views/ScanView.vue` — same.

### Part 5 — Offline Detection

**New files:**
- `src/composables/useNetworkStatus.ts` — listens to `window` `online`/`offline` events. Returns `isOnline: Ref<boolean>`. Registers and cleans up listeners via `onMounted`/`onUnmounted`.

**Updated files:**
- `src/views/GenerateView.vue` — imports `useNetworkStatus`. `watch(isOnline)` shows a `'warning'` toast when connectivity drops. `SaveQrButton :disabled` adds `|| !isOnline`. `saveToLibrary` guards with `isOnline.value` and returns early with a warning toast if offline.
- `src/views/ScanView.vue` — same pattern.
- `src/services/moderation/moderation.ts` — `navigator.onLine` check before Gemini call; returns `{ risk: 'unknown', summary: 'Content analysis skipped — device is offline.' }` immediately.

### Part 6 — Camera Edge Cases

**Updated files:**
- `src/types/scanner.types.ts` — added `'camera-disconnected'` and `'timeout'` to `ScannerErrorType` union.
- `src/constants/scanner.constants.ts` — added `SCAN_TIMEOUT_MS = 30_000`, error messages for `'camera-disconnected'` and `'timeout'`.
- `src/composables/useQrScanner.ts`:
  - 30-second `setTimeout` started after scanner enters `'scanning'` state (in `start()` and `resume()`), cleared on result or `stop()`.
  - `stopHardware()` private helper stops camera without resetting `status` to `'idle'`, so the error message remains visible with a retry button.
  - `handleDeviceChange()` on `navigator.mediaDevices.addEventListener('devicechange')`: calls `enumerateDevices()` and sets `'camera-disconnected'` error if no video inputs remain.

### Part 7 — Moderation Hardening

- Local moderation always runs first (unchanged from Sprint 7A).
- `moderation.ts` — blocks Gemini call if `local.matched` (content already blocked locally).
- `moderation.ts` — blocks Gemini call if `!navigator.onLine` (offline guard added Sprint 7B).
- Gemini never receives: locally blocked content or requests when device is offline.

### Part 8 — Accessibility

| Concern | Resolution |
|---|---|
| Spinner labels | `LoadingSpinner` uses `role="status"` + `aria-label` prop; `aria-hidden` when decorative |
| Empty state | `EmptyState` uses `role="status"` + `aria-live="polite"` |
| Toast | `AppToast` uses `aria-live="assertive"` + `role="alert"` per toast item |
| Delete confirmation | Native `<dialog>` + `showModal()` provides built-in focus trap; `autofocus` on Cancel |
| Library loading | `aria-live="polite"` + `aria-label` on loading container |
| Delete button | `aria-label="Delete QR code: ${item.title}"` |
| Rename input | `aria-label="New title for QR code"` |
| Auth submit | Spinner inside button; button `disabled` during loading prevents double-submit |

### Part 9 — Responsive QA

All views use CSS custom-property tokens and `max-width` containers. Verified breakpoints:

| Breakpoint | Layout |
|---|---|
| 375 px | Single-column library grid, full-width cards, paddings reduced to 16 px |
| 768 px | Auto-fill grid with `minmax(280px, 1fr)` |
| 1280 px | Wide auto-fill grid |

No horizontal overflow. Auth card collapses border-radius and horizontal padding at ≤ 480 px.

---

## Edge Cases Handled

| Scenario | Handling |
|---|---|
| Device goes offline mid-session | Warning toast; Save disabled; Gemini skipped |
| User tries to save while offline | Early-return warning toast |
| Scanner runs 30 s without detecting | Timeout error, camera stopped, retry available |
| Camera physically disconnected | `devicechange` event → `enumerateDevices()` check → error state |
| Camera permission revoked | Existing `mapScannerError` covers `NotAllowedError` |
| Locally blocked QR content | Gemini call skipped entirely |
| Library fetch fails | Error `EmptyState` with "Try again" button |
| Multiple rapid saves | `saving` flag disables button during in-flight request |
| Delete confirmation dismissed via ESC | `@cancel.prevent` fires `cancel` emit; dialog closes cleanly |

---

## Build & Lint Status

- `npm run build` — ✅ 0 errors, 0 warnings
- `npm run lint` — ✅ 0 errors, 0 warnings

---

## Remaining Technical Debt

- `QrScanner.vue` does not yet render different error messages for `'timeout'` vs `'camera-disconnected'` vs `'permission-denied'` — it shows a generic error. A follow-up should branch on `scanError.type` to show context-specific copy and retry affordances.
- `useToast` uses a module-level `seq` counter, which resets on HMR in dev. Functionally harmless (IDs remain unique per session), but worth noting.
- The `SkeletonCard` is hard-coded to match `QrHistoryCard` shape. If the card layout changes significantly, the skeleton needs updating in sync.
- No unit tests exist for `useNetworkStatus`, `useQrScanner` timeout/disconnect paths, or `ConfirmDialog` keyboard behavior. These are the highest-risk new paths.

---

## Potential Improvements

- Add `aria-describedby` to the offline `SaveQrButton` when disabled due to network, so screen readers announce *why* it's disabled.
- Support persistent toasts (duration = 0) with an explicit close button for critical warnings like "You are offline."
- Implement exponential-backoff retry in `useQrStore.loadLibrary()` for transient Firestore failures.
- Extract scanner error display into a dedicated `ScannerError.vue` component with type-specific messaging and icons.
- Add `navigator.permissions.query({ name: 'camera' })` polling to detect revoked permissions between sessions without requiring a failed `getUserMedia` call.

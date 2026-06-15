# PROJECT_PLAN.md

---

## Project Objective

Build a responsive, production-ready web application that allows users to generate
QR codes from various input types, scan QR codes using their device camera, and
manage a personal QR code library — enhanced by AI-powered content analysis via
the Google Gemini API and backed by Firebase for authentication and data storage.

---

## Functional Requirements

### Authentication
- Users can create an account with email and password
- Users can log in and log out
- Authenticated state persists across page refreshes
- Unauthenticated users are redirected to the login page

### QR Code Generation
- Users can generate a QR code from: a URL, plain text, or Wi-Fi credentials
- Users can preview the generated QR code in real time
- Users can download the QR code as a PNG image

### QR Code Scanning
- Users can scan a QR code using their device camera
- Users can upload an image file to scan instead of using the camera
- Decoded content is displayed immediately after a successful scan
- The app handles camera permission denial gracefully

### AI Analysis (Gemini API)
- After a QR code is decoded, the app sends its content to Gemini for analysis
- Gemini returns a plain-language summary of what the decoded content represents
- URLs are classified as safe, suspicious, or unknown
- AI results are displayed alongside the decoded content

### QR Code Library
- Authenticated users can save any generated or scanned QR code to their library
- Users can label saved QR codes with a custom name
- Users can delete QR codes from their library
- The library is paginated and sorted by most recent

### General
- The app is fully responsive across mobile (375px), tablet (768px), and desktop (1280px+)
- The app supports light and dark mode following system preference
- All loading states, error states, and empty states are handled

---

## Milestones

| # | Milestone | Description |
|---|---|---|
| 1 | Project Initialization | Tooling, folder structure, plugins, env setup |
| 2 | Authentication | Firebase Auth — login, register, route guards |
| 3 | QR Code Generation | Generator UI, input types, download |
| 4 | QR Code Scanning | Camera scanning, image upload fallback |
| 5 | Gemini AI Integration | Content analysis, URL classification |
| 6 | QR Code Library | Firestore persistence, library view |
| 7 | UI Polish | Loading/error/empty states, accessibility, responsive QA |
| 8 | Testing & Deployment | Unit tests, Firebase Hosting deploy |

---

## Progress Checklist

### Milestone 1 — Project Initialization
- [x] Install ESLint (flat config) + Prettier; add `lint` and `format` scripts
- [x] Create `eslint.config.js` and `.prettierrc`
- [x] Configure `@/` path alias in `vite.config.ts` and `tsconfig.app.json`
- [x] Create `src/` folder structure (views, router, stores, composables, services, types, utils, constants)
- [x] Install Vue Router; create `src/router/index.ts`; register in `main.ts`
- [x] Install Pinia; register in `main.ts`
- [x] Install Firebase SDK; create `src/services/firebase.ts` stub
- [x] Create `.env.example` with all required variable names
- [ ] Initialize git repository

### Milestone 2 — Authentication
- [ ] Enable Email/Password auth in Firebase console
- [x] `src/services/auth.ts` — signUp, signIn, signOut, onAuthStateChanged
- [x] `src/stores/useAuthStore.ts` — reactive user, loading, and error state
- [x] `src/stores/useAuthStore.ts` — isReady, isAuthenticated, clearError(); enumeration fix
- [x] `src/views/LoginView.vue` and `src/views/RegisterView.vue`
- [x] `src/components/auth/LoginForm.vue` — email, password, show/hide, validation, error, loading
- [x] `src/components/auth/RegisterForm.vue` — email, password, confirm, validation, error, loading
- [x] `src/constants/auth.constants.ts` — shared EMAIL_RE regex
- [x] `src/assets/auth-form.css` — shared auth form styles (CSS deduplication)
- [x] `src/App.vue` — auth observer initialized at app startup
- [ ] Navigation guard in `src/router/index.ts` — redirect unauthenticated users
- [ ] Auth state hydrates before first render (no flash of login screen)

### Milestone 3 — QR Code Generation
- [x] Research and install a QR generation library (`qrcode` + `@types/qrcode`)
- [x] `src/services/qrGenerator.ts` — generateDataUrl, generateCanvas, JSDoc, MAX_QR_LENGTH guard
- [x] `src/components/qr/QRPreview.vue` — single watch (flush:post), canvas clear, loading, error, race guard, aria-label
- [x] `src/utils/downloadCanvas.ts` — toBlob with toDataURL fallback, Promise<void>
- [x] `src/constants/qr.constants.ts` — DEFAULT_QR_SIZE, DEFAULT_QR_MARGIN, MAX_QR_LENGTH, DEFAULT_FILENAME
- [x] `src/types/qr.types.ts` — QrOptions, QRContentType
- [x] `src/router/index.ts` — /generate route added
- [x] `src/services/formatters/` — textFormatter, urlFormatter, emailFormatter, phoneFormatter, wifiFormatter, index
- [x] `src/composables/useQrGenerator.ts` — content type dispatch, per-type input state, canGenerate, formError
- [x] `src/views/GenerateView.vue` — type selector, dynamic forms (text/URL/email/phone/Wi-Fi), validation, QR preview, Download PNG
- [ ] Character count warning colour when approaching MAX_QR_LENGTH (counter visible, colour deferred)

### Milestone 4 — QR Code Scanning
- [x] Research and install a QR scanning library (`html5-qrcode`)
- [x] `src/types/scanner.types.ts` — ScannerStatus, ScannerErrorType, ScannerError
- [x] `src/constants/scanner.constants.ts` — SCANNER_ELEMENT_ID, SCANNER_FPS, SCANNER_QR_BOX_RATIO, error messages
- [x] `src/services/qrScanner.ts` — createQrScanner handle, mapScannerError, error classification
- [x] `src/composables/useQrScanner.ts` — status machine, start/stop/pause/resume, onUnmounted cleanup
- [x] `src/components/qr/QrScanner.vue` — camera viewport, overlays, controls, detected/cleared emits
- [x] `src/views/ScanView.vue` — page layout, detectedText state (extension point for Gemini)
- [x] `src/router/index.ts` — /scan route added
- [x] Handle camera permission denied, camera unavailable, no camera, unsupported browser
- [x] `src/services/scanner/normalizer.ts` — trim, URL casing, mailto/tel/WIFI prefix normalization, space collapse
- [x] `src/services/scanner/contentDetector.ts` — detect text/url/email/phone/wifi/unknown; reuses formatter validators
- [x] `src/services/scanner/scanResult.ts` — ScanResult interface + createScanResult factory
- [x] Formatter exports — isValidUrl, isValidEmail, isValidPhone, isWifiPayload (no regex duplication)
- [x] `useQrScanner.ts`, `QrScanner.vue`, `ScanView.vue` updated to use ScanResult throughout
- [ ] Scan timeout (no QR detected within time limit) — deferred to Milestone 7
- [ ] Fallback: image upload scanning via Html5Qrcode.scanFile()

### Milestone 5 — Gemini AI Integration
- [ ] Install `@google/generative-ai` SDK
- [ ] `src/services/gemini.ts` — send content string, return analysis object
- [ ] Define `GeminiAnalysis` type in `src/types/`
- [ ] Classify URLs as safe / suspicious / unknown
- [ ] Generate plain-language content summary
- [ ] Display AI result card in `ScanView.vue`
- [ ] Handle Gemini errors (quota, network) without breaking the scan flow

### Milestone 6 — QR Code Library
- [x] Design Firestore schema: `users/{uid}/qrcodes/{docId}` — all required fields defined
- [x] `src/types/qrHistory.types.ts` — QrHistoryItem, QrType, QrSource, AiRisk, QrHistoryInput
- [x] `src/services/firestore.ts` — saveQr, listQrs, deleteQr, updateQrTitle
- [x] `src/stores/useQrStore.ts` — items, loading, error; loadLibrary, save, remove, rename
- [x] `src/utils/formatDate.ts` — Intl.DateTimeFormat date helper
- [x] `src/constants/library.constants.ts` — QR_TYPE_LABELS, QR_SOURCE_LABELS, AI_RISK_LABELS, LIBRARY_RENAME_MAX_LENGTH
- [x] `src/components/qr/QrHistoryCard.vue` — card with inline rename + delete confirmation
- [x] `src/views/LibraryView.vue` — responsive grid, loading/error/empty states
- [x] `src/router/index.ts` — /library route added; beforeEach auth guard with isReady wait
- [x] Inline label editing per QR code
- [x] Delete confirmation before removing a QR code
- [ ] "Save to Library" button in GenerateView and ScanView (Sprint 6B)
- [ ] Firestore security rules (`firestore.rules`)
- [ ] Pagination (deferred)

### Milestone 7 — UI Polish
- [ ] Global loading spinner / skeleton component
- [ ] Global error toast / notification system
- [ ] Empty state illustrations for library and scan result
- [ ] Responsive layout QA: 375px, 768px, 1280px
- [ ] Dark mode QA across all views
- [ ] Keyboard navigation and focus management
- [ ] ARIA labels and roles on interactive elements
- [ ] Color contrast passes WCAG AA

### Milestone 8 — Testing & Deployment
- [ ] Unit tests for all composables
- [ ] Unit tests for service functions (mocked Firebase and Gemini)
- [ ] `firebase.json` and `.firebaserc` setup
- [ ] `npm run build` succeeds with zero type errors
- [ ] Production `.env` configured in Firebase Hosting environment
- [ ] Final deployment to Firebase Hosting
- [ ] Smoke test on production URL

---

## Current Status

**Active milestone:** Milestone 6 — QR Code Library (Sprint 6A complete)

### Completed
- Vue 3 + Vite + TypeScript scaffold
- `index.html` with viewport meta, responsive baseline
- `style.css` with CSS custom properties and dark mode
- `CLAUDE.md` and `PROJECT_PLAN.md`
- `src/` folder structure: assets, components, composables, constants, layouts, plugins, router, services, stores, types, utils, views
- ESLint v9 (flat config) + Prettier configured; `lint`, `lint:fix`, and `format` scripts added
- `@/` path alias in `vite.config.ts` and `tsconfig.app.json`
- Vue Router 5 installed; `src/router/index.ts` with home, login, register routes; registered in `main.ts`
- Pinia installed; registered in `main.ts`
- Firebase SDK installed; `src/services/firebase.ts` exports `app`, `auth`, `db`, `storage`
- `.env.example` with all `VITE_` variable names
- Placeholder views: `HomeView.vue`, `LoginView.vue`, `RegisterView.vue`
- `npm run build` passes — 6 chunks, zero errors
- **Milestone 2 (infrastructure):** `src/services/auth.ts` — signUp, signIn, signOut, observeAuthState
- **Milestone 2 (infrastructure):** `src/stores/useAuthStore.ts` — currentUser, loading, error; login(), register(), logout()
- **Milestone 2 (UI):** `src/components/auth/LoginForm.vue` and `RegisterForm.vue` — full validation, a11y, loading/error states
- **Milestone 2 (UI):** `src/views/LoginView.vue` and `RegisterView.vue` — layout wrappers
- **Milestone 2 (review fixes):** isReady + isAuthenticated + clearError in store; user-enumeration fix; EMAIL_RE constant; shared auth-form.css; named-route navigation; aria-pressed on eye buttons; observer started in App.vue
- **Milestone 3 (core):** qrcode library; qrGenerator.ts service; QRPreview.vue component; downloadCanvas.ts utility; GenerateView.vue with plain-text QR generation and PNG download
- **Milestone 3 (refactor):** qr.constants.ts; qr.types.ts (QrOptions, QRContentType); single-watch QRPreview; toBlob download; MAX_QR_LENGTH guard; JSDoc on service functions
- **Milestone 3 (Sprint 4B):** formatter layer (text/URL/email/phone/Wi-Fi); useQrGenerator composable; GenerateView multi-format UI; race guard + aria-label on QRPreview
- **Milestone 4 (core):** html5-qrcode; scanner types/constants/service; useQrScanner composable; QrScanner.vue with status machine; ScanView.vue; /scan route
- **Milestone 4 (pipeline):** normalizer.ts, contentDetector.ts, scanResult.ts; ScanResult type flows through composable → component → view; formatter validators reused without regex duplication
- **Milestone 6 (Sprint 6A):** Firestore schema, firestore.ts service, useQrStore Pinia store, QrHistoryCard component, LibraryView, /library protected route with auth guard

### Remaining in Milestone 1
- Initialize git repository (`git init`)

---

## Next Milestone

**Milestone 6 — Sprint 6B: Save to Library**

Wire the `useQrStore.save()` action into `GenerateView.vue` (after generating)
and `ScanView.vue` (after scanning). Add a "Save to Library" button to each view.
Deploy Firestore security rules.

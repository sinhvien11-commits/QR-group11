# LIBRARY_INTEGRATION_REVIEW.md

Sprint 6B — Save to Library Integration Review

---

## Architecture

### New files

| File | Role |
|---|---|
| `src/utils/detectQrType.ts` | Pure function: maps any string to a `QrType` using existing `detectContentType` from the scanner pipeline. Falls back to `'text'` for unrecognised content. |
| `src/composables/useToast.ts` | Composable that manages local toast state (message, type, visibility, auto-dismiss timer). One instance per view. |
| `src/components/ui/AppToast.vue` | Presentational toast component. Props: `message`, `type`, `visible`. Emits `dismiss`. Uses `<Transition>` for fade-in/out. No external library. |
| `src/components/library/SaveQrButton.vue` | Reusable button with `loading` and `disabled` props and a `save` emit. Shows a CSS spinner while saving. Used by both Generator and Scanner. |

### Modified files

| File | Change |
|---|---|
| `src/constants/library.constants.ts` | Added `QR_DEFAULT_TITLES` — a `Record<QrType, string>` mapping each type to its human-readable default title (Website, Text, Email, Phone, WiFi). |
| `src/views/GenerateView.vue` | Added `saveToLibrary()`, wired to `SaveQrButton` and `AppToast`. Save section shown only when `qrText && canvasForDownload` are both set. |
| `src/views/ScanView.vue` | Added `saveToLibrary()`, wired to `SaveQrButton` and `AppToast`. Save section shown only when `detectedText` is set. `geminiLoading` ref keeps the disable guard in place for Sprint 6C. |
| `eslint.config.js` | Added `globals.browser` to language options, fixing a pre-existing `no-undef` false-positive on `HTMLCanvasElement`. |

---

## Flow Diagrams

### Generator Save Flow

```
User fills form
  → clicks Generate
    → useQrGenerator.generate() formats content → qrText is set
      → QRPreview renders canvas → emits "generated" → canvasForDownload is set
        → [Save to Library] button appears
          → user clicks Save
            → saveToLibrary() called
              → guard: qrText must not be empty
              → saving = true  →  button disabled + spinner
              → useQrStore.save({ title, content, type, source:'generator', aiRisk:null, aiSummary:null })
                → firestore.ts: addDoc to users/{uid}/qrcodes
                → useQrStore.items.unshift(...)  ← Library view updates instantly
              → saving = false
              → success: AppToast "QR saved successfully."
              → error:   AppToast "Unable to save QR."
```

### Scanner Save Flow

```
User starts camera
  → html5-qrcode detects QR → QrScanner emits "detected" → ScanView.handleDetected()
    → detectedText is set  ← QrScanner shows decoded text in its own result panel
      → [Save to Library] button appears in ScanView
        ← button disabled while geminiLoading (placeholder for Sprint 6C)
          → user clicks Save
            → saveToLibrary() called
              → detectQrType(detectedText.normalized) → QrType
              → useQrStore.save({ title, content, type, source:'scanner', aiRisk:null, aiSummary:null })
                → firestore.ts: addDoc
                → useQrStore.items.unshift(...)  ← Library updates instantly
              → success / error toast
  → user clicks Scan Again → QrScanner emits "cleared" → detectedText = null → button hidden
```

### Library Refresh Flow

```
useQrStore.save()
  → saveQr(uid, input)         ← Firestore write
  → items.value.unshift(...)   ← local reactive prepend (no re-fetch needed)
    → LibraryView v-for re-renders with new item at top
```

No page reload. No explicit `loadLibrary()` call required after save.

---

## Strengths

- **Zero code duplication.** `SaveQrButton` is one component used in both views. `detectQrType` wraps the existing `detectContentType` rather than re-implementing detection logic.
- **Instant library update.** `useQrStore.save()` prepends to `items` optimistically before the Firestore round-trip is even confirmed. The Library view reflects the save immediately.
- **Clean separation of concerns.** No Firestore code touches Vue components. The call chain is View → Store → Service, matching the established pattern.
- **Gemini hook already in place.** `geminiLoading` ref in `ScanView` means Sprint 6C (Gemini integration) only needs to bind that ref to the analysis state — no structural changes to the save flow.
- **Lightweight toast.** Pure CSS transition, no third-party library, scoped styles, ARIA `role="alert"` for accessibility.
- **Type safety throughout.** `QrType` and `QRContentType` are structurally identical unions, so no unsafe assertions are needed. `detectQrType` narrows `'unknown'` to `'text'` at the boundary.
- **Pre-existing lint issue fixed.** Adding `globals.browser` to the ESLint config eliminated the `no-undef` false-positives on `HTMLCanvasElement` that affected both `QRPreview.vue` and `GenerateView.vue`.

---

## Technical Debt

- **No duplicate-save prevention.** A user can click "Save to Library" multiple times and create duplicate entries. A post-save disable or navigation away would prevent this.
- **Optimistic insert without rollback.** If `saveQr()` fails after the `unshift`, the item is already in local state. The current code catches the error and shows a toast, but does not remove the ghost item from `items`. (In practice the store's `save()` inserts only on success, so this is not a current bug — but the order of operations is worth noting for future maintainers.)
- **`aiRisk: null` and `aiSummary: null` for scanner items.** Until Milestone 5 (Gemini) is complete, every scanned item is saved without AI metadata. These fields must be back-filled when Gemini integration lands.
- **Default title is not user-editable at save time.** The user can rename in the Library, but cannot customise the title before saving. A title input in the save flow would improve the UX.
- **Toast is view-local.** Each view creates its own `useToast()` instance. If a global notification system is added in Milestone 7, these local instances should be replaced to avoid duplication.
- **`geminiLoading` is a static `false` ref.** It is a named placeholder; until it is wired to real Gemini state it conveys intent only in comments.

---

## Possible Improvements

- **Prevent duplicate saves.** After a successful save, disable the button or swap its label to "Saved ✓" until the user scans a new QR or generates a new code.
- **Title prompt before saving.** Show a short inline input above the save button so the user can customise the title without going into the Library rename flow.
- **Global toast / notification store.** Centralise toast state in a Pinia store so any view or composable can trigger a notification without carrying its own `useToast()` instance. This aligns with the Milestone 7 plan.
- **Rollback on save failure.** If the Firestore write fails, remove the prepended item from `items` to keep local and remote state consistent.
- **Skeleton or optimistic indicator in LibraryView.** Items saved with a `null` aiRisk could show a "pending analysis" badge, making it clear that AI metadata will appear once Gemini runs.
- **Firestore security rules (Sprint 6B remaining item).** Rules currently default to open. Locking down `users/{uid}/qrcodes` to authenticated reads/writes of the owner is a security prerequisite before production deployment.

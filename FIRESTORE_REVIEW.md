# Firestore QR Library — Sprint 6A Review

**Date:** 2026-06-15
**Scope:** Firestore persistence layer, Pinia store, library view, protected routing.

---

## Architecture

```
LibraryView.vue
└── QrHistoryCard.vue (per-item UI)
     useQrStore.ts (Pinia)
          └── firestore.ts (service)
               └── Firestore SDK (firebase/firestore)
```

| Layer | Responsibility |
|---|---|
| `qrHistory.types.ts` | Shared types: QrHistoryItem, QrType, QrSource, AiRisk |
| `firestore.ts` | Raw Firestore CRUD — no Vue, no Pinia |
| `useQrStore.ts` | Reactive state, error handling, uid resolution |
| `QrHistoryCard.vue` | Single-item UI with inline rename and delete confirm |
| `LibraryView.vue` | Page layout, loading/error/empty states, card grid |
| `router/index.ts` | `/library` route + `beforeEach` auth guard |

---

## Firestore Schema

```
users/{uid}/qrcodes/{docId}
├── title        string
├── content      string
├── type         'text' | 'url' | 'email' | 'phone' | 'wifi'
├── source       'generator' | 'scanner'
├── aiRisk       'safe' | 'suspicious' | 'unknown' | null
├── aiSummary    string | null
├── createdAt    Timestamp (serverTimestamp)
└── updatedAt    Timestamp (serverTimestamp)
```

The `id` field is stored as the Firestore document ID, not as a document field. The service layer reconstructs `id` from `docSnap.id` when reading.

All timestamps use `serverTimestamp()` on write so the ordering query (`orderBy('createdAt', 'desc')`) is always consistent regardless of client clock drift.

---

## Key Design Decisions

### 1. Service layer owns no state — store owns no Firestore API

`firestore.ts` imports from `firebase/firestore` and `@/services/firebase`. It has no Vue reactivity, no Pinia references, no error messages. Every function takes explicit arguments (uid, docId, etc.) and returns plain TypeScript values or throws on failure.

`useQrStore.ts` never imports from `firebase/firestore` directly. All Firestore interactions flow through the service layer. This makes the service swappable (e.g., replacing Firestore with a REST API) without touching the store.

### 2. `uid()` resolved inside actions, not at store creation

The `uid()` helper inside `useQrStore` calls `useAuthStore()` on demand rather than capturing it at store creation. This avoids a potential circular dependency issue (both stores being created in the same tick during app startup) and makes the dependency explicit per-action rather than implicit in the store definition.

### 3. Auth guard waits for `isReady`

The `beforeEach` guard in `router/index.ts` waits for `authStore.isReady` before checking `isAuthenticated`. This is necessary because Firebase's `onAuthStateChanged` callback fires asynchronously — there is a brief window on first page load where the auth state is unknown. Without this wait, a logged-in user navigating directly to `/library` would be incorrectly redirected to `/login`.

The `{ immediate: true }` option on `watch` handles the case where `isReady` is already `true` by the time the watch is created — in this case, the callback fires synchronously and the Promise resolves immediately.

### 4. Optimistic local state for `save()` and `remove()`

`save()` inserts into `items` with a local `new Date()` rather than waiting for the server timestamp. This means the stored `createdAt` is a local clock time, not the Firestore server time. After a `loadLibrary()` call, the correct server timestamps replace the local values.

`remove()` filters the item out of `items` immediately. If the Firestore call fails, the error propagates to the caller but the local state is already updated. This is an accepted trade-off; a production implementation would use rollback on failure.

### 5. System-boundary `as` assertions in `listQrs`

Firestore returns `DocumentData` (an `any`-typed map). The `listQrs` function uses `as QrType`, `as QrSource`, and `as AiRisk | null` to convert raw document data to typed values. This is the only file in the codebase that uses `as` assertions — it is justified because Firestore is a system boundary. Runtime validation is deferred to a future sprint (TD-3).

### 6. Timestamp conversion via `toDate()`

A private `toDate(value: unknown): Date` function in `firestore.ts` safely converts Firestore `Timestamp` instances (returned on read) and falls back to `new Date()` if the value is missing or unexpected. This handles the edge case where `serverTimestamp()` fields return `null` inside transactions or immediately after a write before the server acknowledges.

### 7. Inline rename and delete confirmation in `QrHistoryCard.vue`

Both interactions are handled entirely within the card component:
- Rename: toggles to an `<input>` + Save/Cancel buttons; emits `rename` event on confirm
- Delete: toggles to a confirmation UI with Yes/Cancel; emits `delete` event on confirm

`LibraryView.vue` handles the emitted events by calling store actions. The card itself has no knowledge of Firestore or Pinia.

### 8. Responsive grid with `auto-fill`

`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` adapts to any viewport width without explicit breakpoints. At 375px the grid produces a single column. At 1280px it produces 4 columns. No explicit `@media` breakpoints are needed for the grid.

---

## Strengths

1. **Clean three-layer separation.** Service → Store → View. Each layer imports downward only. No upward dependencies.

2. **No magic strings.** `QrType`, `QrSource`, `AiRisk` are TypeScript union types. `QR_TYPE_LABELS`, `QR_SOURCE_LABELS`, `AI_RISK_LABELS` are `Record<Union, string>` — TypeScript enforces that every variant has a label.

3. **Auth guard is correct for the async Firebase pattern.** Waiting for `isReady` before checking `isAuthenticated` prevents the flash-of-login-screen race condition. The guard also uses `{ name: 'login' }` (named route) so renaming the login path doesn't break the redirect.

4. **`LibraryView.vue` is pure presentation.** It calls store actions and renders store state. All business logic (Firestore, uid, error messages) lives in the store and service layers.

5. **`QrHistoryCard.vue` is fully self-contained.** The rename and delete flows are local state in the card. Parent only sees the final events (`rename`, `delete`). This makes the card reusable and independently testable.

6. **`AI_RISK_LABELS` is type-safe.** Using `Record<AiRisk, string>` means TypeScript will error if a new `AiRisk` variant is added without updating the labels map.

---

## Known Issues and Technical Debt

### TD-1 — No Firestore security rules defined

The implementation assumes Firestore is accessible. Without security rules (`users/{uid}/qrcodes/{docId}` locked to the authenticated user), any user can read/write any other user's documents. Firestore rules must be deployed before production.

**Fix (Milestone 8):** Add `firestore.rules` with:
```
match /users/{uid}/qrcodes/{docId} {
  allow read, write: if request.auth.uid == uid;
}
```

### TD-2 — No Firestore index for `createdAt` query

`listQrs` uses `orderBy('createdAt', 'desc')`. Firestore may require a composite index for this query if additional filters are added later (e.g., filtering by `type`). For the current single-field sort, no explicit index is required.

**Fix (Sprint 6B):** When filtering is added, create the index via the Firebase console or `firestore.indexes.json`.

### TD-3 — No runtime validation of Firestore data

`listQrs` trusts that Firestore documents match the `QrHistoryItem` schema. If a document has a missing or mistyped field (e.g., `type: 'legacy'`), the cast will produce an invalid `QrHistoryItem` without any error.

**Fix (Milestone 8):** Add a `parseQrHistoryItem(data)` function with a type guard that validates all fields. Return `null` for invalid documents and filter them out of the results.

### TD-4 — Optimistic `save()` uses local timestamp

`save()` uses `new Date()` instead of the server timestamp, so the item appears at the top of the list with a slightly different timestamp than what Firestore stores. After `loadLibrary()` is called, the server timestamp overwrites the local one.

**Fix (Sprint 6B):** After `addDoc` returns, use the document reference to read the server-committed timestamp. Or use `onSnapshot` instead of `getDocs` to get live updates including the committed timestamps.

### TD-5 — No save button in the current UI

`useQrStore.save()` is implemented but no view currently calls it. `LibraryView.vue` only reads the library. The save action will be wired up in Sprint 6B when the "Save to Library" button is added to `GenerateView.vue` and `ScanView.vue`.

### TD-6 — `remove()` and `rename()` have no error handling in the view

If `handleRename` or `handleDelete` fail (e.g., Firestore write fails), the error is silently swallowed. The store would throw but `LibraryView.vue` calls actions with `void` and doesn't handle rejections.

**Fix (Sprint 6B):** Add per-action error state to the store, or emit error events to a global notification system (Milestone 7).

### TD-7 — No `createdAt` composite index requirement documented

The Firestore `orderBy('createdAt', 'desc')` query on the subcollection `users/{uid}/qrcodes` works without a composite index as long as no `where` filters are combined with it. This is a fragile assumption once filtering is added.

**Fix:** Track index requirements in `firestore.indexes.json` from the start.

---

## Suggestions Before Sprint 6B

1. **Wire `save()` from `GenerateView.vue` and `ScanView.vue`.** After generating or scanning a QR, show a "Save to Library" button that calls `qrStore.save(input)`. The `QrHistoryInput` type is already fully defined.

2. **Deploy Firestore security rules immediately.** Any test against a real Firebase project without rules is a security risk. Rules are a 5-minute task and should block any demo or testing.

3. **Consider `onSnapshot` for real-time sync.** `listQrs` uses `getDocs` (a one-time fetch). If the library is ever open in two tabs simultaneously, changes in one tab won't appear in the other. `onSnapshot` with a store-managed `unsubscribe` would solve this and also fix the TD-4 timestamp issue.

4. **Add `updatedAt` display on hover or in an expanded view.** Currently only `createdAt` is shown. Renamed items have an updated `updatedAt` but no UI reflects this.

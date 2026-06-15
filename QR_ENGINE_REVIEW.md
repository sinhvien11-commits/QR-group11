# QR Engine — Refactor Review

**Date:** 2026-06-15
**Scope:** Milestone 3 refactor of the QR generation core before Sprint 4B expansion.

---

## Improvements Made

### 1. Constants extracted — `src/constants/qr.constants.ts`

All magic values are now named and documented in one place:

| Constant | Value | Purpose |
|---|---|---|
| `DEFAULT_QR_SIZE` | `256` | Canvas pixel width |
| `DEFAULT_QR_MARGIN` | `2` | Quiet zone width (QR modules) |
| `MAX_QR_LENGTH` | `2953` | Max chars before QR v40 limit |
| `DEFAULT_FILENAME` | `'qrcode.png'` | Download filename |

Previously the values `256`, `2`, and `'qrcode.png'` appeared inline with no explanation. A change to any one required grep-and-replace across multiple files.

---

### 2. Shared QR types — `src/types/qr.types.ts`

`QrOptions` was moved from `qrGenerator.ts` (a service file) into the designated `src/types/` folder per project conventions. This makes the type independently importable without pulling in the service module.

`QRContentType` is now defined:

```typescript
export type QRContentType = 'text' | 'url' | 'email' | 'phone' | 'wifi'
```

No UI uses it yet, but the type is available for the input-type selector and the store when Sprint 4B adds multi-format support.

---

### 3. `qrGenerator.ts` — framework-independent, guarded, documented

Three improvements:

**JSDoc on all exports.** Each exported function now has a one-line summary of its contract, including the fact that it throws on oversized input.

**`MAX_QR_LENGTH` guard via `assertLength`.** A private helper throws a descriptive `Error` before calling the `qrcode` library if the input exceeds 2953 characters. This protects the library from silently truncating or corrupting large inputs. The service catches this in the same `catch` branch as any other library error, so the component shows "Failed to generate QR code." without exposing the raw error.

**Imports from shared files.** The service no longer owns its own constants or type definitions.

The service remains completely framework-independent — no Vue imports, no DOM references.

---

### 4. `QRPreview.vue` — single watch, canvas cleared, no stale renders

**Single `watch` with `{ immediate: true, flush: 'post' }`.** The previous implementation used `onMounted` plus two separate `watch()` calls (one for `text`, one for `size`). This is consolidated into:

```typescript
watch(
  [() => props.text, () => props.size],
  ([newText, newSize], prevValues) => {
    if (prevValues && newText === prevValues[0] && newSize === prevValues[1]) return
    void renderQr()
  },
  { immediate: true, flush: 'post' },
)
```

`flush: 'post'` is the key: it defers the first callback until after the component's initial DOM update, ensuring `canvasRef.value` is a real `HTMLCanvasElement` before `renderQr` is called. Without this, `{ immediate: true }` fires synchronously during `setup()` before the canvas is mounted, and the canvas ref is `null`.

**Explicit no-op guard.** The `prevValues` comparison stops redundant regeneration if a parent re-renders but the prop values have not changed. Vue's own equality check already prevents this for primitive values, but the guard makes the intent self-documenting and protects against future refactors that might pass new prop references.

**Canvas cleared on empty input.** When `props.text` becomes empty, `clearCanvas()` erases the canvas pixels via `ctx.clearRect(...)` before hiding it. The previous implementation only reset the `hasGenerated` flag, leaving stale pixel data in the DOM (invisible but memory-resident and detectable via DevTools or assistive technology that reads canvas content).

---

### 5. `downloadCanvas.ts` — `toBlob` preferred, `toDataURL` fallback

```typescript
export function downloadCanvas(canvas, filename): Promise<void> {
  if (typeof canvas.toBlob === 'function') {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => { ... }, 'image/png')
    })
  }
  // fallback
  ...
  return Promise.resolve()
}
```

`canvas.toBlob()` is asynchronous and produces a `Blob` from which a short-lived `object URL` is created. The `object URL` is revoked immediately after the click, avoiding memory leaks. `toDataURL()` synchronously encodes the entire image as a base-64 string in the main thread, which blocks the UI for large canvases and produces a string that is many times larger than the raw binary.

The return type changed from `void` to `Promise<void>`. `GenerateView.vue` was updated to `await` the call accordingly. No user-visible behaviour changed.

---

## Remaining Technical Debt

### TD-1 — No character count UI for `MAX_QR_LENGTH`
The guard in the service throws when input exceeds 2953 characters, but the component shows only the generic "Failed to generate QR code." message. Users have no way to know they exceeded the limit.

**Fix (Sprint 4B or Milestone 7):** Add a character counter below the textarea using `MAX_QR_LENGTH`. Disable the Generate button and show a specific message when the limit is exceeded.

### TD-2 — `generateDataUrl` is unused
`generateDataUrl` was implemented as part of the service contract but is not called by any component. It exists as a forward-looking export for features like clipboard copy or social sharing.

**Fix:** Leave as-is until needed. If Sprint 4B or later milestones don't use it, consider removing it to reduce surface area.

### TD-3 — `QRPreview` has no `alt`-equivalent for the canvas
The `<canvas>` element has no fallback text content and no `aria-label`. Screen readers cannot describe its visual content. This is acceptable for a Milestone 3 delivery but must be addressed before Milestone 7 accessibility QA.

**Fix:** Add a text child to the `<canvas>` element or use `aria-label` to describe the QR code content dynamically. Example:
```html
<canvas ref="canvasRef" :aria-label="hasGenerated ? `QR code for: ${text}` : undefined">
```

### TD-4 — No race-condition guard in `renderQr`
If `props.text` changes while a previous `generateCanvas` call is still in-flight (e.g., user clicks Generate twice in quick succession), both calls run concurrently and the second may complete before the first, leaving a stale QR on screen.

**Fix (before multi-format Sprint):** Use an `AbortController` pattern or a generation sequence counter to discard results from superseded calls:
```typescript
let seq = 0
async function renderQr(): Promise<void> {
  const current = ++seq
  // ... await generateCanvas(...)
  if (current !== seq) return  // superseded
  hasGenerated.value = true
}
```

### TD-5 — `downloadCanvas` error is silently swallowed in `GenerateView`
`downloadCanvas` now returns `Promise<void>` and can reject (e.g., if `toBlob` returns a null blob). `GenerateView.download()` awaits it but has no `try/catch`. A failed download would produce an unhandled promise rejection in the console.

**Fix:** Wrap the `await` in `GenerateView.download()` with a `try/catch` and surface the error to the user once the global notification system exists (Milestone 7).

### TD-6 — `QRContentType` is defined but no store or component uses it
The type is correctly placed in `qr.types.ts` for Sprint 4B, but there is no enforcement that `GenerateView` passes a `contentType` to `QRPreview`. When multi-format support is added, the component interface will need updating.

**Fix (Sprint 4B):** Add a `contentType: QRContentType` prop to `QRPreview` and `GenerateView`, and pass it through to the service when content-type-specific encoding is needed.

---

## Suggestions Before Sprint 4B

1. **Implement TD-4 (race guard) before adding more content types.** Multi-format generation will make rapid regeneration more likely (switching between URL, text, Wi-Fi inputs). The fix is small and prevents subtle bugs.

2. **Add TD-3 (`aria-label` on canvas) as a one-liner now.** It is the only accessibility gap in the QR module and is trivial to fix.

3. **Decide on `QRContentType` prop design before adding input type selectors.** If the content type selector goes in `GenerateView` (most likely), `QRPreview` doesn't need to know about it — the parent builds the formatted string and `QRPreview` just encodes it. If `QRPreview` receives `contentType` as a prop, it is responsible for formatting. Choose one ownership model before Sprint 4B to avoid the interface changing twice.

4. **Consider a `useQrGenerator` composable.** When content-type formatting, validation, and error handling are added to `GenerateView`, the view will grow past 150 lines. Extracting state and logic into `src/composables/useQrGenerator.ts` would keep the view as a layout-only component, consistent with the auth pattern.

5. **Wire the Generate button to keyboard `Enter` in the textarea.** Currently, pressing Enter in the textarea inserts a newline (correct for multi-line input). A `Ctrl+Enter` or `Cmd+Enter` shortcut to trigger Generate would improve usability without changing the current UX.

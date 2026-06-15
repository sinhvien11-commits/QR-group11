# QR Branding Review — Sprint 8A

## Summary

Sprint 8A adds a branded logo overlay to the QR preview canvas, three export paths (PNG, SVG, Copy to Clipboard), a consistent `group11-{type}-{date}` filename scheme, QR styling options (foreground, background, margin, error correction), and full aria-label coverage on all export controls.

---

## Architecture

### New files

| File | Responsibility |
|---|---|
| `src/assets/logo/group11.png` | 256×256 brand logo (purple circle, "G11" text) |
| `src/utils/overlayLogo.ts` | Paints white rounded background + logo onto an existing canvas |
| `src/utils/qrExport.ts` | `downloadQrPng`, `downloadQrSvg`, `copyQrToClipboard`, `buildExportFilename` |

### Modified files

| File | Change |
|---|---|
| `src/types/qr.types.ts` | Extended `QrOptions` with `foreground`, `background`, `margin`, `errorCorrectionLevel` |
| `src/constants/qr.constants.ts` | Added `DEFAULT_QR_ERROR_CORRECTION = 'H'`, `DEFAULT_QR_FOREGROUND/BACKGROUND`, `QR_LOGO_RATIO`, `QR_LOGO_BG_PADDING`, `QR_FILENAME_PREFIX`; removed `DEFAULT_FILENAME` |
| `src/services/qrGenerator.ts` | Extracted `buildRenderOptions()` helper; all three generators (`generateCanvas`, `generateDataUrl`, `generateSvg`) share the same options object; added `generateSvg` using `toString` with `type: 'svg'` |
| `src/components/qr/QRPreview.vue` | After `generateCanvas`, calls `overlayLogo(canvas, logoUrl)` before emitting; logo import handled by Vite's asset pipeline |
| `src/views/GenerateView.vue` | Replaced single `download-btn` with three `export-btn` buttons; uses `buildExportFilename` for filenames; import changed from `downloadCanvas`+`DEFAULT_FILENAME` to the new `qrExport` utilities |

---

## Part 1 — Embedded Logo

### How it works

1. `QRPreview.vue` renders QR to canvas using `generateCanvas` (ECC level H).
2. `overlayLogo(canvas, logoUrl)` is called immediately after.
3. A white rounded rectangle (22% corner radius of background box size) is drawn over the center.
4. The logo is drawn centered within the rectangle.
5. The composited canvas is emitted via `generated` event — PNG export and clipboard copy use this canvas directly.

### Scan reliability

- Error correction level H (30% damage recovery) is the new default for all QR generation. This is a requirement when covering the center with a logo.
- Logo occupies 20% of QR width (`QR_LOGO_RATIO = 0.20`). Including the white background padding, total coverage ≈ 22.5%.
- ECC H at 20% coverage is within the safe zone defined by the QR standard.
- If the logo image fails to load (broken asset, network error), `overlayLogo` resolves without painting — the QR renders as plain black-on-white and remains fully scannable.

### Logo asset

- Location: `src/assets/logo/group11.png`
- Format: 256×256 PNG, 32-bit RGBA (transparent outside circle)
- Vite bundles and content-hashes the asset at build time (`group11-CSs6yXCk.png` in dist)

---

## Part 2 — Export Improvements

### PNG (`downloadQrPng`)

Delegates to the existing `downloadCanvas` utility (`canvas.toBlob` → Blob URL → `<a>` click). The canvas already has the logo composite applied.

### SVG (`downloadQrSvg`)

1. Calls `generateSvg(text, options)` → `qrcode.toString({ type: 'svg' })` returns SVG markup.
2. If `logoSrc` is provided, loads the logo as a base64 data URL (via a temp canvas), then injects a `<rect>` (white rounded background) and `<image>` (logo data URL) before `</svg>`.
3. Produces a self-contained SVG — logo is embedded as a data URL, so the file works offline.
4. Fallback: if logo load fails, the plain SVG is downloaded without logo.

### Copy to Clipboard (`copyQrToClipboard`)

Uses the modern Clipboard API:
```typescript
navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
```
Requires HTTPS or localhost. If the API is unavailable or permission is denied, `copyToClipboard` in `GenerateView` catches the error and shows a toast with a hint to use a modern browser with HTTPS.

---

## Part 3 — Filename Scheme

```
group11-{type}-{YYYYMMDD}.{ext}
```

Examples:
- `group11-url-20260615.png`
- `group11-text-20260615.svg`
- `group11-wifi-20260615.png`

`buildExportFilename(type, ext)` is a pure function in `qrExport.ts`. Date is always today's local ISO date with dashes removed.

The old `DEFAULT_FILENAME = 'qrcode.png'` constant has been removed from `qr.constants.ts`.

---

## Part 4 — QR Styling

`QrOptions` now supports:

| Option | Type | Default |
|---|---|---|
| `size` | `number` | `256` |
| `foreground` | `string` (hex) | `#000000` |
| `background` | `string` (hex) | `#ffffff` |
| `margin` | `number` | `2` |
| `errorCorrectionLevel` | `'L' \| 'M' \| 'Q' \| 'H'` | `'H'` |

All three generator functions (`generateCanvas`, `generateDataUrl`, `generateSvg`) share a single `buildRenderOptions(options?)` helper that applies defaults. GenerateView does not expose a styling UI — the options are wired in the service layer for programmatic use or future form controls.

---

## Part 5 — Accessibility

| Button | aria-label |
|---|---|
| Download PNG | `"Download QR code as PNG"` |
| Download SVG | `"Download QR code as SVG"` |
| Copy Image | `"Copy QR code image to clipboard"` |

All three buttons use the `export-btn` CSS class and are keyboard-focusable with visible `:focus-visible` outline.

---

## Edge Cases Handled

| Scenario | Handling |
|---|---|
| Logo PNG fails to load (network error, missing file) | `overlayLogo` resolves without painting — plain QR still emitted |
| Logo fails to load for SVG inject | `injectLogoIntoSvg` returns plain SVG |
| Clipboard API unavailable (HTTP, old browser) | Toast: "Failed to copy image. Use a modern browser with HTTPS." |
| SVG `width` attribute missing from generated SVG | Falls back to `256` for position calculations |
| Canvas `toBlob` returns null | Rejects with explicit error — caught and toasted in view |

---

## Build & Lint Status

- `npm run build` — ✅ 0 errors, 0 warnings
- `npm run lint` — ✅ 0 errors, 0 warnings

---

## Potential Improvements

- Expose foreground/background color pickers and margin slider in `GenerateView` to let users customize the QR appearance.
- Let users upload a custom logo instead of the fixed `group11.png`.
- Add a "Copy SVG" button (copies SVG markup to clipboard as text).
- Show a small preview of what the SVG will look like before downloading (SVG has no on-screen canvas preview; only the canvas with PNG logo is visible).
- Consider adding the logo to the `ScanView` result display so scanned QR sharing also carries branding.

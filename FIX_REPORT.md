# FIX_REPORT — Sprint FIX: Routing & Navigation Hardening

**Date:** 2026-06-15  
**Branch:** main  
**Build:** ✅ Passes (`npm run build`)  
**Lint:** ✅ Passes (`npm run lint`)

---

## What Was Broken

### 1. Feature cards were not clickable links (Part 1)
`FeatureCard.vue` had no `to` prop and rendered as a plain `<article>`. Clicking a feature card on the home page did nothing — there was no navigation to `/generate`, `/scan`, `/library`, or `/scan` (AI).

### 2. Vercel 404 on direct URL access (Part 2)
`vercel.json` was missing from the project root. Without a SPA rewrite rule, Vercel attempted to serve static files for paths like `/generate` or `/scan`, resulting in 404 errors on every direct URL load or browser refresh.

### 3. (No issue) Vite base URL (Part 3)
`vite.config.ts` correctly omits `base`, which defaults to `/`. No change needed.

### 4. (No issue) Router auth guards (Part 4)
`src/router/index.ts` correctly marks only `/library` as `requiresAuth: true`. Routes `/generate` and `/scan` are public. The guard only runs for routes that have `requiresAuth: true`, so unauthenticated users are never blocked from public routes. No change needed.

---

## What Was Fixed

### Fix 1 — `src/components/home/FeatureCard.vue`
- Added optional `to?: string` prop.
- Changed `<article>` to `<component :is="to ? RouterLink : 'article'" :to="to">` so the card renders as a `<RouterLink>` (navigable `<a>`) when `to` is provided, or a plain `<article>` otherwise.
- Added `text-decoration: none; color: inherit;` to preserve visual styling when rendered as a link.
- Added `a.feature-card { cursor: pointer; }` so the pointer cursor only appears on navigable cards.

### Fix 2 — `src/views/HomeView.vue`
Added `to` routes to each feature card entry in the `features` array:

| Card | Route |
|---|---|
| Smart QR Generator | `/generate` |
| QR Scanner | `/scan` |
| Secure Cloud Library | `/library` |
| AI-powered Assistance | `/scan` |

Passed `:to="f.to"` to `<FeatureCard>` in the template.

### Fix 3 — `vercel.json` (created)
Created `vercel.json` at the project root with a catch-all SPA rewrite rule:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures Vercel serves `index.html` for all paths, letting Vue Router handle client-side routing. Without this, any direct URL or browser refresh to a non-root path returns 404.

---

## How to Verify

### Local verification
```bash
npm run dev
```
1. Open `http://localhost:5173`
2. Click each feature card on the home page — verify navigation:
   - **Smart QR Generator** → `/generate`
   - **QR Scanner** → `/scan`
   - **Secure Cloud Library** → `/library` (redirects to `/login` if not signed in)
   - **AI-powered Assistance** → `/scan`
3. While on any sub-page, refresh the browser — page should load correctly (no 404).

### Production verification (after deploy)
1. Deploy to Vercel.
2. Navigate directly to `https://<your-domain>/generate` in a new browser tab — should load the Generate page, not a 404.
3. Repeat for `/scan` and `/library`.

### Build & lint check
```bash
npm run build   # must exit 0
npm run lint    # must exit 0
```

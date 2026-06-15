# Authentication Module — PR Review

**Reviewer:** Senior Frontend Engineer (AI)
**Date:** 2026-06-15
**Scope:** `src/services/auth.ts`, `src/stores/useAuthStore.ts`,
`src/components/auth/LoginForm.vue`, `src/components/auth/RegisterForm.vue`,
`src/views/LoginView.vue`, `src/views/RegisterView.vue`

---

## Executive Summary

The authentication module is well-structured for a Milestone 2 delivery. The
three-layer separation (service → store → component) is clean and holds up
throughout. TypeScript quality is high — no `any`, no unsafe casts where avoidable,
explicit return types on all functions. The forms are accessible and handle the
standard UX states correctly.

Two issues require attention before route guards are added in Milestone 3:
a missing `isReady` flag in the store (will cause a redirect loop on page refresh)
and a user-enumeration leak in the error map. Everything else is technical debt
or a code-quality improvement.

---

## 1. Architecture

### Strengths

- The three-layer boundary is consistently respected: Firebase SDK calls live
  exclusively in `auth.ts`, business logic in `useAuthStore.ts`, UI state in
  the form components. No layer reaches past its neighbour.
- Views are genuinely thin — they own only the centering layout and nothing else.
- The Pinia setup-store form (not options-store) is the right choice here:
  more TypeScript-friendly, easier to tree-shake, composable.
- `onAuthStateChanged` is wired during store setup rather than in a lifecycle
  hook, so auth state is reactive from the moment the store is first accessed.

### Weaknesses

- **`authStore.error = null` from `onMounted` in both form components.**
  Direct Pinia state mutation from a component is permitted by the library but
  breaks encapsulation. If the store later adds side effects on error reset (e.g.
  clearing a log entry), the form components are silently bypassed.
  Fix: add a `clearError()` action to the store.

- **The auth observer is started lazily.**
  `useAuthStore()` is first called when a form component mounts. If the user
  lands on the home route (which currently has no store usage), the observer
  never starts and `currentUser` stays `null` for the lifetime of that visit.
  Fix: call `useAuthStore()` once in `App.vue` or `main.ts` so the observer
  is guaranteed to start at app boot.

---

## 2. Folder Organisation

### Strengths

- `src/components/auth/` groups auth UI correctly. As more auth components are
  added (password-reset form, email-verification banner), they have a natural
  home.
- Naming conventions from CLAUDE.md are followed throughout: PascalCase
  components, `use` prefix on the store, camelCase service file.

### Weaknesses

- No issues. The structure is clean for the current scope.

---

## 3. Component Design

### Strengths

- `<script setup lang="ts">` used consistently.
- Props and emits are not needed here; the forms are correctly self-contained.
- `novalidate` on both forms prevents browser-native validation from conflicting
  with the custom system.
- The `touched` reactive object is the right pattern: errors are only shown
  after the user has left a field, not on initial render.
- `handleSubmit` marks all fields as touched before the validity check, so
  pressing Enter while skipping fields still surfaces all errors.

### Weaknesses

- **`EMAIL_RE` is defined at module level in both files — identical copy-paste.**
  This is the only piece of logic that is genuinely duplicated. See §11.

- **`router.push('/')` is a hard-coded path string in both forms.**
  If the home route path ever changes, this breaks silently. Named routes
  eliminate that fragility.

  ```typescript
  // Current
  await router.push('/')

  // Better
  await router.push({ name: 'home' })
  ```

- **No `aria-pressed` on the eye-toggle buttons.**
  The show/hide buttons communicate their state via `aria-label` change alone.
  `aria-pressed` is the semantically correct attribute for a toggle button and
  is better supported by switch-mode screen readers.

  ```html
  <button type="button" :aria-pressed="showPassword" ...>
  ```

---

## 4. Store Design

### Strengths

- `finally` blocks guarantee `loading` is always reset, even when Firebase
  throws an unexpected error type.
- The `hasCode` type predicate correctly narrows `unknown` errors without
  reaching for `any` or an unsafe cast at the call site.
- `AUTH_ERROR_MAP` makes all user-visible error strings visible in one place
  — easy to audit and translate later.
- `currentUser` is updated exclusively by the observer, never manually set
  inside actions. This is the correct pattern: Firebase is the source of truth.

### Weaknesses

- **Critical: missing `isReady` flag.**
  `onAuthStateChanged` is asynchronous. Between app mount and the first
  observer callback, `currentUser` is always `null` — even for a user who has
  a valid, unexpired session. Any route guard that reads `currentUser` during
  this window will wrongly redirect an authenticated user to `/login` on every
  page refresh.

  The fix is one line added to the store setup:

  ```typescript
  const isReady = ref(false)

  observeAuthState((user) => {
    currentUser.value = user
    isReady.value = true   // ← flips once, stays true
  })
  ```

  The router guard must then await `isReady` before making any redirect
  decision. Without this, Milestone 3 route guards will ship with a
  refresh-to-login bug that only affects production (local dev is fast enough
  that the race is rarely lost in testing).

- **No `clearError()` action.**
  See §1. The store should own all mutations of its own state.

- **`logout()` sets `loading = true` but the user has no visible loading
  feedback yet.**
  Not a bug — correct defensive code — but worth noting so the UI layer
  does not forget to wire this state when the navigation header is built.

---

## 5. Firebase Integration

### Strengths

- `auth` is initialised once in `firebase.ts` and imported by reference.
  No risk of duplicate `initializeApp` calls.
- All Firebase Auth functions are individually imported — the bundle will
  only include what is used.
- Naming the re-export `firebaseSignOut` avoids a local `signOut` shadow that
  would be easy to misread.

### Weaknesses

- **`signUp` and `signIn` return `UserCredential`, which the store discards.**
  This is architecturally correct (the observer is the authoritative source of
  `currentUser`), but `UserCredential.user` could be used in the store to set
  `currentUser` synchronously before the observer fires — useful if the observer
  latency ever becomes noticeable. Not a bug; a future optimisation if needed.

- **No environment-variable validation.**
  `initializeApp` in `firebase.ts` will succeed even with empty strings (e.g.
  when `.env` is missing), but every subsequent SDK call will fail with a
  non-standard error. A guard at startup would give a clearer developer error:

  ```typescript
  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    throw new Error('Firebase env vars are not configured. Copy .env.example to .env.')
  }
  ```

  This is a developer-experience concern, not a production risk (production
  will have the vars set).

---

## 6. TypeScript Quality

### Strengths

- No `any` anywhere in the module.
- `import type` used correctly for all type-only symbols.
- All async functions annotated with explicit `Promise<void>` return types.
- `computed<string>()` and `computed<boolean>()` explicit generics prevent
  accidental type widening.
- `hasCode` is a proper type predicate — correct, readable, and the cast inside
  it is justified because the property existence has been confirmed by `'code' in err`.

### Weaknesses

- **`AUTH_ERROR_MAP: Record<string, string>` accepts any string key.**
  The keys are always Firebase error-code strings. Narrowing the type to a union
  literal or an `as const` object would make unrecognised codes a compile-time
  error rather than a runtime fallback. Low priority for now, but worth
  revisiting if the map grows.

- **`touched` in both forms is inferred as `{ email: boolean, password: boolean }`.**
  The type is correct by inference, but an explicit `interface FieldTouched`
  would be more readable if validation complexity grows.

---

## 7. Validation Logic

### Strengths

- Computed validators are reactive — no imperative re-validation on every event.
- Client rules match Firebase's defaults (6-character minimum), so client and
  server rejections are consistent.
- Confirm-password check is live: if the user changes `password` after filling
  `confirmPassword`, `confirmError` updates immediately.
- Server errors are displayed in a visually distinct banner, not mixed with
  field-level errors.

### Weaknesses

- **`EMAIL_RE` is too permissive on the left-hand side.**
  `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` accepts `@@.com`, `a@@b.c`,
  and similar malformed addresses because it only forbids whitespace and `@` in
  each segment but does not require at least one valid character before the `@`.
  Firebase will reject these server-side, but the client will pass them through,
  which wastes a network round-trip and briefly misleads the user.

  A minimal improvement that is still not over-engineered:

  ```typescript
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  ```

  (Requiring at least two characters in the TLD eliminates the most obvious
  garbage while still accepting all real addresses.)

- **No debounce on the email validator.**
  The validator runs on every keystroke via `v-model`. Because errors are gated
  behind `touched`, this causes no visible problem today. If validation ever
  becomes async (e.g., a future "check if email is already taken" call), this
  will need a debounce wrapper. Noting it now so the pattern is not entrenched.

- **`confirmError` does not reset `touched.confirm` when `password` changes.**
  If the user fills confirm, then edits password to a different value, the
  "Passwords do not match" error appears immediately (because `touched.confirm`
  is already `true`). This is reactive-validation correct behaviour, but it can
  feel like the form is attacking the user mid-edit. A `watch` on `password`
  that resets `touched.confirm = false` would be more forgiving:

  ```typescript
  watch(password, () => { touched.confirm = false })
  ```

---

## 8. Accessibility

### Strengths

- Every input has a `<label>` with a matching `for` / `id` pair.
- `aria-invalid` is set to `true` when validation fails and removed (not set
  to `"false"`) when valid — correct per WAI-ARIA spec.
- `aria-describedby` links each input to its error `<span>` when the error is
  visible.
- `role="alert"` on both field-error spans and the server-error paragraph
  causes screen readers to announce errors as they appear.
- `autocomplete` is correctly differentiated: `current-password` for login,
  `new-password` for both register fields.
- Eye-toggle `aria-label` strings are distinct in the register form
  ("Show password" vs "Show confirm password") — correct.
- `:focus-visible` on the submit button keeps keyboard focus rings while
  suppressing them for mouse users.

### Weaknesses

- **Eye-toggle buttons are missing `aria-pressed`.**
  `aria-label` text changes on click, which screen readers will announce on
  focus but not immediately on click. `aria-pressed` conveys the binary toggle
  state directly and is announced immediately on activation. See §3.

- **Disabled submit button has no explanation for assistive technology.**
  When the form is empty, the submit button is `disabled`. Screen readers
  announce it as "dimmed" or "unavailable" but cannot tell the user why.
  A common pattern is to use `aria-disabled="true"` instead of the native
  `disabled` attribute (which removes the element from tab order entirely),
  plus an `aria-describedby` pointing to a live-region hint. This is a
  refinement, not a blocking issue.

- **The `<h1>` inside the form card sits inside `<main>`, which is correct.**
  However `style.css` contains a global `h1` rule (`font-size: 56px`). The
  form's `.auth-title` overrides `font-size` to `26px` via scoped style. Because
  scoped styles have the same specificity as the global rule, this works — but
  only because the scoped selector happens to be more specific after Vue's
  attribute scoping is applied. It is fragile. The global `h1` rule in
  `style.css` should be scoped to the page-level layout (e.g., `#center h1`)
  rather than a bare selector that affects every `h1` in the app.

---

## 9. Responsive Design

### Strengths

- `max-width: 420px` with `width: 100%` means the card naturally fills narrow
  viewports.
- The `@media (max-width: 480px)` block removes border-radius and side borders,
  giving a full-bleed mobile feel that is a common, well-understood pattern.
- `box-sizing: border-box` is set on both the card and individual inputs,
  preventing overflow.
- `padding: 24px 16px` on the auth-page prevents the card from touching the
  viewport edge on medium screens.

### Weaknesses

- **`min-height: 100svh` on `.auth-page` is redundant and potentially harmful.**
  `#app` in `style.css` already sets `min-height: 100svh` and is a flex column.
  `.auth-page` has `flex: 1`, which already stretches it to fill the parent.
  Adding `min-height: 100svh` to the child means: if the card content is shorter
  than the viewport, the view is `100svh` anyway (the same as without the
  redundant rule). But if `App.vue` ever adds a persistent header or footer
  outside `<RouterView>`, the auth view's `min-height: 100svh` will make the
  total page height `header + 100svh`, causing an unnecessary scrollbar.

  Fix: remove `min-height: 100svh` from both view files. `flex: 1` is sufficient.

- **No landscape-mobile consideration.**
  On a 375 × 667 device rotated to landscape (667 × 375), the card is taller
  than the viewport and the user must scroll to reach the submit button. The
  `@media (max-width: 480px) and (max-height: 500px)` combination could reduce
  vertical padding and margins. Low priority but relevant for the mobile
  checkpoint in Milestone 7.

---

## 10. Performance

### Strengths

- Both login and register components are lazy-loaded via dynamic imports in the
  router — they are never in the critical bundle.
- `computed` properties cache validation results; re-computation only fires
  when a reactive dependency changes.
- `EMAIL_RE` is a module-level constant, compiled once per module instance.

### Weaknesses

- **`useAuthStore` chunk is 289 KB (88 KB gzipped).**
  This is the Firebase Auth SDK pulling in its full weight, including the
  gRPC-based identity toolkit client. This is expected and unavoidable with
  Firebase, but worth knowing before the final performance audit in Milestone 7.
  Firebase's modular SDK (v9+) is already being used correctly, so there is no
  further tree-shaking gain available here.

- **No request deduplication on rapid submit.**
  The submit button is disabled while `loading` is true, preventing a second
  in-flight request. This is correct. However, if the user submits via keyboard
  Enter between the `disabled` setting and the DOM re-render (a single frame),
  a duplicate submit is theoretically possible. Negligible in practice.

---

## 11. Maintainability

### Strengths

- All auth behavior is centralised in `useAuthStore.ts`. Adding email
  verification, password reset, or OAuth providers requires changes in one
  service file and one store — no component changes needed until the UI is built.
- `AUTH_ERROR_MAP` makes error strings auditable without reading Firebase docs.

### Weaknesses

- **~90 lines of CSS are duplicated verbatim across `LoginForm.vue` and
  `RegisterForm.vue`.**
  This is the most significant maintainability issue in the module. The card
  layout, field styling, input states, eye button, error colours, submit button,
  and switch link are pixel-identical. Every design change requires editing two
  files. CLAUDE.md says "Use `<style scoped>` for component-level styles. Use
  `style.css` only for global tokens and resets." — the middle ground is a
  dedicated `src/assets/auth-form.css` that both form components import:

  ```typescript
  // In both form components
  import '@/assets/auth-form.css'
  ```

  Because these are scoped to auth forms (not global UI primitives), they should
  not go into `style.css`, but a shared CSS file is appropriate.

- **`EMAIL_RE` is duplicated.**
  A one-liner extraction eliminates the divergence risk:

  ```typescript
  // src/constants/auth.constants.ts
  export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/ as const
  ```

  Both form files import it from there. CLAUDE.md explicitly states: "No magic
  strings or numbers — put them in `src/constants/`."

- **`AUTH_ERROR_MAP` will silently return the fallback for any Firebase error
  code added in future SDK versions.**
  This is acceptable behaviour, but a comment noting the Firebase Auth error
  codes reference URL would help whoever maintains it next.

---

## 12. Security

### Strengths

- No Firebase credentials are referenced in any component or store file.
- Passwords are held in reactive `ref` values for the duration of the form's
  lifetime and are not persisted anywhere (no `localStorage`, no URL params,
  no emitted events carrying raw passwords).
- All error messages from Firebase are mapped through `resolveError`, which
  falls back to a generic string for any code not in the map — unknown errors
  never leak raw Firebase exception details to the UI.
- Client-side validation is additive to server-side validation, not a
  replacement. An attacker who bypasses the form still hits Firebase's rules.
- Vue's template binding auto-escapes all interpolated strings, so the store
  `error` string cannot introduce XSS regardless of its content.

### Weaknesses

- **User enumeration via `auth/user-not-found`.**
  The error map returns distinct messages for `auth/user-not-found` ("No account
  found with this email.") and `auth/wrong-password` ("Incorrect password.").
  This tells an attacker which email addresses are registered by watching the
  error message change.

  Firebase SDK v10+ collapses both codes into `auth/invalid-credential`
  ("Invalid email or password."), which is already mapped correctly. However,
  some project configurations or older SDK versions still surface the legacy
  codes. The safest fix is to map both legacy codes to the same generic message:

  ```typescript
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  ```

  This makes the store safe under both old and new SDK behaviour.

- **`showPassword = true` exposes the password value to browser autofill
  managers and browser extensions that read `type="text"` inputs.**
  This is inherent to any show-password implementation and is an acceptable
  trade-off for usability. Document it as a known behaviour, not a bug.

- **No client-side rate-limit hint on the login form.**
  Firebase will return `auth/too-many-requests` after repeated failures and
  block the IP. The current UI only shows the error message. A small UX
  improvement — disabling the form for a few seconds after this error — would
  discourage automated retries (though true rate limiting must remain server-side
  via Firebase).

---

## Potential Bugs

| # | Severity | Location | Description |
|---|---|---|---|
| B1 | **High** | `useAuthStore.ts` | No `isReady` flag. Route guards added in Milestone 3 will redirect all authenticated users to `/login` on page refresh until the observer fires. |
| B2 | **Medium** | `LoginForm.vue`, `RegisterForm.vue` | `router.push('/')` is a path string. If the home route path changes, navigation breaks silently at runtime with no type error. |
| B3 | **Medium** | `useAuthStore.ts` | `auth/user-not-found` and `auth/wrong-password` map to distinct messages, enabling email enumeration. |
| B4 | **Low** | `LoginView.vue`, `RegisterView.vue` | `min-height: 100svh` on `.auth-page` is redundant with `#app`'s rule. Will cause a double-height page if a persistent header/footer is added to `App.vue`. |
| B5 | **Low** | `RegisterForm.vue` | Changing `password` after `confirmPassword` has been touched shows "Passwords do not match" immediately mid-edit, which is jarring UX. |
| B6 | **Low** | `App.vue` / `main.ts` | Auth observer starts lazily (on first store access). A user on the home route has no active observer, so `currentUser` remains `null` until they navigate to an auth-aware view. |

---

## Technical Debt

| # | Priority | Location | Description |
|---|---|---|---|
| D1 | High | `LoginForm.vue`, `RegisterForm.vue` | ~90 lines of CSS duplicated verbatim. Extract to `src/assets/auth-form.css`. |
| D2 | High | `LoginForm.vue`, `RegisterForm.vue` | `EMAIL_RE` regex duplicated. Extract to `src/constants/auth.constants.ts`. |
| D3 | Medium | `useAuthStore.ts` | No `clearError()` action. Components mutate store state directly. |
| D4 | Medium | `useAuthStore.ts` | No `isReady` flag — required before Milestone 3. (Also listed as bug B1.) |
| D5 | Low | `useAuthStore.ts` | `AUTH_ERROR_MAP` has no reference to Firebase error code documentation. |
| D6 | Low | `style.css` | Bare `h1` global rule conflicts with `.auth-title`; auth form relies on scoped-style specificity to win, which is fragile. |

---

## Suggested Refactors

Listed in recommended implementation order.

### R1 — Add `isReady` to the store (required before Milestone 3)

```typescript
// src/stores/useAuthStore.ts
const isReady = ref(false)

observeAuthState((user) => {
  currentUser.value = user
  isReady.value = true
})

return { currentUser, isReady, loading, error, login, register, logout }
```

### R2 — Add `clearError()` action to the store

```typescript
function clearError(): void {
  error.value = null
}

return { currentUser, isReady, loading, error, login, register, logout, clearError }
```

Then in forms:

```typescript
onMounted(() => { authStore.clearError() })
```

### R3 — Extract shared constants

```typescript
// src/constants/auth.constants.ts
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/ as const
```

### R4 — Extract shared CSS

```
src/assets/auth-form.css   ← contains .auth-card, .field, label, input, etc.
```

Both form components import it:

```typescript
import '@/assets/auth-form.css'
```

Each form keeps only its unique styles (none, in the current implementation)
in its `<style scoped>` block.

### R5 — Use named route for post-auth redirect

```typescript
await router.push({ name: 'home' })
```

### R6 — Unify user-not-found error message

```typescript
// src/stores/useAuthStore.ts
'auth/user-not-found': 'Invalid email or password.',
'auth/wrong-password': 'Invalid email or password.',
```

### R7 — Add `aria-pressed` to eye buttons

```html
<button type="button" :aria-pressed="showPassword" ...>
```

### R8 — Reset `touched.confirm` when `password` changes (RegisterForm only)

```typescript
import { watch } from 'vue'
watch(password, () => { touched.confirm = false })
```

### R9 — Start auth observer at app boot

```typescript
// src/App.vue  <script setup>
import { useAuthStore } from '@/stores/useAuthStore'
useAuthStore()   // ensure observer starts before any route renders
```

### R10 — Remove redundant `min-height` from view files

```css
/* LoginView.vue and RegisterView.vue — remove this line */
min-height: 100svh;   /* redundant: #app already sets this */
```

---

## Verdict

**Ready to merge with conditions.**

B1 (`isReady`) and B3 (user enumeration) should be fixed before the next
milestone. B2 (`router.push` path string) is a one-word change. Everything
else can be addressed in a follow-up pass without blocking progress.

The CSS duplication (D1) is the largest maintenance liability and should be
resolved before the module grows further. All other items are low-risk and
can be addressed in Milestone 7's polish pass.

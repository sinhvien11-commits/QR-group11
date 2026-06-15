# CLAUDE.md

> Context file for AI-assisted development. Read this before making any changes.

---

## Project Overview

**Project name:** QR-group11
**Type:** Single-page web application
**Team:** Group 11
**Purpose:** A QR code web app that lets users generate, scan, and manage QR codes.
Firebase provides authentication and data persistence. The Gemini API provides
AI-powered analysis of decoded QR content.

**Guiding principle:** Maintainable over clever. Readable over compact.
Every file should have one clear responsibility.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Vue 3 — Composition API only, `<script setup>` | ^3.5 |
| Build tool | Vite | ^8.0 |
| Language | TypeScript | ~6.0 |
| Type checking | vue-tsc | ^3.2 |
| Linting | ESLint v9 (flat config — `eslint.config.js`) | v9+ |
| Formatting | Prettier | latest |
| Routing | Vue Router | ^5 |
| State management | Pinia | ^2 |
| Backend / Auth | Firebase (Auth, Firestore, Storage) | ^11 |
| AI | Google Gemini API (`@google/generative-ai`) | latest |
| Styling | CSS custom properties + native responsive breakpoints | — |

---

## Folder Structure

```
src/
  assets/           Static files: images, icons, fonts
  components/       Reusable UI components shared across views
  composables/      Reusable Composition API functions (useX pattern)
  constants/        App-wide constants, magic values, enums
  layouts/          Layout wrapper components (DefaultLayout, AuthLayout)
  plugins/          Vue app plugin registrations
  router/           Vue Router config and navigation guards
  services/         All external API integrations (Firebase, Gemini)
  stores/           Pinia stores, one file per domain
  types/            Shared TypeScript interfaces, types, enums
  utils/            Pure helper functions — no Vue or DOM dependencies
  views/            Page-level components, one per route
  App.vue           Root component — contains <router-view> only
  main.ts           Entry point — mounts app and registers plugins
  style.css         Global CSS variables, resets, and base typography

public/             Static assets served at root (favicon.svg, icons.svg)
.env                Local environment variables — never committed
.env.example        Committed template showing required variable names
CLAUDE.md           This file
PROJECT_PLAN.md     Milestones, checklist, and current status
```

### File naming rules

| Type | Convention | Example |
|---|---|---|
| Vue components | PascalCase | `QrCard.vue`, `AppHeader.vue` |
| View components | PascalCase + `View` suffix | `HomeView.vue`, `ScanView.vue` |
| Composables | camelCase + `use` prefix | `useQrScanner.ts` |
| Pinia stores | camelCase + `use` + `Store` suffix | `useAuthStore.ts` |
| Service files | camelCase | `firebase.ts`, `gemini.ts` |
| Type files | camelCase | `qrCode.types.ts`, `auth.types.ts` |
| Utility files | camelCase, verb-first | `formatDate.ts`, `generateId.ts` |
| Constant files | camelCase | `routes.constants.ts` |

---

## Coding Conventions

### Imports

Order imports in this sequence, separated by blank lines:
1. Vue core (`vue`, `vue-router`, `pinia`)
2. Third-party libraries
3. Internal aliases starting with `@/services`, `@/stores`, `@/composables`
4. Internal `@/components`, `@/types`, `@/utils`, `@/constants`
5. Relative imports (same folder only)

Always use the `@/` alias. Never use `../../` style paths.

### General rules

- No `console.log` in committed code.
- No commented-out code — delete it.
- No magic strings or numbers — put them in `src/constants/`.
- One concept per file. If a file is growing past ~150 lines, split it.
- Prefer named exports over default exports in services, utils, and types.

---

## Component Rules

- Always use `<script setup lang="ts">` — never the Options API.
- Always declare props with the generic form: `defineProps<{ label: string }>()`.
- Always declare emits with the generic form: `defineEmits<{ change: [value: string] }>()`.
- Never put business logic directly in `<template>`. Move it to `<script setup>` or a composable.
- Keep component files under 200 lines. Extract logic to `composables/`, markup to child components.
- Use `<style scoped>` for component-level styles. Use `style.css` only for global tokens and resets.
- Always provide `alt` text on images. Always associate labels with form inputs.
- Component props should have the narrowest possible type — avoid `string | number | any`.

---

## TypeScript Rules

- Strict mode is enforced via `tsconfig.app.json` — do not loosen it.
- Never use `any`. Use `unknown` and narrow it with type guards, or define a proper type.
- Always annotate function return types explicitly: `function getUser(): Promise<User>`.
- Use `type` for plain object shapes and unions. Use `interface` when a type needs to be extended.
- Always import types with `import type { ... }` to prevent runtime imports of type-only symbols.
- Define shared types in `src/types/` — never inline complex types in component files.
- Use `as const` on literal objects and arrays that should not be widened.
- Avoid type assertions (`as SomeType`) unless you have verified the value at a system boundary.

---

## Development Workflow

### First-time setup

```bash
npm install
cp .env.example .env
# Fill in .env with Firebase project credentials and Gemini API key
npm run dev
```

### Daily commands

```bash
npm run dev        # Start the Vite dev server with HMR
npm run build      # Type-check with vue-tsc then bundle for production
npm run preview    # Serve the production build locally
npm run lint       # Run ESLint — report errors
npm run lint:fix   # Run ESLint — auto-fix fixable issues
npm run format     # Run Prettier and write changes in place
```

### Before every commit

1. `npm run lint` — must exit with zero errors
2. `npm run format` — apply formatting
3. Verify the dev server still starts without console errors
4. Check the affected view at both mobile (375px) and desktop (1280px) widths

### Branch strategy

- `main` — stable, always deployable
- `feature/<short-name>` — one branch per feature milestone
- `fix/<short-name>` — for bug fixes

### Environment variables

All secrets live in `.env` which is gitignored. The `.env.example` file is committed
and lists every variable name with a placeholder value. Variables exposed to the
browser must be prefixed `VITE_`.

# CLAUDE.md

## Stack

- **Web (shipping):** Next.js (App Router, Server Components by default)
- **Android (shipping):** `apps/android` is a **Trusted Web Activity (TWA)** shell — a thin native wrapper (Kotlin + Gradle, no Android Studio) that opens the deployed PWA in Chrome, *not* a WebView. It bundles no UI; the only native code is the Health Connect sync (`SyncWorker` → `GET /api/health-sync/export`). UI/logic ships by deploying `apps/web`, so a schema or web change needs no APK rebuild — only native/manifest/sync-contract changes do. Sync-contract changes: update `docs/features/android-app/sync-contract.md` (the versioned spec) in the same commit + rebuild the APK. See `apps/android/README.md` and `docs/features/android-app/`.
- **Mobile (backlog only):** A full React Native / Expo app in `apps/mobile` is a *recommendation*, not built — that directory does not exist. The Android TWA above is the shipping mobile path.
- **Language:** TypeScript strict mode everywhere
- **Monorepo:** `apps/web`, `apps/android` (TWA shell), `packages/core`, and `packages/config`. (The former `packages/ui` token package was removed — the lime/ink design tokens now live in `apps/web`'s Tailwind config + globals.)
- **Styling:** Tailwind CSS on web. NativeWind would only land alongside a future `apps/mobile` Expo app — the Android TWA reuses the web PWA, so no native styling layer exists today.

## Architecture Rules

- All business logic lives in `packages/core`. Apps are presentation-only.
- `packages/core` is framework-agnostic — never import from `next/*` or `react-native`. Use cases depend only on repository / port interfaces from `domain/`; the apps wire concrete adapters in `apps/<app>/src/lib/container.ts`.
- Follow DDD layering: `domain/` → `application/` → `infrastructure/`.
- Repository interfaces in `domain/`, implementations in `infrastructure/`.
- Use cases have one public `execute()` method. No business logic in components or route handlers.

## Code Standards

- Follow Clean Code, SOLID, and 12-Factor App conventions throughout.
- Inject dependencies — never instantiate services inside business logic.
- All environment variables accessed via `packages/config/src/env.ts` (zod-validated). Never use `process.env` directly — for runtime-defined values like `NODE_ENV`, use the helpers in that module (e.g. `isProduction()`).
- Logs to stdout/stderr only (12-factor), via the leveled logger in `packages/config/src/logger.ts`: `log.error("updateProfile", "unexpected error", { err })` — one JSON line per event, tag as the first arg. `console.*` is banned in `apps/*` (eslint `no-console`); the logger module is the only allowed console caller. Raw upstream error messages may be logged server-side but never returned to clients (see the logger's doc comment).
- Typed errors only. Never swallow errors silently.

## UI Development

-When building any React component, page, or UI, always read and apply
`docs/skills/frontend-design.md` before writing any code.

## Workflows & Skills

Two entry-point workflows orchestrate the right skills at the right time — follow
them rather than improvising the order:

- **Adding a feature** → `docs/workflows/adding-a-feature.md`
  (`/shape` → `/design-variants` → plan layers → TDD → build → `/diagram` →
  `/code-review` → `/security-review` → `/verify` → docs → ship).
- **Fixing a bug** → `docs/workflows/fixing-a-bug.md`
  (`/investigate` → regression test → fix at the owning layer → `/verify` →
  `/code-review` → docs → ship).

Custom project skills (in `.claude/skills/`, invokable as slash commands):

- `/shape` — pin a feature's scope before any code (doc: `docs/skills/feature-shaping.md`).
- `/investigate` — root-cause a bug, reproduce-first, three-fix cap (doc: `docs/skills/debugging.md`).
- `/design-variants` — explore 3–6 UI directions before committing (doc: `docs/skills/frontend-design.md`).
- `/diagram` — generate/update Mermaid from English, kept in sync with `docs/architecture-diagrams.md`.
- `/adr` — record (or check first) a load-bearing decision as a ~10-line ADR in `docs/adr/` (template: `000-template.md`).
- `/ship` — the prod-safety checklist for pushing a verified change to `main`: verify gate passed, migration-before-push ordering, test-data cleanup, git identity, then push (doc: `docs/runbooks.md`).

## Testing

- TDD: write the test first
- Unit tests in `packages/core` — no I/O, no framework deps, fast
- HTTP mocking via `msw` only
- Coverage floor: 80% on `packages/core`

## Platform Conventions

- Platform-specific UI uses `.web.tsx` / `.native.tsx` file extensions (the latter would only appear if a future `apps/mobile` Expo app lands; nothing in the tree uses it — the Android TWA renders the web PWA, so it has no React Native UI).
- `'use client'` in Next.js only when strictly necessary
- Data fetching in Server Components or Route Handlers — not `useEffect`
- packages/core should never contain Tailwind classes or styling logic

## Git

- Always commit and push using: `Manuel Olvera <olverask@protonmail.com>`
- Verify `git config user.email` is `olverask@protonmail.com` before pushing
- Pushing `main` auto-deploys to prod. A push that includes `supabase/migrations/**` requires the migration to be applied to the prod DB **before** pushing (expand/contract drill: `docs/runbooks.md`); the pre-push hook prints a reminder listing the migration files. `docs/runbooks.md` also holds the rollback, secret-rotation, restore-from-data-loss, and feature-env-matrix drills — consult it before any deploy recovery or secret change.

## Never

- Business logic outside `packages/core`
- `any` without explicit justification
- Hard-coded URLs, secrets, or env-specific values
- Importing platform packages into `packages/core`
- Committing `.env` files

## Documentation Hygiene

- Any change that affects behavior, configuration, interfaces, or logic must be reflected in the same commit/session. Update the README.md, any relevant documentation files, and inline code comments as needed. Documentation is part of the work — never leave it trailing behind the code.
- New doc files must be added to the index in `docs/README.md` (with the right living / append-log / archived marker) in the same commit.
- Shipped-feature write-ups go to `docs/features/shipped.md`; the root README's Features section stays a one-line-per-area summary — touch a summary bullet at most, never add long-form feature prose there.
- When a change invalidates a documented threat model or behavioral claim, grep for the claim's key phrase across code **and** docs in the same session — inline comments are part of the docs-hygiene rule.
- Load-bearing decisions (auth model, platform strategy, data-layer policy, fail-mode trade-offs) get an ADR in `docs/adr/` (~10 lines, template at `000-template.md`). **Check `docs/adr/` before proposing an auth/platform/data-layer migration** — if an ADR already decided against it, engage with the ADR's consequences instead of re-proposing cold.

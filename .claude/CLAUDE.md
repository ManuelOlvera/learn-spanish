# CLAUDE.md

**¡Palabras!** — a Spanish-vocabulary flashcard PWA for pre-readers (ages 3–5).
No accounts, no backend, no reading required; kids navigate by pictures and audio.

## Stack

- **Web:** Next.js (App Router, Server Components by default), installable as a PWA
- **Language:** TypeScript strict mode everywhere
- **Monorepo (pnpm):** `apps/web`, `packages/core`, `packages/config`
- **Styling:** Tailwind CSS v4 — design tokens (paper/ink/lime) live in
  `apps/web/src/app/globals.css` `@theme`; per-deck accents in `apps/web/src/lib/deck-theme.ts`
- **Audio:** browser speech synthesis, adapter at `apps/web/src/lib/speech.ts` (ADR 001)
- **Fonts:** self-hosted via `next/font/local` (`apps/web/src/fonts/`) — builds must never
  need the network

## Architecture Rules

- All business logic lives in `packages/core`. Apps are presentation-only.
- `packages/core` is framework-agnostic — never import from `next/*`. Use cases depend
  only on repository/port interfaces from `domain/`; `apps/web/src/lib/container.ts`
  wires the concrete adapters.
- Follow DDD layering: `domain/` → `application/` → `infrastructure/`.
- Repository interfaces in `domain/`, implementations in `infrastructure/`.
- Use cases have one public `execute()` method. No business logic in components or
  route handlers.

## Code Standards

- Follow Clean Code, SOLID, and 12-Factor App conventions throughout.
- Inject dependencies — never instantiate services inside business logic.
- All environment variables accessed via `packages/config/src/env.ts` (zod-validated).
  Never use `process.env` directly — for runtime-defined values like `NODE_ENV`, use the
  helpers in that module (e.g. `isProduction()`).
- Logs to stdout/stderr only (12-factor), via the leveled logger in
  `packages/config/src/logger.ts`: `log.error("updateProfile", "unexpected error", { err })`
  — one JSON line per event, tag as the first arg. `console.*` is banned in `apps/*`
  (eslint `no-console`); the logger module is the only allowed console caller.
- Typed errors only. Never swallow errors silently.

## UI Development

- When building any React component, page, or UI, always read and apply
  `docs/skills/frontend-design.md` (the Sticker Book design language) before writing
  any code. The audience is pre-readers: navigation by picture alone, huge touch
  targets, physical feedback on every tap.

## Workflows & Skills

Custom project skills (in `.claude/skills/`, invokable as slash commands):

- `/shape` — pin a feature's scope before any code.
- `/design-variants` — explore 3–6 UI directions before committing
  (doc: `docs/skills/frontend-design.md`).
- `/investigate` — root-cause a bug, reproduce-first, three-fix cap.
- `/diagram` — generate/update Mermaid, kept in sync with `docs/architecture-diagrams.md`.
- `/adr` — record (or check first) a load-bearing decision as a ~10-line ADR in
  `docs/adr/` (template: `000-template.md`).
- `/ship` — pre-push checklist; becomes load-bearing once a deploy target exists.
- `verify` — build, launch, and drive the app end-to-end (see
  `.claude/skills/verify/SKILL.md` for the recipe and sandbox gotchas).

Feature order: `/shape` → `/design-variants` (non-trivial UI) → TDD → build →
verify → docs → commit. Bug order: `/investigate` → regression test → fix at the
owning layer → verify → commit.

## Testing

- TDD: write the test first
- Unit tests in `packages/core` (vitest) — no I/O, no framework deps, fast
- HTTP mocking via `msw` only (if/when HTTP calls appear)
- Coverage floor: 80% on `packages/core`

## Platform Conventions

- `'use client'` in Next.js only when strictly necessary
- Data fetching in Server Components or Route Handlers — not `useEffect`
- `packages/core` never contains Tailwind classes or styling logic

## Git

- Always commit using: `Manuel Olvera <olverask@protonmail.com>` — verify
  `git config user.email` before pushing.
- Remote: `github.com/ManuelOlvera/learn-spanish`. Prod hosting is Vercel (ADR 002).
  The repo is **not** git-connected to Vercel — deploy explicitly with
  `npx vercel deploy --prod --yes` from the repo root, only after verify passes
  (`/ship`). Deploy + rollback drills: `docs/runbooks.md`.
- After a deploy/push, report and stop — never poll prod or wait for propagation.

## Never

- Business logic outside `packages/core`
- `any` without explicit justification
- Hard-coded URLs, secrets, or env-specific values
- Importing platform packages into `packages/core`
- Committing `.env` files
- Build-time network dependencies (fonts, CDN assets — self-host instead)

## Documentation Hygiene

- Any change that affects behavior, configuration, interfaces, or logic must be
  reflected in the same commit/session: README.md, relevant docs, inline comments.
  Documentation is part of the work — never leave it trailing behind the code.
- New doc files must be added to the index in `docs/README.md` (with the right
  living / append-log / archived marker) in the same commit.
- Shipped-feature write-ups go to `docs/features/shipped.md`; the root README's
  Features section stays a one-line-per-area summary.
- Load-bearing decisions (platform strategy, data-layer policy, fail-mode trade-offs)
  get an ADR in `docs/adr/`. **Check `docs/adr/` before proposing a platform/data-layer
  migration** — if an ADR already decided against it, engage with its consequences
  instead of re-proposing cold.

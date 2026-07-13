# ADR 002: Host the web app on Vercel

- **Date:** 2026-07-10
- **Status:** accepted

## Decision

`apps/web` deploys to Vercel (project `learn-spanish`, root directory `apps/web`,
hobby plan). No database or auth backend — the app is fully static (ADR 001 keeps
audio in the browser), so Vercel alone is the entire infrastructure. Supabase is
deliberately deferred until per-kid cross-device progress exists.

## Context

The app needs to be reachable from any device (family tablet, phones) without a
dev server. It's a static Next.js build with zero server state, so any static
host works; Vercel has first-class Next.js + pnpm-monorepo support and a free tier.

## Consequences

Deployment Protection is disabled — the production URL is public by design
(kids' flashcards, no secrets; revisit if anything non-public ever ships).
Deploys are CLI-driven until the Vercel GitHub App is authorized (see
`docs/runbooks.md`); after that, pushing `main` auto-deploys prod and the
`/ship` checklist becomes load-bearing.

**Revisited 2026-07-11 — upheld.** Considered Supabase during the content
expansion: still no. Content ships in git (push → auto-deploy), per-kid
progress is device-local by design (no accounts for pre-readers, ADR 003
keeps even voice off the wire), and a database would add a runtime network
dependency plus an offline-PWA break for zero user benefit. The trigger
remains cross-device progress sync, which first requires deciding to have
accounts at all.

**Revisited 2026-07-13 — trigger reached (see ADR 004).** Cross-device sync now
exists as an *optional* local-first layer: Supabase holds a per-pairing-code
`ProgressSnapshot`, gated by capability RPCs rather than accounts. Vercel stays
the host; the app is still fully static and fully offline when sync is disabled.

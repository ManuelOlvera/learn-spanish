# ADR 005: Hand-rolled service worker for offline

- **Date:** 2026-07-13
- **Status:** accepted

## Decision

Offline support is a **hand-rolled service worker** (`apps/web/public/sw.js`),
not `next-pwa`/Workbox. Navigations are **network-first** (fresh deploys win;
offline falls back to the last-seen page, then the cached home shell);
same-origin subresources are **cache-first** (Next's hashed URLs are
immutable); cross-origin and non-GET (the Supabase sync RPCs) are untouched.
Updates are `skipWaiting` + `clients.claim` — a new worker owns the next load.
Registration is production-only (`ServiceWorkerRegistrar`, gated by
`isProductionBuild()` — dev HMR and a caching worker don't mix).

## Context

The app was architecturally offline-ready (localStorage state, self-hosted
fonts, best-effort sync) but a launch without network served nothing — the gap
between the docs' "offline PWA" claim and reality. A plugin brings a build-time
precache manifest we don't need: the only URLs worth precaching are stable
(`/`, manifest, icons), and everything hashed self-invalidates via fresh HTML.

## Consequences

- Airplane/road-trip launches work after one online visit. Sync stays
  untouched offline (its POSTs bypass the worker) and catches up per ADR 004.
- **Do not** cache POSTs or cross-origin, and never make navigations
  cache-first — that would pin stale HTML to old hashed assets.
- Changing a stable-URL shell asset (icon shape, manifest) needs a `CACHE`
  version bump in `sw.js`; hashed assets never do.
- Revisit Workbox only if we need background sync or precache-everything.

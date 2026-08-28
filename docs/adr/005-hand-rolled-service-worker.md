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

## Addendum (2026-08-28): the cache is capped, not versioned per deploy

The 2026-08-28 quality review flagged unbounded cache growth. The review named
route visits and story art; both are wrong — a finite route table and a 68-file
art corpus are self-limiting. The real unbounded axis is **deploys**: `CACHE` is
a constant, `activate` only deletes caches under a *different* name, and every
deploy mints a fresh set of hashed `/_next/static` URLs that are added
alongside the old ones and never requested again. One dead set per deploy,
forever, on a device a family keeps installed for months.

**Decision:** cap the cache at `MAX_ENTRIES` (400 ≈ two full app versions
including all story art) and evict oldest-first. `cache.keys()` resolves in
insertion order, so FIFO needs no timestamps and no IndexedDB alongside — the
trim is ~15 lines and stays inside the "no plugin, no manifest" bargain above.
It runs on `activate` and then amortized, every `TRIM_EVERY` cache writes.
Precached `SHELL` entries are never evicted: they are what makes a cold offline
launch work, and `install` only re-adds them when the worker itself updates.

**Rejected: keying `CACHE` to the build id.** It is the tidier fix and it makes
the existing `activate` sweep do all the work — but it empties the cache on
every deploy, and the offline launch is the entire point of this ADR. Ship on
Friday and a family driving on Saturday arrives with the shell and nothing else.
Growth is a storage cost; that would be a functional regression.

**Rejected: true LRU.** The Cache API carries no access metadata, so it needs a
parallel IndexedDB of timestamps. Insertion order is a good enough proxy when
the thing being evicted is, by construction, assets from older deploys.

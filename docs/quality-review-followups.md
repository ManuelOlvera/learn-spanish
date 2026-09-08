# Quality Review Follow-ups

Point-in-time follow-up list from the project review on 2026-08-28.

> **Status (2026-08-28):** items 1, 3, 4 and the album half of the local-storage
> note are **done** — see `docs/features/shipped.md`. Item 2 was already largely
> shipped in July and is corrected below. Item 5 is deliberately deferred.
> Verified with the commands at the foot of this file plus a `/verify`
> click-through (album salvage, sync panel, cache eviction, offline reload).

## 1. Patch dependencies — **done**

`next` 15.5.20 → 15.5.24 (clears all 8 of its advisories, 2 high).
`vitest` + `@vitest/coverage-v8` 2.1.9 → 3.2.7 (clears the critical; no test
migration needed — 580 tests passed unchanged). `pnpm.overrides` lift `postcss`,
`nanoid`, `js-yaml` and `brace-expansion` out of transitive pins.

**29 advisories → 5.** Worth knowing for next time: the original "1 critical,
17 high" headline was misleading. Only `next` was ever production-facing;
everything else was dev tooling. The five that remain are `vite`/`esbuild`
under vitest and `sharp` under `next` — build-time only, and `sharp` backs an
image-optimization path this app never takes (ADR 015). Left deliberately:
clearing them means forcing a major inside another package's pinned tree.

## 2. Supabase write abuse — **mostly already shipped; residual is narrow**

This was raised as if untouched, but it is `docs/fable-review/security.md` #1,
and the substance shipped on 2026-07-13 in
`supabase/migrations/0002_progress_hardening.sql`: pairing-code format check,
64 KB payload cap, `search_path` pinning on every `SECURITY DEFINER` function,
and a 12-month retention sweep. RLS already denied direct table access.

**Residual, and it is real but small:** someone holding the (public by design)
anon key can still mint well-formed codes and create unlimited ≤64 KB rows.
That is free-tier quota burn, not data disclosure — the read path is safe
behind ~100-bit codes.

**Recommendation: a Supabase spend cap / usage alert, not an Edge Function.**
Rate-limiting middleware or server-minted pairing rows is a lot of machinery
and a new failure mode in the pairing flow, to defend a family app against a
cost ceiling that a billing alert surfaces for ten minutes of dashboard
clicking. Revisit if an alert ever actually fires.

## 3. Sync request timeouts — **done**

Every Supabase RPC now carries `AbortSignal.timeout(10s)`, and a stall raises
the typed `SyncTimeoutError` rather than hanging. This was the one item in the
review that was a live bug rather than hardening: sync is serialized per device
and entirely best-effort, so a single stalled request silently ended sync for
the life of the tab.

## 4. Service worker cache — **done, but the review named the wrong cause**

Route visits and story art are both self-limiting (a finite route table, a
68-file art corpus). The unbounded axis is **deploys**: each one mints a fresh
set of hashed asset URLs that pile into the same never-evicted cache. Now
capped at 400 entries, FIFO, shell exempt. See the ADR 005 addendum for why the
cache is *not* keyed to the build id — that empties it on every deploy and
breaks the offline launch the app exists for.

## 5. A small web test layer — **deferred, with the gap named**

Not wrong, just not yet worth it: `/verify` already builds and drives the app
headless, and there is no CI to run Playwright specs (see `/ship` — the
checklist is the only gate). Adding them now means maintaining a second harness
that a human still has to trigger by hand.

**What the deferral actually costs:** the web layer has no unit tests at all, so
the two adapter fixes above are covered by `/verify` and by core tests of their
extracted logic (`salvageStickerIds`, `isTimeoutError`), not by tests of the
adapters themselves. The cheapest real improvement is not Playwright — it is a
small vitest + jsdom harness in `apps/web` for the localStorage adapters. The
`#sync=` fragment path is the one flow `/verify` genuinely does not cover.

> **Update:** that harness landed on 2026-09-01 (`apps/web/test/storage.ts` — a
> localStorage stand-in that can be made to refuse reads or writes) and now
> carries 61 tests across six files. It has already paid for itself twice: the
> 2026-09-08 pass used it to pin quota handling and the sync-health classifier,
> and the same pass's `/verify` run caught a defect it could not (a banner that
> read its flag once on mount, before the write that fails). Playwright is
> still deferred, and the `#sync=` fragment path is still the uncovered flow.

## Notes worth keeping from the review's second pass

- No XSS sink, secret leakage, `eval`, or unbounded transfer-code parsing was
  found; CSP and security headers are in place (`next.config.ts`), and the
  domain layer is heavily covered (~98%).
- The local stores are deliberately failure-tolerant. Only `album-store` was
  all-or-nothing (one bad entry discarded every sticker) — now fixed;
  `word-stats`, `answer-log`, `economy` and `streak` already salvaged per entry.
- The remaining permissive edge is the **write** side: `save()` swallows quota
  errors and logs a warning, so a full quota means a session's progress is never
  persisted and nothing on screen says so. ~~Not fixed — a fix means a
  parent-visible failure state, which is a design question, not a patch.~~
  **Fixed 2026-09-08** (ADR 019): the design question got an answer — the
  failure state belongs on `/informe`, the grown-up screen, and nowhere near
  the kids. A refused write now raises a `role="alert"` banner there. The
  record is held in memory rather than stored, because the condition being
  reported is "writes are failing". The same pass sized down what was most
  likely to *cause* a full quota: `MAX_LOG_EVENTS` 20,000 → 8,000 (ADR 013's
  addendum), since two kids' answer logs could otherwise claim ~3 MB of a ~5 MB
  origin quota while everything else the app stores comes to ~75 KB.
- The two `<a href="/">` lint warnings in the error boundaries are intentional:
  an error boundary must not depend on the router.

## Verification Commands

```bash
pnpm install
pnpm audit --audit-level moderate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Review Context (as reviewed, before the fixes above)

- `pnpm lint` passed with two Next warnings for `<a href="/">` in error boundaries.
- `pnpm typecheck` passed.
- `pnpm test` passed: 580 core tests, about 98% statement coverage.
- `pnpm build` passed; first-load JS was about 140-167 kB depending on route.
- `pnpm audit --audit-level moderate` reported 29 moderate-or-higher vulnerabilities.

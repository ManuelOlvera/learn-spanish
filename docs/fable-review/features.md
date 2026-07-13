# Feature recommendations — 2026-07-13

> **Status update (2026-07-13):** #1 (service worker, ADR 005), #4 (per-kid
> misión pools), #5 (parent trend report), and all of #6 (delete RPC, local
> dayKey, visibilitychange pull, maskable icon) are shipped — see
> `docs/features/shipped.md`. Still open: #2 (CI on GitHub) and #3 (no-Spanish-
> voice fallback).

The roadmap (`docs/features/roadmap.md`) is healthy — shipped items get moved
with dates, deferred items carry reasons. These recommendations either aren't
on it or deserve a priority bump. Ordered by expected value for the two actual
users (a 5-year-old listener and an 8-year-old reader).

## 1. A service worker — make the PWA actually work offline

The app is architecturally offline-ready (all state in localStorage, fonts
self-hosted, sync explicitly best-effort) but a launch without network fails:
there is no service worker, so nothing is cached. This is the gap between the
app you have and the app the docs describe (docs review #1) — and it's the
road-trip/airplane use case where a kids' tablet app earns its keep. Next.js
has no built-in SW; a hand-rolled ~40-line cache-first worker (precache the
shell on install, runtime-cache navigations) fits this repo's no-dependency
taste better than `next-pwa`. Pairs with an ADR: cache strategy and update
semantics are load-bearing.

## 2. CI on GitHub — the missing safety net for auto-deploy

Not kid-visible, but the highest-risk gap in the delivery pipeline: pushing
`main` deploys prod, and there is no `.github/workflows/` — the 80% coverage
floor, typecheck, and lint are enforced only by whoever remembers to run them.
One workflow (`pnpm install && pnpm lint && pnpm typecheck && pnpm test &&
pnpm build`) turns the `/ship` checklist from discipline into a guarantee.
Vercel's "require checks to pass before deploying" can then gate the deploy
itself.

## 3. Sound effects vs. speech-voice availability fallback

ADR 001 accepted that speech quality varies by device, but there's no fallback
when a device has **no** Spanish voice at all (some Android WebViews):
`speakSpanish` silently does nothing, and for a pre-reader silence is a broken
app. Cheap first slice: detect the no-es-voice case once at startup and show
the parent a one-time hint ("instala una voz en español en ajustes"). The full
fix — a recorded audio pack — is a real ADR-001 revisit; the detection tells
you whether it's ever needed.

## 4. Per-kid daily-mission difficulty (the roadmap's proven pattern, applied)

Roadmap item 12 proved the difficulty axis on parejas. The misión currently
draws the same activity kinds for both kids; the 8-year-old's mission could
bias toward read-mode and frases activities, the 5-year-old's toward listen
games. Zero new content, reuses `dailyMission(date, kid)` (the kid is already a
parameter), and it makes the one retention mechanic feel personal.

## 5. Parent report: trend over time

`/informe` shows strong/tricky words *now*; a parent checking weekly can't see
direction. The `WordStats` max-merge model can't express history, so the
smallest honest version is a weekly snapshot appended locally (one small doc
per week, capped at ~12 weeks) rendering as "palabras aprendidas esta semana".
Worth `/shape` before building — it's the first feature that grows an append
model, and the cut-line matters.

## 6. Quick wins already implied by the codebase

- **Realtime-ish freshness without Realtime:** re-run `syncPull` on the
  `visibilitychange` → visible event. Today a tablet left open all afternoon
  never sees the phone's progress (roadmap defers full Realtime; this is 5
  lines and closes most of the gap).
- **`delete_progress` RPC + "borrar la nube"** — completes the sync lifecycle
  (security review #2).
- **Maskable PWA icon:** the manifest ships one `any` SVG; Android launchers
  will letterbox it. Add `purpose: "maskable"` art.
- **Local-day `dayKey`** — filed as code-quality #2 but it's kid-visible: the
  carta del día flips mid-evening in the Americas and evening play can miss
  the streak.

## Explicitly not recommended (engaging with existing decisions)

- **Accounts/auth** — ADR 004 already weighed this; nothing observed changes
  its "revisit if data value rises" trigger.
- **Supabase Realtime** — deferred on the roadmap; the visibilitychange pull
  above is the 80/20 and adds no dependency.
- **A component test framework for `apps/web`** — the architecture review's
  economy-extraction (#1) moves the logic worth testing into core's vitest
  instead; test the logic where it should live rather than adding a JSDOM
  harness to test it where it shouldn't.

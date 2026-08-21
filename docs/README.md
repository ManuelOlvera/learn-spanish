# Documentation index

Markers: **[living]** kept current with the code · **[append-log]** grows, never rewritten · **[archived]** historical.

- [features/shipped.md](features/shipped.md) — **[append-log]** write-ups of shipped features
- [features/roadmap.md](features/roadmap.md) — **[living]** planned two-kid interactivity features and build order
- [bugs.md](bugs.md) — **[living]** the parent's running bug/idea inbox; items get struck through with their resolution as they're fixed, shipped, or parked
- [features/pairing.md](features/pairing.md) — **[living]** parent-facing how-to for cross-device sync (pairing codes)
- [storybook/](storybook/) — **[living]** copy-paste image-generation prompts, one file per cuento, plus the cast bible and house style that keep the pictures one book ([index](storybook/README.md))
- [workflows/adding-a-feature.md](workflows/adding-a-feature.md) — **[living]** the feature pipeline: shape → design → TDD → verify → docs → ship
- [workflows/fixing-a-bug.md](workflows/fixing-a-bug.md) — **[living]** the bug pipeline: investigate → regression test → fix at the owning layer → ship
- [skills/frontend-design.md](skills/frontend-design.md) — **[living]** the app's visual language (Sticker Book); read before building any UI
- [skills/feature-shaping.md](skills/feature-shaping.md) — **[living]** the /shape process: forcing questions + shape block
- [skills/debugging.md](skills/debugging.md) — **[living]** the /investigate discipline + case log
- [architecture-diagrams.md](architecture-diagrams.md) — **[living]** the system on one page: monorepo graph, sync sequence, localStorage key inventory
- [runbooks.md](runbooks.md) — **[living]** deploy, rollback, and Vercel gotchas
- `supabase/migrations/` — not docs, but load-bearing: SQL applied by hand to the live project per the runbook, **before** the code that needs it ships
- [fable-review/](fable-review/) — **[archived]** point-in-time implementation review (2026-07-13):
  [security](fable-review/security.md) · [code quality](fable-review/code-quality.md) ·
  [architecture](fable-review/architecture.md) · [docs](fable-review/docs.md) ·
  [claude skills](fable-review/claude-skills.md) · [features](fable-review/features.md)
- [adr/](adr/) — **[append-log]** architecture decision records (template: [adr/000-template.md](adr/000-template.md))
  - [adr/001-browser-speech-synthesis.md](adr/001-browser-speech-synthesis.md) — audio via the Web Speech API, not recorded files
  - [adr/002-vercel-hosting.md](adr/002-vercel-hosting.md) — Vercel hosting, no database, public prod URL
  - [adr/003-ephemeral-voice-recordings.md](adr/003-ephemeral-voice-recordings.md) — say-it-back clips live in memory only, never stored or sent
  - [adr/004-optional-supabase-sync.md](adr/004-optional-supabase-sync.md) — local-first with optional Supabase sync; pairing code as capability, no accounts
  - [adr/005-hand-rolled-service-worker.md](adr/005-hand-rolled-service-worker.md) — offline via a hand-rolled service worker, not next-pwa/Workbox
  - [adr/006-wallet-epoch-reset.md](adr/006-wallet-epoch-reset.md) — wallet epochs: the one sanctioned way to reset star balances under the additive merge
  - [adr/007-wallet-restore-seeded-balances.md](adr/007-wallet-restore-seeded-balances.md) — epoch 2 restores wallets after the zero reset: goodwill balances seeded by avatar
  - [adr/008-counter-wallet.md](adr/008-counter-wallet.md) — the wallet is two monotonic counters (earned/spent), so syncing can never resurrect a spend
  - [adr/009-story-art-assets.md](adr/009-story-art-assets.md) — story illustrations: committed PNGs imported from `src/` (hashed, so the service worker self-invalidates), no precache
  - [adr/010-runtime-llm-conversation.md](adr/010-runtime-llm-conversation.md) — **proposed, feature parked**: the terms a spoken AI conversation partner must be built under (browser-side transcription — audio never reaches our server but *does* reach Apple/Google, nothing persisted, a capability code on the route with rate limiting behind it, one tile that vanishes offline) — plus why a device-held API key was rejected
  - [adr/011-pairing-qr.md](adr/011-pairing-qr.md) — pairing by QR: a hand-rolled encoder (no runtime deps), the code in the URL fragment so it stays out of server logs, and a confirm on the scanning device
  - [adr/012-learned-bar-and-trend-restart.md](adr/012-learned-bar-and-trend-restart.md) — a word is "learned" at two correct answers, not one; why every count dropped and the weekly trend restarted on a new key rather than drawing a cliff that never happened
  - [adr/013-answer-log.md](adr/013-answer-log.md) — answers carry their game and a timestamp; the log stays on the device and forgets after 90 days, and why syncing it was rejected (payload cost + an append-log merge ADR 004 doesn't have)
  - [adr/014-timed-boost-stays-local.md](adr/014-timed-boost-stays-local.md) — the ⚡ hora doble window never syncs (an expiring timestamp is the one shape ADR 004's additive merge can't carry), expiry is decided on read, and a chest's multiplier locks when the chest is computed
  - [adr/015-vector-card-art.md](adr/015-vector-card-art.md) — a card may carry a drawing as an `image` *key* rendered by an inline SVG component (why not ADR 009's JPEGs, why not `next/image`), emoji stays required as a never-rendered fallback, and the deck invariant moves from "no repeated emoji" to "no repeated picture"
  - [adr/016-camino-derived-and-unlocked.md](adr/016-camino-derived-and-unlocked.md) — el camino holds no state of its own (every step recomputed from the album, so no key, no migration, nothing new to merge) and never gates content: it marks the next stop, it does not lock the others; why mastery was rejected as the completion rule, and what a step can therefore never express

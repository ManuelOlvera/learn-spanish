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
- [quality-review-followups.md](quality-review-followups.md) — **[living]** the 2026-08-28 review's follow-up list, each item marked done / corrected / deliberately deferred
- [quality-review-2026-08-31.md](quality-review-2026-08-31.md) — **[living]** the 2026-08-31 whole-codebase review: gates, eight findings, all eight now fixed, plus the security and UX passes that followed (SQL trust model, capability-key lifetime, target-size and contrast audit, the Crockford fold) and the two things deliberately left alone with reasons
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
  - [adr/016-camino-derived-and-unlocked.md](adr/016-camino-derived-and-unlocked.md) — **superseded in part by 021** — el camino holds no state of its own (every step recomputed from the album, so no key, no migration, nothing new to merge) and never gates content: it marks the next stop, it does not lock the others; why mastery was rejected as the completion rule, and what a step can therefore never express. The derivation half still stands; the never-locks half does not
  - [adr/017-one-roller-for-the-week.md](adr/017-one-roller-for-the-week.md) — rolling the weekly streak is a *write*, and the write is the celebration, so exactly one screen (home) may call it and every screen that merely shows la racha reads a no-write projection; also why the Semana card ended up on `/informe` after two moves
  - [adr/018-staleness-beside-the-learned-bar.md](adr/018-staleness-beside-the-learned-bar.md) — el repaso asks about words going **quiet** as well as words going **wrong**: `WordStat` gains an optional `seen` day stamp, and staleness sits *beside* ADR 012's learned bar rather than inside it, so no count on `/informe` moved and the trend series did not restart; why the answer log's timestamps were rejected as the source (it never syncs, so review would have gone per-device)
  - [adr/019-failure-states-a-parent-can-see.md](adr/019-failure-states-a-parent-can-see.md) — the three failures the app only ever logged (a failed sync exchange, a snapshot over the server's 64 KB cap, a refused `localStorage` write) get a state on the grown-up screens; why the storage record is held in memory rather than stored, and why the size ceiling is deferred rather than removed
  - [adr/020-earn-side-rebalance.md](adr/020-earn-side-rebalance.md) — mascotas are made reachable by raising the **earn side** (`STARS_PER_CORRECT` 1 → 3, and every bonus denominated against it) rather than cutting the `PET_SPECIES` price ladder ADR 007 protects; why this needs no wallet epoch or migration (earning only raises `earned`, which ADR 008 already merges by `max`), why the mistake penalty is counted in answers rather than stars, and why the *ordering* between misión, reto and category bonuses is the rule the tests pin rather than the numbers
  - [adr/021-camino-gates-and-exams.md](adr/021-camino-gates-and-exams.md) — **supersedes 016 on gating**: a shelf is locked until the previous one is complete *and* its **exam** passed (10 questions, four picture choices for both profiles, 7 to pass). Why the lock had to reach the home grid rather than just the Tu camino strip, why the audience widening (an eight-year-old beside the pre-readers) is what changed, why gating is per shelf and never per deck, and how grandfathering is derived rather than migrated so nobody is sent back to shelf 1
  - [adr/022-exam-record.md](adr/022-exam-record.md) — the exam ledger is `{ bestScore, attempts }` per shelf, merged by per-counter `max` like `retoBests`; **passing is derived from `bestScore`, never stored as a flag** that could disagree with it after a merge, and the post-failure retry gate stays device-local for ADR 014's reason

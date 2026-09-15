# ADR index

A lookup table for finding the decisions that constrain a given area of code
**before** changing it. Topics first (what am I touching?), then the full list.

The one-line summaries here are a pointer, not the decision — **read the file in
full** before acting on it. Prose summaries also live in
[`../README.md`](../README.md); this file exists for the keyword lookup.

**Status:** all accepted except [010](010-runtime-llm-conversation.md), which is
**proposed and its feature parked** — none of its terms have been exercised.
[007](007-wallet-restore-seeded-balances.md) supersedes 006's epoch-1 *zero*
outcome (the epoch mechanism itself is unchanged); [008](008-counter-wallet.md)
fixes a spend-resurrection bug in 004's merge. ADRs 001, 004, 005, 012 and 013
carry dated addenda — read them, not just the Decision.
[020](020-earn-side-rebalance.md) works *within* 007 rather than superseding it: it
moves the earn side and leaves the price ladder 007 protects untouched.

## By topic / component

| If you are touching… | Read |
|---|---|
| Audio, TTS, voices, `lib/speech.ts` | [001](001-browser-speech-synthesis.md), [010](010-runtime-llm-conversation.md), [019](019-failure-states-a-parent-can-see.md) |
| Album, stickers, category tiers | [016](016-camino-derived-and-unlocked.md), [020](020-earn-side-rebalance.md), [004](004-optional-supabase-sync.md) |
| Answer recording, stats, `recordAnswer` | [013](013-answer-log.md), [012](012-learned-bar-and-trend-restart.md), [018](018-staleness-beside-the-learned-bar.md) |
| Card art, drawings, `CardFace`, emoji | [015](015-vector-card-art.md), [009](009-story-art-assets.md) |
| El camino / the trail, `buildCamino` | [016](016-camino-derived-and-unlocked.md) |
| El repaso, review selection, `weakScore`, decay | [018](018-staleness-beside-the-learned-bar.md), [012](012-learned-bar-and-trend-restart.md) |
| Chests, boosts, hora doble | [020](020-earn-side-rebalance.md), [014](014-timed-boost-stays-local.md), [008](008-counter-wallet.md) |
| Deploy, hosting, Vercel, env vars | [002](002-vercel-hosting.md), [004](004-optional-supabase-sync.md) |
| Dependencies, adding a runtime package | [011](011-pairing-qr.md), [010](010-runtime-llm-conversation.md) |
| Failure states, quota, a warning a parent sees | [019](019-failure-states-a-parent-can-see.md), [004](004-optional-supabase-sync.md), [001](001-browser-speech-synthesis.md) |
| Images, story art, `pnpm art` | [009](009-story-art-assets.md), [015](015-vector-card-art.md) |
| LLM, API keys, route handlers | [010](010-runtime-llm-conversation.md) |
| Merge rules, `mergeProgress`, `ProgressSnapshot` | [004](004-optional-supabase-sync.md), [006](006-wallet-epoch-reset.md), [008](008-counter-wallet.md), [013](013-answer-log.md), [014](014-timed-boost-stays-local.md), [016](016-camino-derived-and-unlocked.md), [018](018-staleness-beside-the-learned-bar.md) |
| Microphone, recording, say-it-back | [003](003-ephemeral-voice-recordings.md), [010](010-runtime-llm-conversation.md) |
| Offline, service worker, `sw.js`, caching | [005](005-hand-rolled-service-worker.md), [009](009-story-art-assets.md), [015](015-vector-card-art.md) |
| Pairing, QR, capability codes | [011](011-pairing-qr.md), [004](004-optional-supabase-sync.md), [010](010-runtime-llm-conversation.md) |
| Privacy, kids' data leaving the device | [003](003-ephemeral-voice-recordings.md), [010](010-runtime-llm-conversation.md), [013](013-answer-log.md) |
| Reports, `/informe`, parent-facing screens | [012](012-learned-bar-and-trend-restart.md), [013](013-answer-log.md), [017](017-one-roller-for-the-week.md), [018](018-staleness-beside-the-learned-bar.md), [019](019-failure-states-a-parent-can-see.md) |
| Snapshot size, the 64 KB cap, payload pruning | [019](019-failure-states-a-parent-can-see.md), [004](004-optional-supabase-sync.md) |
| Storage keys, localStorage, migrations | [006](006-wallet-epoch-reset.md), [012](012-learned-bar-and-trend-restart.md), [013](013-answer-log.md), [014](014-timed-boost-stays-local.md) |
| Supabase, sync, RPCs, RLS | [004](004-optional-supabase-sync.md), [002](002-vercel-hosting.md) |
| Trend chart, "learned", mastery | [012](012-learned-bar-and-trend-restart.md), [016](016-camino-derived-and-unlocked.md), [018](018-staleness-beside-the-learned-bar.md) |
| Wallet, stars, prices, spending | [020](020-earn-side-rebalance.md), [008](008-counter-wallet.md), [006](006-wallet-epoch-reset.md), [007](007-wallet-restore-seeded-balances.md), [014](014-timed-boost-stays-local.md) |
| Weekly streak, la racha, freezes | [017](017-one-roller-for-the-week.md), [004](004-optional-supabase-sync.md) |

## Every decision

| ADR | Decides | Touches |
|---|---|---|
| [001](001-browser-speech-synthesis.md) | Card audio is the Web Speech API with an `es-*` voice, not recorded files or a TTS API. Accent preference `es-ES`; a speaker role (`pet`/`kid`) was added, but **Chrome on Android does not enumerate voices** — read the addenda. | `apps/web/src/lib/speech.ts` |
| [002](002-vercel-hosting.md) | `apps/web` deploys to Vercel with no database or auth backend; the production URL is public by design. Revisited twice — see the 2026-07-13 note pointing to ADR 004. | Vercel project, `docs/runbooks.md` |
| [003](003-ephemeral-voice-recordings.md) | Say-it-back clips live in a JavaScript variable only — never stored, never uploaded, mic stopped the instant recording ends. No "listen to yesterday" feature can exist. | MediaRecorder path, 🎤 button |
| [004](004-optional-supabase-sync.md) | Progress is local-first with **optional** Supabase sync: a 20-symbol pairing code *is* the capability key, fenced behind `SECURITY DEFINER` RPCs, additively merged. **Addenda:** cross-device pushes are last-write-wins by design; a device-local pull race was fixed 2026-07-14. | `domain/sync.ts`, `mergeProgress`, `packages/config/src/env.ts` |
| [005](005-hand-rolled-service-worker.md) | Offline is a hand-rolled service worker — navigations network-first, same-origin subresources cache-first, cross-origin and non-GET untouched. **Addendum:** the cache is capped at `MAX_ENTRIES` and evicted FIFO, *not* keyed to the build id. | `apps/web/public/sw.js`, `ServiceWorkerRegistrar` |
| [006](006-wallet-epoch-reset.md) | `WALLET_EPOCH` is the one sanctioned way to reset star balances against ADR 004's `max` merge: bump the constant plus a run-once storage migration. Only **stars** are epoch-gated. | `domain/stars.ts`, `lib/storage-migrations.ts` |
| [007](007-wallet-restore-seeded-balances.md) | **Supersedes 006's epoch-1 zero outcome.** Epoch 2 seeds goodwill balances by avatar as `max(current, seed)` — nothing is ever zeroed or reduced. Do not rebalance prices to the seeds. | `WALLET_SEED_BY_AVATAR` in `domain/stars.ts` |
| [008](008-counter-wallet.md) | A wallet is `{ earned, spent }` — two monotonic counters merged per-counter by `max` — so syncing can never resurrect a spend. All spending goes through `trySpend`; no code writes a balance directly. | `EconomyStore`, `domain/stars.ts` |
| [009](009-story-art-assets.md) | Story art is committed JPEGs under `src/` (hashed, so the service worker self-invalidates), 800px at q68 via `pnpm art`, **not precached**. A missing key falls back to the emoji scene. | `src/story-art/`, `lib/story-art.ts`, `scripts/optimize-story-art.sh` |
| [010](010-runtime-llm-conversation.md) | **Proposed, feature parked.** The four terms a spoken AI partner must be built under: browser-side transcription (audio reaches Apple/Google, never our server), nothing persisted, a capability code with rate limiting behind it, one tile that vanishes offline. A device-held API key was rejected. | *(nothing built — no route, no key)* |
| [011](011-pairing-qr.md) | Pairing by QR with a hand-rolled encoder (no runtime deps), the code in the **URL fragment** so it stays out of server logs, and a confirm on the scanning device. The typeable code stays visible. | `packages/core/src/domain/qr.ts`, `parseSyncLink` |
| [012](012-learned-bar-and-trend-restart.md) | A word is "learned" at `right >= 2` and `weakScore <= 0`, not one correct answer. Every displayed count dropped and the trend restarted under `palabras.trend.v2`. **Do not lower this bar to make a chart look better.** | `domain/trend.ts`, `/informe`, `DoneScreen` |
| [013](013-answer-log.md) | Answers carry their game and a timestamp; the log **never leaves the device** and forgets after 90 days. It powers accuracy-per-game and the practice calendar only. Syncing it reopens this ADR *and* 004. | `domain/answer-log.ts`, `RecordAnswerUseCase` |
| [014](014-timed-boost-stays-local.md) | The ⚡ hora doble window does not sync — an expiring timestamp is the one shape 004's additive merge cannot carry. Expiry is decided on read; a chest's multiplier locks when the chest is computed. | `palabras.boost.v1`, `activeBoost` |
| [015](015-vector-card-art.md) | A card may carry an `image` **key** rendered by an inline SVG component (not JPEGs, not `next/image`); `emoji` stays required as a never-rendered fallback, and the deck invariant becomes "no repeated *picture*". | `src/card-art/`, `lib/card-art.ts`, `CardFace`, `cardPicture` |
| [016](016-camino-derived-and-unlocked.md) | El camino holds **no state of its own** (every step recomputed from the album) and **never gates content**. Completion is not mastery. A step cannot express anything the album cannot. | `buildCamino`, `domain/category.ts`, `trail.ts`, Tu camino strip |
| [017](017-one-roller-for-the-week.md) | `RolloverWeeklyUseCase` **writes** and the write is the celebration, so exactly one screen (home) may call it; every other screen calls `ReadWeeklyUseCase`. The Semana card lives on `/informe`. | `RolloverWeeklyUseCase`, `ReadWeeklyUseCase`, `WeeklyCard` |

| [018](018-staleness-beside-the-learned-bar.md) | El repaso asks about words going **quiet** as well as words going **wrong**. `WordStat` gains an optional `seen` day stamp; staleness sits *beside* ADR 012's learned bar and never inside it, so no count moved and the trend did not restart. | `domain/review.ts`, `domain/word-stats.ts`, `RepasoView`, `/informe` |
| [019](019-failure-states-a-parent-can-see.md) | The three failures the app used to only log — a failed sync exchange, a snapshot over the 64 KB cap, a refused `localStorage` write — get a parent-facing state on the grown-up screens. The storage record is held in memory, because storage is the thing that failed. | `lib/sync-health.ts`, `lib/storage-health.ts`, `SyncPanel`, `/informe` |

| [020](020-earn-side-rebalance.md) | Mascotas are made reachable by raising the **earn side** (`STARS_PER_CORRECT` 1 → 3, every bonus with it), never by cutting `PET_SPECIES` prices (ADR 007). No wallet epoch and no migration — earning only raises `earned`, which ADR 008 already merges safely. Bonus *ordering* is the rule, pinned by tests. | `domain/stars.ts`, `domain/category.ts`, `domain/challenge.ts` |

`000-template.md` is the ~10-line template, not a decision.

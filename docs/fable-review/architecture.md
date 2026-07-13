# Architecture review — 2026-07-13

> **Status update (2026-07-13):** findings 1–4 implemented — the economy
> orchestration now lives in core as an `EconomyStore` port + 18 tested use
> cases (`apps/web/src/lib/economy.ts` is a thin facade; purchase prices come
> from core catalogs, not callers); all client adapters are constructed only
> in `apps/web/src/lib/client-container.ts`; localStorage migrations run once
> from `storage-migrations.ts`; the sync last-write-wins trade-off is recorded
> as an addendum in ADR 004. Findings 5–6 were no-action-by-design and stand.
> See `docs/features/shipped.md` for the write-up.

The declared architecture (DDD layering in `packages/core`, presentation-only
apps, ports in `domain/`, adapters wired at composition roots) is real, not
aspirational: core has zero runtime dependencies, never imports a framework,
and the sync feature landed as a port (`RemoteProgressStore`) + two use cases +
one adapter, exactly as the rules prescribe. Findings in priority order.

## 1. `apps/web/src/lib/economy.ts` is a business-logic layer outside core

At 641 lines it is the largest file in `apps/web`, and it does more than adapt
storage: `spendStars`/`addStars` transaction ordering, purchase idempotence
(`buyAvatar`, `unlockDeck`, `adoptSpecies` all check-then-spend-then-write),
the mission→weekly cascade (`markActivityDone` calls `markMissionActiveDay`),
`claimMissionBonus`'s claim-once rule, and two storage migrations (legacy pet →
collection, per-pet accessories → wardrobe). None of it is unit-tested — the
80% coverage floor only guards `packages/core`.

The irony: core already exports the port types this file ignores (`StarStore`,
`MissionStore`, `PetStore` are in `packages/core/src/index.ts`). Recommend the
established pattern: a generic per-kid document port in `domain/`, use cases
like `BuyFreezeUseCase` / `ClaimMissionBonusUseCase` / `OpenSurpriseUseCase` in
`application/` (tested), and `economy.ts` shrinking to the localStorage adapter
plus wiring. This is the single highest-leverage refactor in the repo — it
moves the app's most intricate rules (money!) under the coverage floor.

## 2. Client-side wiring is scattered across four composition roots

`container.ts` (server-safe) is clean, but on the client side `album.ts`,
`transfer.ts:49`, and `sync.ts:22` each instantiate their own store singletons
— `LocalStorageAlbumStore` is constructed twice (album.ts and transfer.ts).
Harmless today because the stores are stateless over localStorage, but it
erodes the "one place adapters meet use cases" rule and will bite the first
time a store carries an in-memory cache. Consolidate into one
`client-container.ts` that everything client-side imports.

## 3. Sync convergence relies on read-merge-write without concurrency control

`PushProgressUseCase` loads the remote row, merges, and saves — two devices
pushing simultaneously last-write-wins, and one device's just-earned sticker
vanishes from the cloud until *that* device pushes again (its local copy is
safe; the merge-on-every-exchange design self-heals). This is a sound trade-off
for a family app and worth keeping — but record it. Options if drift ever
becomes visible: do the merge server-side in `put_progress` (jsonb union in
SQL, making pushes commutative) or add an `updated_at` compare-and-swap with a
retry. An ADR-004 addendum noting "last-write-wins window, self-healing" would
stop a future session from "fixing" it into something heavier.

## 4. localStorage schema evolution is ad-hoc

Eleven `palabras.*.v1/v2` keys, with migrations embedded inside readers
(`getPetCollection` migrates v1→v2 on read; `getOwnedAccessories` migrates
per-pet→wardrobe on read). It works, but each migration is invisible from
outside its reader and runs forever. A tiny versioned-migration registry (run
once per key version on app open, then write the new version) would make the
storage schema auditable in one place — worth doing before the next `v2`.

## 5. `packages/config` reads Next.js-shaped env vars

`supabaseConfig()` in `packages/config/src/env.ts:64` hard-codes
`NEXT_PUBLIC_*` member expressions — necessary for Next's static inlining (the
comment explains this correctly), but it means the "framework-agnostic" config
package now has a Next-specific seam. Acceptable; just don't let it spread: if
a second consumer platform ever appears, the inline-able reads belong in an
app-side shim that passes values into a platform-neutral `configure()`.

## 6. Content lives as TypeScript in core's infrastructure

`starter-pack.ts` (576 lines) and `sentence-pack.ts` (512 lines) are data
expressed as code. Fine at 28 decks — types check the content and the repo
pattern (static repository over an in-file pack) is clean. Two pressures will
eventually force a change: non-developer content editing, and bundle size
(every word ships in the client JS). When either arrives, move packs to JSON
validated by the existing type guards at module load; don't preempt it now.

## What already looks right (keep it)

- Dependency direction is enforced by reality: core has no runtime deps at all,
  so a `next/*` import physically can't sneak in unnoticed.
- Ports are honest interfaces (`RemoteProgressStore`, `AlbumStore`,
  `ByteSource` for entropy injection) and the tests exercise use cases through
  them with fakes — no mocking framework needed.
- The one shared sanitizer at every trust boundary (transfer code, cloud row)
  is a textbook anti-corruption layer.
- Local-first with additive merge (ADR 004) matches the product: reads never
  block on network, failure modes all degrade to "works like before sync".

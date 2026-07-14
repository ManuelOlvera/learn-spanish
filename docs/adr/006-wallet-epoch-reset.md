# ADR 006: Wallet epochs — the one sanctioned way to reset star balances

- **Date:** 2026-07-14
- **Status:** accepted (carves an exception out of ADR 004's "progress is monotonic");
  the epoch-1 *zero* outcome is superseded by ADR 007 (epoch 2 re-seeds wallets) —
  the mechanism below is unchanged

## Decision

Star balances get a **wallet epoch**: a `WALLET_EPOCH` constant in core
(`domain/stars.ts`), stamped onto every outgoing `ProgressSnapshot`
(`walletEpoch`, absent = 0). `mergeProgress` discards `stars` from the
older-epoch side instead of max-merging; everything else still merges
additively. Bumping the constant plus a run-once storage migration
(`wallet-epoch-N` in `apps/web/src/lib/storage-migrations.ts`) zeroes every
kid's balance on every device, and the first push rewrites the cloud row.

## Context

The 2026-07-14 economy rebalance raised prices ~10–20×; balances earned under
weekend-sized prices would have bought out the new catalog on day one. But a
naive local reset cannot stick: ADR 004's merge takes `max` on stars, so the
cloud row (which permanently holds the highest balance ever pushed) and old
transfer codes would resurrect the pre-reset wallet on the first sync.
A reset event fundamentally needs to outrank the additive merge.

## Consequences

- Only **stars** are epoch-gated. Owned items, freezes, streaks, stickers stay
  monotonic — a reset never un-buys or un-earns anything.
- Stars a kid earns on a not-yet-updated device *after* newer-epoch devices
  exist are lost on merge (their snapshot carries the old epoch). Accepted:
  the deploy-skew auto-reload keeps that window to roughly one session.
- Future resets are one constant bump + one migration entry; never zero the
  stars key ad hoc, or sync will undo it.

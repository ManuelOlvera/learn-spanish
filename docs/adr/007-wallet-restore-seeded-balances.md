# ADR 007: Restore wallets after the zero reset — seeded goodwill balances

- **Date:** 2026-07-15
- **Status:** accepted (supersedes ADR 006's epoch-1 *zero* outcome; the epoch
  mechanism itself is unchanged and is exactly what this uses)

## Decision

Wallet epoch 2 restores star balances instead of leaving them at zero:
`WALLET_SEED_BY_AVATAR` in core (`domain/stars.ts`) seeds 1000⭐ for the kid
whose avatar is 🐸 and 300⭐ for 🐯, applied per device as
`max(current, seed)` by the run-once `wallet-epoch-2` migration.

## Context

The epoch-1 reset (ADR 006) protected the rebalanced catalog but landed as
punishment — the kids saw their stars vanish. Reverting the reset commit
could not bring anything back (devices had already run the zeroing
migration, and the epoch merge blocks pre-reset balances by design), so the
restore rides ADR 006's own playbook: bump the epoch, seed via migration.
Seeds are keyed by avatar because kid profiles are semantic
("listener"/"reader"); the avatar is the only stable name for a child.

## Consequences

- Kids with other avatars just carry their balance into epoch 2 — nothing
  is zeroed or reduced anywhere; `max(current, seed)` keeps post-reset
  earnings.
- The seeded amounts dwarf the rebalanced prices for a while; that is the
  point (goodwill), not a pricing signal. Do not rebalance prices to them.
- Future wallet events remain: bump `WALLET_EPOCH` + one migration entry.

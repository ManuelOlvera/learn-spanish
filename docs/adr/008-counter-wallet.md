# ADR 008: The wallet is two monotonic counters, not a balance

- **Date:** 2026-07-15
- **Status:** accepted (fixes a spend-resurrection bug in ADR 004's merge)

## Decision

A wallet is `{ earned, spent }` — two counters that only ever grow — and the
balance is derived (`walletBalance = max(0, earned - spent)`). Snapshots carry
`wallets`; `mergeProgress` takes a **per-counter max**. The legacy `stars`
balance still rides along on every snapshot (derived) so pre-counter peers can
read the row, but wherever a counter wallet exists it is authoritative.
Wallet epoch 3 + the `wallet-epoch-3` migration convert each device's balance
into `{ earned: balance, spent: 0 }`.

## Context

ADR 004 max-merges progress, which is right for everything monotonic (stickers,
owned items, streaks). A raw star *balance* is not monotonic — spending lowers
it — so max-merge silently resurrected spends: buy a 300⭐ pet on the iPad,
open the phone (still holding the pre-spend balance), and the higher number
wins. The kid gets the pet **and** the stars back. Counters restore the
monotonicity the merge assumes: earning raises `earned`, spending raises
`spent`, and neither ever falls, so max is both idempotent and spend-safe.

## Consequences

- Spending must go through `trySpend` (balance checked *before* the write);
  no code may write a balance directly. `EconomyStore` speaks `Wallet` only.
- `stars` on a snapshot is now an emitted *view*, never a source of truth for a
  kid that has counters. Kids with no counters (old peers) still merge by max
  on the bare balance — the pre-ADR-008 behaviour, spend-resurrection included.
  That window closes once every device has opened the app on epoch 3.
- A negative balance is unrepresentable to callers (clamped at zero), so
  corrupt or hostile counters can't render a negative wallet.

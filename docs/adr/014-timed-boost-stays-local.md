# ADR 014: The ⚡ hora doble window is device-local, and expiry is decided on read

- **Date:** 2026-08-11
- **Status:** accepted (applies ADR 004's merge rules; sibling of ADR 013)

## Decision

The boost window (`{ tier, until }`, `palabras.boost.v1`) **does not sync**. It stays on
the device that won it, like the daily-gift claim day. Expiry is decided **on every read**
(`activeBoost`) rather than by a cleanup write, and the multiplier a chest pays is **locked
when the done screen computes the chest**, not when the kid taps it.

## Context

ADR 004 merges progress additively — sticker union, `max` of every counter — because
progress is monotonic and that makes conflicts resolve without prompts. An expiring
timestamp is the exact shape that rule cannot carry:

- `max(until)` never lets a window die: any device that saw the boost re-extends it on the
  next merge, and a `max` over `tier` makes every kid's best-ever boost permanent.
- Taking the *older* `until` instead ends live windows early on an unrelated pull.
- Either way the two devices disagree about what a chest is worth *while it is being won*,
  which is the one moment the number must not move.

The stars the boost produces do sync — they ride the wallet counters (ADR 008), which are
monotonic and already spend-safe. So nothing a kid earns is lost by keeping the window
local; only the window itself is per-device.

Locking the multiplier at compute time is a fairness rule, not an implementation detail:
the closed chest shows its amount before it is opened, and a 4-year-old who is slow to tap
must not be paid less than the number they were shown.

## Consequences

- A boost won on the tablet does not follow the kid to the phone. Accepted: both sources
  (🎁 regalo del día, 📦 caja sorpresa) are opened on the device being played on, and the
  window is minutes long — there is no realistic case where it should travel.
- `ProgressSnapshot` is unchanged; the transfer code and QR pairing inherit nothing new.
- No expiry timer, no cleanup write, no migration: a dead window is just a row that reads
  as `null`. A corrupt or hand-edited document also reads as `null` (`isBoost` rejects any
  tier that is not 2 or 3 — the obvious localStorage cheat is x10 forever).
- Making the window sync later means reopening ADR 004, not adding a field: it needs a
  merge rule for expiry, which the additive merge does not have.

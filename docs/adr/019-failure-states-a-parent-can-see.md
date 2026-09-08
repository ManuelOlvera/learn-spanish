# ADR 019: The three silent failures get a parent-facing state

- **Date:** 2026-09-08
- **Status:** accepted (addendum in spirit to ADR 004 and ADR 001; closes the
  quality review's open "a fix means a parent-visible failure state" note)

## Decision

Three failures that the app previously only wrote to a log now have somewhere a
parent can see them, on `/informe` and in the album's sync panel — the two
grown-up screens. No kid screen gains a failure state.

| Failure | Was | Now |
|---|---|---|
| A sync exchange fails | `log.warn`, retried silently forever | a line in the sync panel, dated from the last success |
| The snapshot exceeds the server's 64 KB cap | the same `log.warn` as a flaky network | its own message: local progress is safe, the cloud copy is not, and wifi is not the fix |
| `localStorage` refuses a write | every store logs and resolves | a `role="alert"` banner on `/informe` |

## Context

The app is deliberately failure-tolerant everywhere: `save()` catches, logs and
resolves so one bad write never takes a game down, and sync is best-effort so a
dropped exchange just retries. Both are right. What neither handles is a
failure that **does not stop**, and in that case tolerance becomes concealment —
`log.warn` on a family tablet is a message to nobody.

Each of the three is already known to have cost something real:

- A device whose pushes all fail is indistinguishable from a working one. The
  panel says "paired", the kids keep earning stickers locally, and two devices
  diverge until somebody notices months missing from the phone.
- The snapshot is pushed **in full on every game completion**, and a
  fully-played family measures ~73 KB of JSON against a 64 KB cap
  (`0002_progress_hardening.sql`) — most of it word stats and repeated sticker
  ids. This is a ceiling the family grows into, so unlike every other sync
  failure it never recovers, and "check your wifi" is actively wrong advice.
- A swallowed album write under a full quota is one of the two routes that
  produced the orphaned-medal bug (`docs/bugs.md`, 2026-09-01): a sticker the
  kid had earned never reached the album, and nothing anywhere said so.

## Consequences

- **The storage record is held in memory, not in storage.** This looks wrong
  and is the only thing that can work: the condition being reported is "writes
  are failing", so a record needing a write to survive is precisely the record
  that would not be there. It lasts the session, which is long enough — the
  next session re-raises it on the next refused write.
- Only a real `QuotaExceededError` raises it. A disabled or private-mode store
  throws too, and "your device is full" is the wrong fix to hand that parent.
- `SnapshotTooLargeError` is matched **by name** (`isSnapshotTooLarge`), like
  `isTimeoutError` before it, not by `instanceof` — class identity is not
  stable across a duplicated module, and this error picks between two quite
  different things to tell a parent.
- Sync health is device-local and deliberately **not** in `ProgressSnapshot`.
- A 24-hour silence is reported even when nothing errored: sync runs on app
  open and every game completion, so a day without one is itself evidence.
- **This buys time on the size ceiling; it does not remove it.** The counts
  ledger is now pruned on emit (orphans, and ones that say nothing the sticker
  did not — `pruneStickerCounts`), which is lossless under `stickerCount`'s own
  definition and worth a few KB. The remaining ~38 KB is word stats, whose key
  names repeat per word. Compacting the wire format would roughly halve the
  payload and was deliberately **not** done here: it changes a shape ADR 004
  governs, every reader must accept both forms forever, and it should be a
  decision of its own rather than a side effect of adding a warning.
- ADR 001's "audio silently degrades to nothing" is likewise now *reported*
  rather than accepted in silence — see its 2026-09-08 addendum. The adapter is
  unchanged.

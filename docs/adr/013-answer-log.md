# ADR 013: The answer log — on the device, and only 90 days of it

- **Date:** 2026-08-03
- **Status:** accepted

## Decision

Every recorded answer now carries **which game** it came from and **when**
(`domain/answer-log.ts`). That log is bound by two rules:

1. **It never leaves the device.** `palabras.answer-log.v1` is absent from
   `ProgressSnapshot`, so no per-answer record of a child rides the Supabase
   row or the transfer code. Each device reports on its own history.
2. **It forgets after `LOG_RETENTION_DAYS` (90).** Pruned on every write *and*
   on every read, so a device that has not played in months cannot show a day
   outside the window the screen promises. A `MAX_LOG_EVENTS` cap backstops a
   runaway; the date window is the actual policy.

It powers exactly two views: accuracy per game, and the practice calendar.

## Context

`recordAnswer(kid, cardId, correct)` was called by eleven games and recorded
none of that context, so "is Adivina teaching or just entertaining?" and "do
they still play on weekdays?" were unanswerable from data the app already had.

Syncing it was considered and rejected on two grounds, the second decisive:

- **Cost.** The sync payload is one JSON blob, pushed in full on every game
  completion (`PushProgressUseCase`). An unbounded per-answer log inside it
  grows roughly a megabyte per kid per year and is re-uploaded after every
  game — the mechanism eventually breaks under its own history.
- **Blast radius.** An append-only log needs merge rules ADR 004's
  additive/max merge does not have (dedupe by event id, not `max`), and the
  thing being merged would be the most detailed record this app has ever kept
  of a five-year-old. Keeping it on-device removes the question rather than
  answering it.

A per-device daily rollup — small enough to sync safely — was designed and set
aside as unnecessary complexity for two screens a parent reads on the tablet
the kids actually play on.

## Consequences

- **The two new views are per-device.** A newly paired tablet shows an empty
  calendar even though its stickers and word stats sync. This is the same
  trade the trend chart already makes (ADR 012), and it must be described that
  way on screen — the calendar carries "solo en este dispositivo".
- Clearing browser storage loses the history for good; nothing else does.
- `RecordAnswerUseCase.execute` takes named arguments now. It had four
  parameters, two of them booleans, and `execute(kid, id, true, false)` was one
  transposition away from recording the opposite of what happened.
- **Accuracy only covers games that ask questions.** Las tarjetas, las parejas,
  los cuentos and las frases record no answers, so they are absent from that
  view rather than shown at 0% — "never asked" and "always wrong" must not
  render the same. The screen says so.
- Writing on every answer is now two storage writes (stats + log) instead of
  one. The log write is best-effort and never blocks the tally.
- If this log is ever wanted across devices, it reopens **this ADR and
  ADR 004 together** — start from the rollup design in Context, never by
  dropping the raw log into the snapshot.

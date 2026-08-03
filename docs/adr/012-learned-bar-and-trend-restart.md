# ADR 012: What "learned" means, and why the trend series restarted

- **Date:** 2026-08-03
- **Status:** accepted

## Decision

A word counts as **learned** at `right >= 2` and `weakScore <= 0`
(`LEARNED_MIN_RIGHT` in `domain/trend.ts`). It used to be `right > 0`.

Two consequences are accepted deliberately:

1. **Every displayed count dropped the day this shipped.** The informe's
   "palabras aprendidas", the trend chart, and the new report's mastery
   figures all re-score existing tallies against the higher bar. Nothing was
   lost — the underlying right/wrong tallies are untouched — but the numbers a
   parent saw last week are not the numbers they see now.
2. **The weekly trend restarted** under a new key (`palabras.trend.v2`). The
   v1 samples are left in place, unread, per the storage-migration rules.

Trend samples are also taken on **game completion** now, not only when a
parent opens the informe, and `recordSample` backfills skipped weeks flat.

## Context

One correct answer marked a word learned forever, until it was later missed. A
quiz round shows three pictures, so that is a 33% guess — and higher once a kid
learns to rule out the obviously wrong options. The headline number on the
parent report, and every bar of the trend built on top of it, were inflated by
an unknown amount that grew with how much the kids guessed.

Two rejected alternatives:

- **`right >= 3`.** Stricter, and ~4% by chance rather than ~11%. Rejected
  because a word then takes so long to qualify that the weekly chart stops
  moving, and a chart that never moves is its own kind of lie to a parent
  looking for evidence their kid is progressing.
- **Recompute the old samples under the new bar.** Impossible, and worth
  writing down so nobody tries: a `TrendSample` stores a *count*, not the
  tallies it was computed from. There is no way back to the inputs.

Keeping the v1 samples in the same chart was the other option, and it is the
one that looks harmless and isn't: old and new bars would measure two
different things, and the chart would show a cliff on the deploy date that no
child ever experienced. A parent reading that would conclude their kid
*forgot* 50 words. Restarting shows less history and tells no lie.

The sampling change is a separate bug with the same symptom. Sampling only on
informe-open meant a week nobody looked had no bar at all, and the delta
between two distant samples was labelled "esta semana" — so a parent checking
in monthly read a month of progress as a week of it.

## Consequences

- The trend chart is empty again on every device, and shows "primera semana
  registrada" until a second week is sampled.
- `palabras.trend.v1` is dead weight on every device that has it. It is small
  and harmless; per the migration rules the key is never deleted.
- Sampling now happens on the `DoneScreen` completion path, which runs after
  every game. It is idempotent within a week, so finishing ten games costs one
  write — but it is a hot path, and anything added there must stay cheap.
- **Do not lower this bar to make a chart look better.** If the numbers feel
  discouraging, the answer is a different view (per-deck mastery, the shaky
  list), not a lower threshold. That is the change this ADR exists to stop.
- Any future change to `LEARNED_MIN_RIGHT` has the same two costs: every count
  moves, and the series has to restart again. It gets a new key and a new ADR.

# ADR 018: Words go quiet as well as wrong — and staleness sits beside "learned", not inside it

- **Date:** 2026-09-08
- **Status:** accepted (extends ADR 012's bar and ADR 013's log; constrained by ADR 016)

## Decision

El repaso now asks about two kinds of word: the ones a kid keeps getting
**wrong** (`weakScore`, unchanged) and the ones they had and have stopped
seeing (`isStaleStat`, new, in `domain/review.ts`). A `WordStat` gains an
optional `seen` day stamp (`dayIndex`) to make the second one answerable.

**Staleness is a second signal, not a change to the first.** ADR 012's
`isLearnedStat` is untouched and is *read* here rather than restated. Nothing
in `domain/review.ts` feeds a count, a mastery figure, or the trend chart.

## Context

Until now the app had no time dimension in what it knew about a word.
`weakScore` is `wrong × 2 − right` — a pure tally — so a word answered right
twice in July was never asked again, whatever the date, and a word at 3 right /
1 wrong scored −1 and was invisible to el repaso forever. Everything else the
app measures measures how much has been **played**: medals, sticker counts, el
camino, the tiers. Nothing measured what was slipping away.

The obvious implementation was to put decay into `weakScore`, and it is the one
this ADR exists to rule out. `weakScore` is half of ADR 012's definition of
learned (`right >= 2 && weakScore <= 0`), so decaying it would make words
silently **un-learn**: every "palabras aprendidas" count on `/informe` would
drop, per-shelf mastery would fall, and the trend chart would draw a cliff on
the deploy date that no child ever experienced. ADR 012 restarted the whole
series under a new key specifically to avoid a parent reading a cliff as *"my
kid forgot 50 words"* — reintroducing one through the back door, for a kid who
had in fact forgotten nothing measurable, is the same lie with a better excuse.

Two other placements were considered and rejected:

- **Read the answer log's timestamps** (ADR 013). It already stores per-card
  `at` values for 90 days, so it needs no new field. Rejected because the log
  **never leaves the device** by design: review would silently become
  per-device, so a word drilled on the tablet would still read as decayed on
  the phone while the stickers and tallies behind it synced. It would also make
  a third consumer of a log ADR 013 deliberately scoped to two views. A stamp
  on `WordStat` rides the sync that already exists.
- **Surface decay on el camino.** Ruled out by ADR 016: a step "cannot express
  anything the album cannot", and time is exactly such a thing. The route still
  marks content, not memory.

`STALE_AFTER_DAYS` is 14, chosen against how this family plays rather than
against a forgetting curve — the kids play most days, so a fortnight of silence
on one word means the pack has genuinely moved past it, while a week would flag
words they simply have not cycled back to yet.

## Consequences

- **The stamp is optional and must stay optional.** Every tally on every
  existing device has none, and an unstamped word reads as *never timed*, not
  as last seen at the epoch — guessing would have offered the entire pack for
  review on upgrade day. `daysUnseen` returns `null`, never `0`.
- `seen` merges by `max` like every other counter under ADR 004, so practising
  on one device un-stales the word on the other. A stamp from a device with a
  wrong clock is floored at "just seen" rather than sorting to the front.
- `recordAnswer` and `recordReviewAnswer` take `today` as a required argument.
  Not optional: a tally written without a stamp is invisible to this pass
  forever after, and a default would have hidden that at every call site.
- **Home's 🔁 chip now counts both kinds.** A kid with nothing wrong but a
  month of untouched words now gets a repaso offered, which is the case that
  had no screen at all before. `pickShakyCards` keeps the old shaky-only
  meaning for `/informe`'s "las difíciles", where calling an unpractised word
  tricky would be a false accusation.
- Shaky words fill a repaso session first and stale words take the remainder,
  so a kid drowning in missed words never has their session diluted by decay.
- The parent report grows a **🌙 Se van durmiendo** list, separate from
  **🔁 Para practicar**. One list of both would leave a parent unable to tell
  which problem they were looking at.
- **If a future change ever does want decay inside the learned bar**, it pays
  ADR 012's price in full: every displayed count moves, and the trend series
  restarts on a new key with a new ADR. That is the cost this split avoids, not
  one it removes.

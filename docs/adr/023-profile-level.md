# ADR 023: A profile's level is a field, and it is the one thing sync can take back

- **Date:** 2026-09-20
- **Status:** accepted (the first field ADR 004's additive merge cannot carry
  *and* ADR 014's device-local escape hatch does not fit; applies ADR 021's
  "one bar, computed once" discipline to the album)

## Decision

`KidId` stops meaning a difficulty. A profile carries a **`level`** —
`"listen"` or `"read"` — set by a grown-up on `/informe`, **in both
directions**. The ids `listener` / `reader` stay exactly as they are, as opaque
profile keys.

`palabras.levels.v1` holds `{ level, at }` per profile. It rides
`ProgressSnapshot.levels` and merges by **later `at` wins**.

A sticker earned at one level **satisfies its counterpart at the other** — the
*twin rule*, in `stickerCount`. So a promotion costs a kid nothing: no medal,
no completed deck, no place on el camino.

## Context

The roadmap asked for this on 2026-07-14, when a parent said the 5-year-old
would eventually need "the next age bracket". The obstacle was not the setting;
it was that **the two profiles *were* the two levels**, as `kid.ts` said out
loud: *"The two difficulty profiles. Semantic, not personal."* Two reading
children need two read-level profiles, and the model had no way to say that.

**Renaming the ids was rejected.** Every storage key, every sticker id
(`listener:animals:quiz-listen`), the whole snapshot and every paired device
are keyed on those strings. Renaming means a migration of everything, for a
cosmetic gain — the kids have always identified by 🦖 and 🦄, never by the
words. Keeping the ids opaque costs one thing only: a reader of the code has
to know that `listener` is a key, not a claim. That is what this ADR is for.

**The level has to sync, and it is not monotonic.** Everything else in
`ProgressSnapshot` is a counter, a set or a high-water mark, chosen that way so
merge order cannot matter. A level goes back down, so it cannot ride that rule.
The two existing escape hatches were both considered and neither fits:

- **Device-local** (ADR 014's ⚡ boost, ADR 022's retry gate) would leave her
  reading on the tablet and listening on the phone. That is worse than not
  shipping it: a kid would meet two different apps.
- **Monotonic** — "promotion only, never back" — merges trivially and was
  rejected on the parent's behalf. "She can read" is a judgement made over
  weeks, so an early promotion is likely, and a one-way door leaves a
  five-year-old facing written Spanish with no way back.

So it merges by **later wins**, which is not new: `weekProgress` and `missions`
already supersede by a later day. The stamp is epoch-ms rather than a day key
because two devices can genuinely differ within a day, and a tie — which needs
the same millisecond — resolves to `read`. That choice is arbitrary; being
**commutative** is not, or the answer would depend on which device synced
first.

## Consequences

- **No migration, and no behaviour change for anyone who never touches it.** An
  absent level means the one its id has always implied, so every existing
  device reads exactly as it did. The `levels` key is omitted from the snapshot
  entirely when empty.
- **The twin rule is a no-op until someone is promoted.** Each profile has only
  ever earned its own level's stickers, so there is no twin to find — which is
  what lets the rule apply unconditionally, with no "was promoted" flag to
  store and drift out of agreement with reality.
- **It is `max`, not a fallback or a sum.** A fallback would let her medal
  *drop* the moment she earned her first read sticker (count 1, against a
  listen count of 3); a sum would inflate depth by counting the same learning
  twice.
- **Anything that asks "has she done this?" must go through `stickerCount`.**
  Reading `earned.has(stickerId(...))` directly skips the twin rule, and two
  surfaces did exactly that — el camino's `stepFor` and the deck menu's step —
  which showed a finished deck as **1 of 6** on the day of promotion. Both are
  fixed and one is pinned by a test. This is the same "two copies of the rule"
  drift ADR 021 and `earnableActivities` already warn about; the level gives it
  a third way to bite.
- **A level is not a per-game setting.** A kid mid-transition might want read
  quizzes and picture pairs; this is a switch, not a matrix. Deferred
  deliberately — see the roadmap.
- **`KID_META` was level metadata all along** (👂 "listen level"). It is now
  `LEVEL_META`, keyed by level, because a promoted kid labelled "listen level"
  on the very screen her parent promoted her on is the exact confusion this
  feature exists to remove.
- **Two paired devices are the only real test of the merge**, and unit tests
  both ways are a proxy for it. If a level ever appears to flap between
  devices, suspect a clock, not the rule.

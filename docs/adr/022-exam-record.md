# ADR 022: The exam record — the best score syncs, the retry gate stays local

- **Date:** 2026-09-16
- **Status:** accepted (the storage half of [ADR 021](021-camino-gates-and-exams.md);
  applies ADR 004's additive merge and follows ADR 014's local-only precedent)

## Decision

`palabras.exams.v1` holds, per kid and per shelf, `{ bestScore, attempts }` —
two monotonic counters. It rides `ProgressSnapshot.examRecords` and merges
per shelf by **max on each counter independently**, the same rule as
`retoBests`.

**Passing is derived, never stored:** `bestScore >= EXAM_PASS_MARK`. There is
no `passed` boolean anywhere.

The post-failure retry gate — "play this deck before trying again" — is
**device-local and never synced** (`palabras.exam-practice.v1`).

## Context

ADR 021 accepts that a score threshold cannot be derived from the album, so
something must be written down. The question is what, and the counter-wallet
lesson (ADR 008) applies directly: store the monotonic thing and derive the
view, never store the view.

A `passed` flag would be a second record of a fact `bestScore` already carries,
and the two can disagree after a merge — exactly the drift ADR 016 spent its
Consequences section on and ADR 008 fixed for the wallet. `bestScore` only ever
rises, so max-merge is idempotent, order-independent, and safe against a stale
peer. A kid who passes on the tablet has passed on the phone the moment the
snapshot merges, with no new merge semantics to reason about.

`attempts` is kept because it is free (it is already monotonic) and because the
deferred exam history on `/informe` needs it. It is not read by any rule.

The retry gate is the one piece that cannot ride that merge. It is a
*transient* fact — "this device saw a fail and is waiting on practice" — and
ADR 014 already settled what happens to transient state under an additive
merge: it stays local, because a stale peer would otherwise resurrect it. The
fail direction is what makes this safe rather than merely convenient: an
unsynced retry gate means a kid might retry sooner on a second device. Syncing
it wrong would mean a kid locked out on a device they never failed on. Of the
two, only the first is recoverable by a five-year-old.

## Consequences

- **Snapshot cost is small and bounded.** Twelve shelves × two small integers
  per kid, against ADR 019's 64 KB cap — roughly 0.5 KB for a fully-examined
  family. No pruning rule is needed, unlike `stickerCounts`.
- **A new key, so no migration.** Nothing is being converted; an absent key
  reads as "no exams taken". The `.v1` suffix is the version. If the record ever
  gains a non-monotonic field, that is a new epoch-shaped problem — re-read this
  ADR before adding one.
- **Sanitization is mandatory**, like every other snapshot field: shelf ids are
  `isSaneText`, scores are `isSaneCount`, and a hostile `bestScore` of 10^6 can
  only ever unlock content, never corrupt the album.
- **Clearing site data re-locks the route** for anyone past shelf 1 who has not
  synced, exactly as it already clears the wallet. Grandfathering does not save
  them: the album is gone too, so there are no stickers to grandfather from.
- Scores never go down. Re-sitting a passed exam and doing badly changes
  nothing — which is the point, and matches `retoBests`.

## Addendum — 2026-09-19: the súper needs no new storage; the override gets a set

**Los súper exámenes add nothing to this key.** A shelf has one checkpoint
whatever kind it is, so `palabras.exams.v1` still holds one
`{ bestScore, attempts }` per shelf. What differs is only the bar the score is
read against — `SUPER_EXAM_PASS_MARK` at a milestone position,
`EXAM_PASS_MARK` elsewhere — which is derived from the ladder, not stored.
That keeps this ADR's central rule intact: passing is still computed from the
score, and there is still no `passed` flag anywhere.

The cost is named in ADR 021's addendum: because the bar comes from position,
moving a shelf across a milestone re-scales its existing record.

**La llave de papá gets its own key**, `palabras.unlocked-shelves.v1`: a per-kid
**set of shelf ids** a grown-up has opened. It rides
`ProgressSnapshot.unlockedShelves` and merges by **union** — the same rule as
`unlockedDecks`, and additive for the same reason. A set that only ever grows
is monotonic, so ADR 004 carries it with no new semantics, re-merging cannot
duplicate anything, and **a stale peer can never re-lock a shelf a parent
opened**. That last property is the whole reason for choosing a set over, say,
a per-shelf boolean: the failure direction of an override must be "stays open".

It syncs, unlike the retry gate above, and the two are not in tension. The
retry gate is transient and device-local; an override is a durable decision a
parent made about their child, and it would be absurd for it to hold on the
tablet and not the phone.

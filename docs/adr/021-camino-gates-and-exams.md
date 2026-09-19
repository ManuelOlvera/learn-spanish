# ADR 021: El camino gates the route, and an exam is the gate

- **Date:** 2026-09-16
- **Status:** accepted — **supersedes [ADR 016](016-camino-derived-and-unlocked.md)**
  on gating and on "a step cannot express anything the album cannot". 016's
  *derivation* rule survives and is extended; its *never-locks* rule does not.
  Reads ADR 004's merge rules, ADR 018's `weakScore`, ADR 020's bonus ladder.

## Decision

A shelf on el camino is **locked** until the shelf before it is complete *and*
that shelf's **exam** has been passed. The lock is real: a locked shelf's tiles
are untappable on the home grid, not merely pale on the Tu camino strip.

An exam is 10 questions over the shelf just finished plus a minority drawn from
earlier shelves, **4 picture choices for both kid profiles**, passed at **7 of
10**. Failing nominates the section's weakest deck; the exam reopens once that
deck has been played again.

Gating is **per shelf, never per deck**. Inside an unlocked shelf every deck
stays as free as it ever was.

## Context

ADR 016 forbade exactly this, and the reason it gave was sound for the app it
was written about: a three-year-old navigates by picture, and a tile that stops
responding for a reason she cannot read is the worst failure the app can have.

**What changed is the audience.** The pack now serves two profiles, and the
`reader` — the eight-year-old whose "babyish" verdict already reshaped los
cuentos (roadmap #23) — gets nothing from a route that only suggests. For that
kid the camino was decoration. The parent asked for enforcement and for proof
of retention, with the conflict with 016 put in front of them explicitly, and
chose to supersede it.

Three of 016's specific worries are answered rather than dismissed:

- *"The kid who loves the animals deck gets shut out."* `animales` is the first
  shelf on the ladder and is never locked. The failure 016 imagined needs a kid
  locked out of content they already play, which grandfathering rules out.
- *"Mastery can stall a kid mid-route."* This is the real cost and it is now
  accepted, so a stall must have an exit: a failed exam always names a specific
  deck to go and play, and retrying is otherwise unlimited. The route never says
  "no" without saying "do this instead".
- *"A score threshold is unrepresentable."* Correct — so it is no longer derived.
  See [ADR 022](022-exam-record.md) for the storage this buys and its merge rule.

Per-deck gating was rejected. Deck order inside a shelf is the pack's own order
(roadmap #22) — curation, not a teaching sequence — so gating it would enforce
an order nobody designed, and combined with a locked home grid it would leave a
pre-reader exactly one tappable tile out of forty-four. That is not a home
screen, and it would break the picture-navigation premise outright rather than
narrowing it.

## Consequences

- **Grandfathering is derived, not migrated.** A shelf holding *any* earned
  sticker is unlocked. Since a locked shelf cannot accumulate stickers, this can
  only ever be true of play that predates the gate — so it self-limits, needs no
  flag, no migration, and nobody is sent back to shelf 1 on the day this ships.
  Deleting this rule silently demotes existing kids; it is pinned by a test.
- **016's derivation rule is extended, not broken.** Shelf completion is still
  `earnableActivities` over the album, still the album's own medal. Exactly one
  new fact is stored — the exam score — and it is stored because it provably
  cannot be derived, which is the test 016 was really applying.
- **The listener's exam is 4-choice, unlike the listener's quiz.** A 2-choice
  gate is passed by pure guessing ~17% of the time, and with unlimited retries
  that is not a gate at all. Four picture choices need no reading, so the format
  costs the pre-reader nothing and makes one threshold mean one thing.
- **The strip is no longer the only surface where "never locks" is tested.**
  016's test — "could a kid still reach that shelf without the strip?" — is
  retired. The replacement: *could a kid who fails always find out what to play
  next?* If a fail ever leaves no nominated deck, this ADR is broken.
- **The gate holds at every entrance, because one open door is none.** Home
  padlocks the tile, the shelf page refuses its decks, `/deck/<id>` refuses
  when its shelf is shut (a bookmark or the back stack reaches it without
  passing through the shelf), and anything that *picks content on the kid's
  behalf* filters through `reachableDeckIds` first — la misión's fallback
  scanned the whole pack and would otherwise have handed out a link straight
  past the gate. When a third such surface appears, it calls that function too.
- **El reto de papá is the one path past a lock, and that is deliberate.** A
  parent sets a challenge on a named deck and the card links to it, locked or
  not. An adult choosing content for their own child is exactly the override
  the deferred unlock key would formalise, so it is left working rather than
  closed — but it is an *adult* action, never something a kid can reach alone.
- **A parent unlock key is deliberately not in the first cut** and is the first
  thing to add if a kid gets genuinely stuck (roadmap #22).
- Passing pays the biggest star reward in the app — see ADR 020's addendum.

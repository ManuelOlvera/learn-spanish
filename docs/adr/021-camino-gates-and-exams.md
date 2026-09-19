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

## Addendum — 2026-09-19: los súper exámenes gate, and la llave de papá opens

Two changes the Consequences above anticipated, decided together because the
first is why the second could no longer wait.

**Los súper exámenes.** At the ladder's thirds — shelves 4, 8 and 12 — the
checkpoint is a **20-question exam drawn evenly across every shelf completed so
far**, passed at **14/20** (the same 70% bar). It **replaces** that shelf's
regular exam rather than following it: 30 questions back to back is not a
kid-sized sit, and the súper already covers that shelf's own content. So the
route still has exactly one checkpoint per shelf — nine regular, three súper.

It **gates**, like the regular exam. That was the parent's call against a
recommendation to make it an optional trophy, and the objection stands on the
record: a cumulative sweep is a much harder wall than a one-shelf exam, and a
kid stuck at it is stuck behind everything they have ever learned. What makes
it acceptable is that the valve shipped in the same change rather than being
promised.

Shelf 12's súper is the **capstone**: passing it is what makes the camino
`complete`, which also settles roadmap #22's open "a reward for finishing the
whole camino".

**La llave de papá.** A grown-up opens any one locked shelf from `/informe`,
permanently. `/informe` needs no new adult gate: nothing on a kid-facing screen
links to it, so a parent arrives by typing the URL and a pre-reader cannot.
El reto de papá already uses it as the parent's lever, so the key sits beside
a control of exactly the same kind.

The override opens **one shelf**, not everything before it and not the gate as
a whole. Normal gating resumes from the opened shelf onward, so the route keeps
its shape and the parent's action stays legible: they said "she is ready for
this one", not "turn the teaching off".

**Consequences**

- **A shelf's exam kind is a function of its position on the ladder**, so a
  shelf's stored `bestScore` is read against whichever bar its position
  implies. Reordering `TRAIL_GROUP_ORDER` therefore re-scales an existing
  record — a 9/10 regular pass sitting at a position that is now a súper shelf
  reads as a fail. The ladder is content curation and has moved before; if it
  moves again across a milestone, expect kids to be asked to re-sit, and say so
  rather than silently widening the gate.
- **The override is the one way past a lock that a kid can trigger nothing of**
  — it requires an adult on a screen kids never reach. El reto de papá remains
  the other adult path (see above); both are deliberate, and both are actions
  by a person rather than holes in the rule.
- The failure contract is unchanged and now matters more: a failed súper still
  names a deck to go and play, drawn from **all** prior shelves rather than one.

## Addendum — 2026-09-19 (later): grandfathering is completion, not a sticker

The Consequences above say *"a shelf holding **any** earned sticker is
unlocked"*. That was the rule as shipped, it was tested, and it was wrong — not
in its behaviour but in its bar.

The parent reported that on an established profile **exactly one shelf was
locked**: El transporte, the only one that child had never opened a single card
in. Everything past it was grandfathered by old play, so the route gated
nothing. Reproduced exactly: with one sticker in eleven of twelve shelves, the
locked set is `["transporte"]`.

The reasoning had a hole in it. "A locked shelf cannot accumulate stickers, so
this can only ever be true of play that predates the gate" is true, and it is
beside the point: the children this was built for **had already dabbled
everywhere**, so predating the gate described nearly the whole pack. A rule
that self-limits going forward can still be a hole on the day it ships.

**The bar is now: a shelf the kid actually completed stays open, and nothing
else.** Everything not completed gates normally.

**It took two attempts, and the failed one is the useful part of this record.**
The first fix opened everything *up to* the furthest completed shelf, reaching
backwards from that frontier so a gap could not demote anyone. It shipped, and
it unlocked the entire route:

> **Completion cost is not monotonic along the ladder.** Los verbos sits
> **last** and costs **3 stickers** — its decks are `learnOnly`, so
> `earnableActivities` yields only `["learn"]` — against 18–36 for every other
> shelf. A kid who flipped three flashcards completed the final shelf, which
> pushed the frontier to the end and opened all twelve.

So the grant is per shelf and **never reaches backwards**. A kid who finished
shelf 10 but not shelf 5 keeps 10 and must still earn 5, which means an open
tile can sit past a locked one. That is the honest reading of a route that
enforces order, and it is the only shape that cannot be levered open by
whichever shelf happens to be cheapest. A regression test builds a ladder whose
last shelf is learn-only and asserts it opens nothing before it.

## Consequences

- **This demotes real kids, which the original rule existed to prevent.** That
  trade was made deliberately by the parent, with the numbers in front of them:
  an established profile goes from one locked shelf to eleven. It is defensible
  only because la llave de papá shipped first — a grown-up can hand back any
  shelf that turns out to matter, in one tap.
- Completion is now the frontier for *everything*: it is the same bar the route
  already used for "is this shelf finished", so there is no second definition
  of progress to drift.
- A kid who has completed nothing is gated from shelf 2 onward, exactly as a
  brand-new profile is. That is the intended reading of "learn in order".
- **Two lessons, both about checking a rule against reality rather than against
  its own logic.** When a derived rule stands in for a migration, check it
  against the data that **actually exists** — not against the invariant that
  makes it self-limiting. And when a rule ranks shelves, check it against the
  **cheapest** shelf, not the typical one; the pack's outlier is at the end of
  the ladder, where a "furthest" rule is most exposed.

## Addendum — 2026-09-19 (later still): a súper examen is a stop, not a badge

The parent, looking at the strip: *"Shouldn't the súper exam be part of the
Camino? I can't see or know how to get there."*

They were right, and the cause was that a súper examen had no existence on the
strip until `examPending` turned true — which happens only after every deck on
its shelf is finished. So the wall was in the route's *logic* from day one and
in its *picture* only at the moment it was already due. On the strip, shelves
4, 8 and 12 were drawn exactly like 5, 6 and 7.

**Los súper exámenes now have stops of their own**, drawn on the path between
the shelf they examine and the next one, gold-bordered and carrying 🏅. Three
states, readable without reading like every other stop: passed is filled lime,
due is white, bigger, gold-ringed and the only tappable one, ahead is pale.

Regular exams stay a badge on their shelf. Making all twelve checkpoints into
stops was considered and rejected: it doubles a strip that already overflows and
scrolls on a phone at twelve, and it would give the same visual weight to a
ten-question checkpoint and to a twenty-question sweep across the whole pack.
Three extra stops is the smallest change that makes the walls countable.

**Consequences**

- "You are here" moves to the exam stop when a súper is the next move, because
  the shelf behind it is finished — two stops must never both claim it.
- The strip is now **the only surface that shows a checkpoint before it is
  due**. The home grid still says nothing about shelf 4 until its exam falls
  due, which is acceptable while the strip sits directly above that grid; if
  the strip is ever removed or collapsed, this becomes invisible again.
- ADR 016's retired test stays retired, but its replacement holds: every stop
  ahead is still inert, and the súper stop is tappable only when it is actually
  sittable, so tapping never lands on the refusal screen.

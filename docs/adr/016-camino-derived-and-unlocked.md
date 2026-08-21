# ADR 016: El camino is derived from the album, and never locks anything

- **Date:** 2026-08-22
- **Status:** accepted (reads ADR 004's merge rules and ADR 012's "learned"; settles roadmap #22)

## Decision

The guided route through the pack holds **no state of its own**. Every step's progress is
recomputed from the album's stickers on each read (`buildCamino`), so there is no
`palabras.camino.*` key, no migration, and nothing new for sync to merge. And the route
**never gates content**: it marks where a kid is and what is next, and every deck stays
exactly as tappable as it was before the route existed.

## Context

Roadmap #22 (the parent's idea, 2026-07-15) parked a Duolingo-like trail behind two
questions, and both have the same answer underneath.

*How does it sit next to free play?* This app's premise is that a three-year-old navigates
by picture with nothing locked. A trail is a **prescribed order**, and a prescribed order
that enforces itself would demote the picture navigation to a second-class path — the
"second, louder home screen" the roadmap warned about. Locking is also the mechanic with
the worst failure mode here: the kid who loves the animals deck gets shut out of it by a
rule she cannot read. So the route persuades (a 👉 on one tile) and never forbids. El
misterio locks a *bonus* deck for stars; that is not precedent for gating core content.

*What stores the progress?* A step is "played every one of this deck's activities",
which is the album's own category completion — the album already records exactly that, per
kid, keyed `kid:deck:activity`, and it already syncs additively under ADR 004. Pinning the
two together means a deck's ⭐ on the route and its 🥉 medal in the album can never drift
into meaning different things. Minting a parallel record of the same fact would buy a
new storage key, a migration, a merge rule, and two sources of truth that can disagree.
Deriving costs one pass over a few hundred sticker ids on render.

Completion is deliberately **not** mastery (ADR 012's two-correct rule). Mastery can stall:
a kid who keeps missing a word would sit on step 2 while the route insists that is where
they belong, which turns guidance into the wall this ADR exists to avoid. Mastery stays
where it is useful and unhurried — the parent's `/informe`.

## Consequences

- Replaying cannot lose ground: the sticker that proves a step stays earned forever.
- The route inherits sync for free — a deck finished on the tablet is finished on the
  phone as soon as the stickers merge, with no new field in `ProgressSnapshot`.
- **A step cannot express anything the album cannot.** Order-within-a-deck, time spent, a
  score threshold, or "done today" are all unrepresentable. Any of them means real storage,
  and that reopens ADR 004 (a merge rule) — do not add a camino key to dodge that.
- The shelf ladder (`TRAIL_GROUP_ORDER`) is content curation, so it lives beside the
  shelves in `infrastructure` and is pinned by a content test: a new shelf that nobody
  placed on the ladder fails the build rather than silently vanishing from the route.
- The route's order is **not** the home screen's order (home is arranged for browsing), so
  the ladder needs a surface of its own to be seen: the **Tu camino** strip. Reordering the
  home grid to match was the alternative and was rejected — it moves tiles the kids find by
  position, and a reordered grid still draws no path. The strip is therefore load-bearing,
  not decoration: without it the global level of the route is invisible.
- **The strip's stops are mostly inert, and that is not a violation of the rule above.**
  Only the current one is a link; the rest are marks, and the ones ahead are drawn pale.
  "Never locks" is a claim about *reaching content*, and every shelf remains one tap away
  in the grid directly below — the strip simply stopped being a duplicate, less legible
  copy of it. The test to apply to any future change here: could a kid still get to that
  shelf without the strip's help? While the grid is unchanged, the answer is yes. If the
  strip ever becomes the *only* way to a shelf, this ADR is broken and needs revisiting.
- Un-gating means the camino can be ignored entirely, and for a kid who just wants to
  play the animals deck forever, it will be. That is the trade: it is a suggestion.

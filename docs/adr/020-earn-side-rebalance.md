# ADR 020: Make mascotas reachable by raising the earn side, not cutting prices

- **Date:** 2026-09-15
- **Status:** accepted (applies ADR 006's "only stars are epoch-gated" reasoning
  in reverse — nothing here needs an epoch; honours ADR 007's "do not rebalance
  prices"; preserves ADR 014's locked multiplier)

## Decision

One first-try answer is now worth `STARS_PER_CORRECT = 3` (was 1), and every
bonus denominated against it rose with it: `PERFECT_BONUS` 5 → 12,
`FIRST_TIME_BONUS` 3 → 8, `MISSION_BONUS` 10 → 25, `CHALLENGE_BONUS` 15 → 40,
`CATEGORY_BONUS` 15/30/50 → 40/80/125. The mistake penalty is denominated in
*answers* rather than stars (`3 × max(1, correct − mistakes)`), so it scales with
the rate automatically.

**`PET_SPECIES` costs, `MEAL_COST` and `SURPRISE_COST` were not touched.**

A perfect 8-round game goes 13⭐ → 36⭐; the cheapest mascot (el conejo, 100⭐)
goes from ~8 flawless games away to ~3.

## Context

The kids stopped believing they would ever reach a second mascota. At 1⭐ per
answer the cheap end of a 28-pet ladder was eight perfect games away, with meals
draining the balance in between — the saving goal was out of sight, so it
stopped motivating play at all.

Two levers could close that gap, and they are not equivalent:

- **Cut prices.** ADR 007 forbids exactly this ("Do not rebalance prices to
  them"), and it would land as deflation — the pets a kid already saved for
  retroactively become cheap, which devalues what they did.
- **Raise the earn side.** Nothing in the repo forbids it, and it is
  structurally the safe one: earning only ever raises `earned`, which ADR 008
  already guarantees is monotonic and merges by per-counter `max`. Old balances
  keep their value; new play is simply worth more.

So the rate moved and the price ladder did not. Critically, **this needs no
wallet epoch and no migration**: ADR 006's machinery exists to *reduce* balances
against an additive merge, and nothing here reduces anything.

Raising the rate without raising the bonuses would have quietly deleted them —
a flat +5 "¡Perfecto!" beside a 24⭐ base stops reading as a prize — so every
bonus moved by roughly the same factor and the ratios the game was balanced on
are unchanged.

## Consequences

- **Feeding and la caja sorpresa got cheaper in relative terms.** A 5⭐ meal is
  now noise against a 36⭐ chest, so pets grow visibly faster and the 100⭐ box is
  a smaller save-up. Accepted deliberately rather than re-priced: both are sinks
  that exist to give stars somewhere to go, and the kids enjoying them more often
  is the point. If the box stops feeling like a treat, re-price the box — do not
  undo the rate.
- **The ordering between bonuses is now the rule, not the numbers.** Two tests
  pin it: the misión must out-pay a single finish, and el reto de papá must
  out-pay the misión. The challenge invariant had already broken silently once
  (its test asserted `> 10` instead of `> MISSION_BONUS`) — assert against the
  constant, never a copy of its value.
- **El reto and el duelo pay through `earnedStars`**, not raw score. They bypass
  `computeReward` entirely, so they would otherwise have been left paying a third
  of every other game.
- The pace is pinned as an invariant, not a magic number: three good games must
  stay within reach of the cheapest paid pet, and one game must never buy it
  outright. Move either side and that test is what fails.
- Rebalancing *down* later is a different and much harder operation — that one
  does need ADR 006's epoch plus a migration.

## Addendum — 2026-09-16: `EXAM_BONUS` takes the top of the ladder

El camino's exams (ADR 021) add `EXAM_BONUS = 200`, above `CATEGORY_BONUS.gold`
(125), making a passed exam the largest single payout in the app. The parent
asked for it in those words: passing must beat opening any chest.

This works *within* this ADR rather than against it. The rule above is that
**ordering is the rule, not the numbers**, so a new rung is a new pinned
assertion (`EXAM_BONUS > CATEGORY_BONUS.gold`), asserted against the constant
and never a copy of its value. And it moves the earn side only — `PET_SPECIES`,
`MEAL_COST` and `SURPRISE_COST` are untouched, so ADR 007 holds and no wallet
epoch is needed (earning only raises `earned`, which ADR 008 merges by max).

**One exam pass buys the cheapest mascota outright (200⭐ against el conejo's
100⭐), and that is intended, not an oversight.** The neighbouring invariant —
"one game must never buy one outright" (`economy2.test.ts`) — is about a chest
from a single activity through `computeReward`; an exam sits behind a whole
completed shelf and a 7-of-10 threshold, which is the opposite of the
grind-free shortcut that test protects against. Both invariants now stand, and
both are asserted.

If exams ever start feeling routine enough that 200⭐ distorts saving, raise the
threshold or space the exams — do not cut the bonus, which is the one thing the
kids are told is the biggest prize in the app.

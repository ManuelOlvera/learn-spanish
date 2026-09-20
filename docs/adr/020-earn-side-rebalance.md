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

## Addendum — 2026-09-19: `SUPER_EXAM_BONUS` takes the rung above

Los súper exámenes (ADR 021's addendum) add `SUPER_EXAM_BONUS = 500`, above
`EXAM_BONUS` (200), which is itself above `CATEGORY_BONUS.gold` (125). Three
rungs, each pinned by an assertion against the constant below it rather than
against a copy of its value — the rule this ADR set.

Same reasoning as the 2026-09-16 addendum and the same safety: it moves the
earn side only, so ADR 007's price ladder is untouched, no wallet epoch is
needed, and ADR 008's monotonic `earned` merges it. A súper pass buys a
mid-tier mascota outright, which is the intent — it is the largest single thing
a kid can do in the app, and it arrives three times in a route of twelve.

Exams are now the spine of the economy: nine regular at 200 plus three súper at
500 is 3,300⭐ across a completed camino, against a 100⭐ cheapest pet. If that
proves to flatten saving as a motivation, the lever is the **threshold or the
spacing**, not the bonus — the size of the prize is the thing the kids are
told, and cutting it is the one move that reads as a takeaway.

## Addendum — 2026-09-20: the dock gets a ceiling

The Consequences above say this rebalance "preserved the ratio rather than
re-cutting the curve". This addendum re-cuts one part of it, deliberately, and
records why that is safe.

**A wrong tap is charged twice** — it costs the first-try credit for that
round, *and* an answer's worth off the base. Uncapped, the second charge could
eat a whole run: 5-of-8 with three wrong taps paid **6⭐** against a perfect
run's 36⭐. A sixth, for getting five right.

**The dock is now capped at half the credit actually earned.** The same run
pays **9⭐**, and a perfect run is 4× it rather than 6×.

**Why it was worth re-cutting**

The roadmap has carried this since the rebalance, in its own words: *"the
harshest part of the economy for a kid who is struggling, which is the opposite
of who needs encouraging."* The rule cannot tell a three-year-old tapping at
random from a five-year-old who is genuinely finding the deck hard, and it
punished the second one hardest — the more she got right, the more there was to
take away.

**Deleting the dock entirely was considered and rejected.** The obvious reading
is that first-try credit already punishes a wrong tap, making the second charge
redundant. It is not: on a **2-choice** board a random tapper gets about half
of them right on first try, so credit alone would pay them four answers' worth
for learning nothing. The dock is what makes guessing worthless there, and that
is the case it exists for.

**The cap is proportional, not a constant.** ¿Sí o no? became 4, 8 or 12 rounds
the same day the difficulty axis landed, so a fixed ceiling would mean three
different things inside one game. "Never more than half of what you got right"
means the same thing at every length.

**Consequences**

- **No wallet epoch, no migration.** This only ever *raises* a payout, and
  earning only raises `earned`, which ADR 008 merges by max — the same
  reasoning that made the original rebalance safe. ADR 007's price ladder is
  untouched.
- **Clean runs do not move at all.** A perfect 8-round game still pays 36⭐,
  7-of-8 with one mistake still pays 18⭐, 6-of-8 with two still pays 12⭐: at
  those ratios the dock was already under the cap. Only the runs that were
  being over-punished change, which is the test of whether a softening
  softened the right thing.
- **Guessing is still worthless.** Wrong on every round first pays the floor
  whatever the cap, because there is no credit to halve. A random tapper on a
  2-choice board keeps two answers' worth instead of one — against a perfect
  run's twelve.
- **More mistakes can never pay more.** The dock is monotonic in `mistakes`, so
  there is no run a kid could deliberately make worse to earn more.
- **The ordering rules are untouched.** Nothing here moves a bonus constant, so
  every assertion ADR 020 pinned against a constant rather than a value still
  holds.

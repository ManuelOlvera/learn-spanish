# ADR 017: One screen rolls the week; every other screen reads it

- **Date:** 2026-08-28
- **Status:** accepted (pins the ownership rule that ADR 016 pinned for the album's tiers)

## Decision

`RolloverWeeklyUseCase` **writes**, and the write is the celebration: it advances
`weekly.week` and spends a ❄️, so the `outcome` it returns is non-`"none"` exactly once
per new week, for exactly one caller. **Home is that caller.** Every other screen that
merely displays la racha semanal calls `ReadWeeklyUseCase`, which projects the same domain
rule (`rollWeek`) over the stored state and persists nothing.

The Semana card itself lives on **`/informe`**, the parent screen — not on home, not on
la mascota.

## Context

The card moved twice in three days and broke something each time, which is what makes this
worth pinning rather than deciding a fourth time by feel.

*Why two use cases over one function?* `rolloverWeekly` was documented "call on app open"
and read like a getter. When the Semana card moved to la mascota (2026-08-25), that screen
called it in `refresh()` — on mount, and again after every meal, purchase and accessory
drag. Nothing looked wrong: the card showed the right numbers. But a kid who opened the pet
screen before home consumed the rollover silently, and home's ¡Semana N! never fired that
week — the celebration was gone, not delayed. A read that writes cannot be shared, so the
read that does not write has to exist as its own thing with its own name. This is the same
failure ADR 016 recorded for the album's tiers: two callers over one ledger, and the
quieter one wins.

*Why the parent screen?* The parent reported the card appearing on la mascota as a bug
(2026-08-28). Home has no slot for it — "home says one thing" (2026-08-25) exists because
eight stacked bands pushed the first shelf tile below the fold. La mascota was the reasonable
next guess, since a ❄️ is bought with stars and stars are spent there, but a freeze is not a
toy: it forgives a missed week, which is a grown-up's call about a habit, and `/informe` is
where the family already reads 🔥 and ❄️ as numbers. The card replaces those two chips
rather than sitting beside them.

## Consequences

- **A screen that shows the streak must not roll it.** The check when adding one: does this
  screen celebrate? If not, it calls `readWeekly`. `WeeklyCard` takes `WeeklySnapshot`, which
  has no `outcome` field, so the card cannot reach the celebration even by accident.
- `ReadWeeklyUseCase` projects the roll instead of reading `weekly.count` raw, so `/informe`
  is correct on a Monday morning that nobody has opened home on yet. The cost is that the
  projection runs twice that morning — once to show, once to commit — over a handful of
  week keys.
- The freeze shop is now two taps from a kid (`/album` → `/informe`) instead of on their own
  screen. Deliberate: nobody has to buy one, and a missed week costs a streak, not progress.
- If home ever stops being the app-open screen, the roller moves with it — there must stay
  exactly one. Two rollers is not a merge conflict, it is a coin flip over who celebrates.

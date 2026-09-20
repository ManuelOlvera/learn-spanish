/* ⭐ is the app's earned currency: STARS_PER_CORRECT per first-try answer, less
 * one answer's worth per mistake (chest at the end of each activity),
 * +MISSION_BONUS for the daily mission, spent feeding la mascota (MEAL_COST per
 * meal). Wallet storage rides the EconomyStore port (domain/economy.ts). */

/** What one first-try answer is worth. The single knob for how fast the whole
 *  economy runs: every chest, the streak double and the mistake penalty are all
 *  denominated in it, so moving it rescales earning without changing any of the
 *  ratios the game is balanced on. Raised 1 → 3 on 2026-09-15 (ADR 020) because
 *  the cheapest mascot sat eight flawless games away and the kids stopped
 *  believing they would ever reach one. Prices were deliberately NOT touched
 *  (ADR 007). */
export const STARS_PER_CORRECT = 3;

/** Finishing always pays at least one answer's worth — effort counts.
 *  Superseded by computeReward for real chests; kept for callers that only
 *  want the base rate. */
export function earnedStars(firstTryCorrect: number): number {
  return STARS_PER_CORRECT * Math.max(1, firstTryCorrect);
}

/** Untouched by the 2026-09-15 rebalance on purpose: feeding is meant to get
 *  cheaper in relative terms, so pets grow visibly faster now that chests are
 *  richer (ADR 020). */
export const MEAL_COST = 5;

/** La misión del día's bonus chest. Rose with the rate (10 → 25, ADR 020): three
 *  activities had to keep out-paying the single finish that is one of them. Must
 *  stay below CHALLENGE_BONUS — a challenge papá set outranks the daily draw. */
export const MISSION_BONUS = 25;

/**
 * Passing a shelf's exam on el camino — **the largest single payout in the
 * app**, deliberately above `CATEGORY_BONUS.gold` (125) so that passing beats
 * opening any chest, which is what the parent asked for in those words
 * (ADR 020's 2026-09-16 addendum, ADR 021).
 *
 * The *ordering* is the rule, not the number: a test asserts this against
 * `CATEGORY_BONUS.gold` itself, never a copy of its value. Raising the earn
 * side needs no wallet epoch — earning only ever raises `earned`, which ADR
 * 008 merges by max — and `PET_SPECIES` prices stay untouched (ADR 007), so
 * one pass does buy the cheapest mascota outright. That is intended.
 */
export const EXAM_BONUS = 200;

/**
 * Passing a **súper examen** — the cumulative sweep at the ladder's thirds
 * (ADR 021's 2026-09-19 addendum). The rung above `EXAM_BONUS`, which is
 * itself above `CATEGORY_BONUS.gold`: three rungs, each pinned by a test
 * asserting against the constant below it rather than a copy of its value.
 *
 * It is the largest single thing a kid can do in the app, and it arrives three
 * times in a route of twelve. If exams ever prove to flatten saving as a
 * motivation, the lever is the threshold or the spacing — never this number,
 * which is the one the kids are told.
 */
export const SUPER_EXAM_BONUS = 500;

/** The wallet's generation. Bumping it makes the merge discard wallet fields
 *  from any older epoch (see mergeProgress) — otherwise max-merge would
 *  resurrect pre-bump values from cloud rows and old transfer codes. Each
 *  bump pairs with a run-once storage migration in apps/web that decides what
 *  the new-epoch wallet starts as (zeroed for a reset, seeded for a restore,
 *  converted for a schema change).
 *  Epoch 1: 2026-07-14 reset to 0 (economy rebalance).
 *  Epoch 2: 2026-07-15 restore, seeded per kid (ADR 007).
 *  Epoch 3: 2026-07-15 balance → earned/spent counters (ADR 008). */
export const WALLET_EPOCH = 3;

/** Epoch 2's goodwill balances, keyed by the avatar each kid answers to (kid
 *  profiles are semantic — "listener"/"reader" — so the avatar is the only
 *  stable name for a specific child). The migration seeds
 *  max(current, seed) per kid; kids with other avatars keep their balance.
 *  Still load-bearing under epoch 3: a device that never opened the app during
 *  epoch 2 must be seeded before its balance is converted to counters. */
export const WALLET_SEED_BY_AVATAR: Readonly<Record<string, number>> = {
  "🐸": 1000,
  "🐯": 300,
};

/** The wallet as two monotonic counters; the balance is derived. Counters
 *  only ever grow, so the sync merge can take a per-counter max and a spend
 *  on one device can never be resurrected by a stale peer — the flaw of
 *  max-merging a raw balance. Clamped at zero: corrupt or hostile counters
 *  must never render a negative wallet. */
export interface Wallet {
  readonly earned: number;
  readonly spent: number;
}

export const EMPTY_WALLET: Wallet = { earned: 0, spent: 0 };

export function walletBalance(wallet: Wallet): number {
  return Math.max(0, wallet.earned - wallet.spent);
}

/** Richer chest: bonuses stack on the base (STARS_PER_CORRECT per first-try
 *  answer). Both rose with the rate on 2026-09-15 (ADR 020) — a flat +5 beside
 *  a 24⭐ base would have stopped reading as a prize worth playing well for. */
export const PERFECT_BONUS = 12;
export const FIRST_TIME_BONUS = 8;
/** A streak this long doubles the base (an extra `base` on top). */
export const STREAK_DOUBLE_DAYS = 7;

export interface StarReward {
  /** STARS_PER_CORRECT per first-try answer, less one answer's worth per
   *  mistake, minimum one answer's worth. */
  readonly base: number;
  /** No mistakes across the whole activity. */
  readonly perfect: number;
  /** Kept a week-long daily streak. */
  readonly streak: number;
  /** First time this activity was ever finished. */
  readonly firstTime: number;
  readonly total: number;
}

/**
 * How many answers' worth a run's wrong taps cost it.
 *
 * One answer per mistake — **capped at half the credit actually earned**.
 *
 * A wrong tap is already charged once, by costing the first-try credit for
 * that round; this is a second charge for the same tap, and it is deliberate,
 * because on a 2-choice board a random tapper gets about half of them right on
 * first try and would otherwise be paid for it. Deleting the dock was
 * considered for exactly that reason and rejected.
 *
 * What the cap fixes is who it landed on. Uncapped, the second charge could
 * eat a whole run: 5-of-8 with 3 wrong taps paid 6⭐ against a perfect run's
 * 36⭐ — a sixth, for getting five right. That is the harshest the economy
 * gets, aimed at the kid who is trying hardest and finding it difficult, which
 * is the opposite of who needs encouraging.
 *
 * Proportional rather than a constant on purpose: ¿Sí o no? is 4, 8 or 12
 * rounds since the difficulty axis landed, so a fixed cap would mean three
 * different things across one game.
 */
export function mistakeDock(firstTryCorrect: number, mistakes: number): number {
  return Math.min(mistakes, Math.floor(firstTryCorrect / 2));
}

export function computeReward(opts: {
  readonly firstTryCorrect: number;
  /** Wrong taps across the whole activity — each docks an answer's worth from
   *  the base, up to `mistakeDock`'s ceiling, so tapping without looking earns
   *  the floor rather than a full chest. Counted in answers rather than stars
   *  so the penalty keeps its bite whatever STARS_PER_CORRECT is set to. */
  readonly mistakes?: number;
  /** Given only for round-based games, so "perfect" is meaningful. */
  readonly totalRounds?: number;
  readonly streakDays?: number;
  readonly firstTime?: boolean;
}): StarReward {
  const base =
    STARS_PER_CORRECT *
    Math.max(
      1,
      opts.firstTryCorrect - mistakeDock(opts.firstTryCorrect, opts.mistakes ?? 0),
    );
  const perfect =
    opts.totalRounds !== undefined &&
    opts.totalRounds > 0 &&
    opts.firstTryCorrect >= opts.totalRounds
      ? PERFECT_BONUS
      : 0;
  const streak = (opts.streakDays ?? 0) >= STREAK_DOUBLE_DAYS ? base : 0;
  const firstTime = opts.firstTime ? FIRST_TIME_BONUS : 0;
  return { base, perfect, streak, firstTime, total: base + perfect + streak + firstTime };
}

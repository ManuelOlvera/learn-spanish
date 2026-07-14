/* ⭐ is the app's earned currency: one per first-try answer (chest at the
 * end of each activity), +MISSION_BONUS for the daily mission, spent
 * feeding la mascota (MEAL_COST per meal). Wallet storage rides the
 * EconomyStore port (domain/economy.ts). */

/** Finishing always pays at least one star — effort counts. */
export function earnedStars(firstTryCorrect: number): number {
  return Math.max(1, firstTryCorrect);
}

export const MEAL_COST = 5;
export const MISSION_BONUS = 10;

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

/** Richer chest: bonuses stack on the base (one star per first-try answer). */
export const PERFECT_BONUS = 5;
export const FIRST_TIME_BONUS = 3;
/** A streak this long doubles the base (an extra `base` on top). */
export const STREAK_DOUBLE_DAYS = 7;

export interface StarReward {
  /** One per first-try answer, minimum one. */
  readonly base: number;
  /** No mistakes across the whole activity. */
  readonly perfect: number;
  /** Kept a week-long daily streak. */
  readonly streak: number;
  /** First time this activity was ever finished. */
  readonly firstTime: number;
  readonly total: number;
}

export function computeReward(opts: {
  readonly firstTryCorrect: number;
  /** Given only for round-based games, so "perfect" is meaningful. */
  readonly totalRounds?: number;
  readonly streakDays?: number;
  readonly firstTime?: boolean;
}): StarReward {
  const base = Math.max(1, opts.firstTryCorrect);
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

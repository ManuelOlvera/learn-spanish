import type { KidId } from "./kid";

/** ⭐ is the app's earned currency: one per first-try answer (chest at the
 *  end of each activity), +MISSION_BONUS for the daily mission, spent
 *  feeding la mascota (MEAL_COST per meal). */
export interface StarStore {
  load(kid: KidId): Promise<number>;
  save(kid: KidId, stars: number): Promise<void>;
}

/** Finishing always pays at least one star — effort counts. */
export function earnedStars(firstTryCorrect: number): number {
  return Math.max(1, firstTryCorrect);
}

export const MEAL_COST = 5;
export const MISSION_BONUS = 10;

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

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

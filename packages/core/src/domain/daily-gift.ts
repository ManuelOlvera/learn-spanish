import type { RandomSource } from "./random";

/** El regalo del día: a small, free gift a kid can open once per calendar day —
 *  a daily reason to open the app, not a way around the shop. Deliberately
 *  modest: only stars or the occasional streak freeze, never an accessory (that
 *  stays la caja sorpresa's paid job, so the wardrobe keeps its value). */
export type DailyGift =
  | { readonly type: "stars"; readonly amount: number }
  | { readonly type: "freeze" };

/** How often the gift is a streak freeze (❄️) rather than stars. */
export const DAILY_GIFT_FREEZE_CHANCE = 0.1;

/** Draw today's gift. Mostly a small star top-up (10–25), occasionally a ❄️. */
export function drawDailyGift(random: RandomSource): DailyGift {
  if (random() < DAILY_GIFT_FREEZE_CHANCE) {
    return { type: "freeze" };
  }
  return { type: "stars", amount: 10 + Math.floor(random() * 16) };
}

/** Whether today's gift is still unclaimed — true unless it was already claimed
 *  on `today`. The last-claimed day is the whole state; a new day reopens it. */
export function canClaimDailyGift(
  lastClaimed: string | null,
  today: string,
): boolean {
  return lastClaimed !== today;
}

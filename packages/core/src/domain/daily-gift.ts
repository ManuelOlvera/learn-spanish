import type { BoostTier } from "./boost";
import type { RandomSource } from "./random";

/** El regalo del día: a small, free gift a kid can open once per calendar day —
 *  a daily reason to open the app, not a way around the shop. Deliberately
 *  modest: stars, the occasional streak freeze, or a ⚡ hora doble — never an
 *  accessory (that stays la caja sorpresa's paid job, so the wardrobe keeps its
 *  value). */
export type DailyGift =
  | { readonly type: "stars"; readonly amount: number }
  | { readonly type: "freeze" }
  | { readonly type: "boost"; readonly tier: BoostTier };

/** How often the gift is a streak freeze (❄️) rather than stars. */
export const DAILY_GIFT_FREEZE_CHANCE = 0.1;

/** How often the gift is a ⚡ boost. Generous — it pays nothing on its own, it
 *  only pays if the kid then goes and plays, which is the whole point. */
export const DAILY_GIFT_BOOST_CHANCE = 0.15;

/** The free gift's boost is always the x2. The x3 stays la caja sorpresa's
 *  prize, so the paid box keeps something the free one can never give. */
export const DAILY_GIFT_BOOST_TIER: BoostTier = 2;

/** Draw today's gift from one branch roll: ❄️, then ⚡, then a small star
 *  top-up (10–25) for everything above. */
export function drawDailyGift(random: RandomSource): DailyGift {
  const roll = random();
  if (roll < DAILY_GIFT_FREEZE_CHANCE) {
    return { type: "freeze" };
  }
  if (roll < DAILY_GIFT_FREEZE_CHANCE + DAILY_GIFT_BOOST_CHANCE) {
    return { type: "boost", tier: DAILY_GIFT_BOOST_TIER };
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

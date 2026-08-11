import { ACCESSORIES } from "./wardrobe";
import type { BoostTier } from "./boost";
import type { RandomSource } from "./random";

/** La caja sorpresa: a renewable star sink — pay and get a random reward,
 *  favouring a wardrobe accessory the pet doesn't own yet, with a star
 *  consolation so it never feels like a pure loss. Priced well above the
 *  cheapest accessories: the lottery is a save-up treat, never the cheap
 *  way around the shop. */
export const SURPRISE_COST = 100;

/** How often the consolation is a streak freeze (❄️) rather than stars. */
export const SURPRISE_FREEZE_CHANCE = 0.15;

/** How often the consolation is a ⚡ hora doble instead of stars. Only the box
 *  can pay a boost worth more than the free gift's — that is what the 100⭐
 *  buys over the 🎁. */
export const SURPRISE_BOOST_CHANCE = 0.3;

/** How often a boost from the box is the x3 rather than the x2. */
export const SURPRISE_TRIPLE_CHANCE = 0.35;

export type SurpriseResult =
  | { readonly type: "accessory"; readonly id: string }
  | { readonly type: "freeze" }
  | { readonly type: "boost"; readonly tier: BoostTier }
  | { readonly type: "stars"; readonly amount: number };

export function drawSurprise(
  random: RandomSource,
  ownedAccessories: readonly string[],
): SurpriseResult {
  const unowned = ACCESSORIES.filter((a) => !ownedAccessories.includes(a.id));
  if (unowned.length > 0 && random() < 0.7) {
    return {
      type: "accessory",
      id: unowned[Math.floor(random() * unowned.length)]!.id,
    };
  }
  // Nothing new to win (or the 30% roll): usually 20–50 stars, occasionally a
  // freeze so the safety net can be earned, not only bought, or a ⚡ window.
  if (random() < SURPRISE_FREEZE_CHANCE) {
    return { type: "freeze" };
  }
  if (random() < SURPRISE_BOOST_CHANCE) {
    return {
      type: "boost",
      tier: random() < SURPRISE_TRIPLE_CHANCE ? 3 : 2,
    };
  }
  return { type: "stars", amount: 20 + Math.floor(random() * 31) };
}

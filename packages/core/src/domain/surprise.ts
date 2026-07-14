import { ACCESSORIES } from "./wardrobe";
import type { RandomSource } from "./random";

/** La caja sorpresa: a renewable star sink — pay and get a random reward,
 *  favouring a wardrobe accessory the pet doesn't own yet, with a star
 *  consolation so it never feels like a pure loss. Priced at the cheapest
 *  accessory so the lottery never undercuts simply buying what you want. */
export const SURPRISE_COST = 40;

/** How often the consolation is a streak freeze (❄️) rather than stars. */
export const SURPRISE_FREEZE_CHANCE = 0.15;

export type SurpriseResult =
  | { readonly type: "accessory"; readonly id: string }
  | { readonly type: "freeze" }
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
  // Nothing new to win (or the 30% roll): usually 8–20 stars, occasionally a
  // freeze so the safety net can be earned, not only bought.
  if (random() < SURPRISE_FREEZE_CHANCE) {
    return { type: "freeze" };
  }
  return { type: "stars", amount: 8 + Math.floor(random() * 13) };
}

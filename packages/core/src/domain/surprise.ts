import { ACCESSORIES } from "./wardrobe";
import type { RandomSource } from "./random";

/** La caja sorpresa: a renewable star sink — pay and get a random reward,
 *  favouring a wardrobe accessory the pet doesn't own yet, with a star
 *  consolation so it never feels like a pure loss. */
export const SURPRISE_COST = 15;

export type SurpriseResult =
  | { readonly type: "accessory"; readonly id: string }
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
  // 3–8 stars back when there's nothing new to win (or on the 30% roll).
  return { type: "stars", amount: 3 + Math.floor(random() * 6) };
}

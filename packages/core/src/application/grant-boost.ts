import { stackBoost, type Boost, type BoostTier } from "../domain/boost";
import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";

/** Hand a kid a ⚡ hora doble, stacking it onto any window already running
 *  (domain/boost.ts owns that rule). Shared by every draw that can pay one —
 *  el regalo del día and la caja sorpresa — so "won a boost" means exactly one
 *  thing wherever it happens. Returns the window now in force. */
export function grantBoost(
  store: EconomyStore,
  kid: KidId,
  tier: BoostTier,
  now: Date,
): Boost {
  const boost = stackBoost(store.loadBoost(kid), tier, now);
  store.saveBoost(kid, boost);
  return boost;
}

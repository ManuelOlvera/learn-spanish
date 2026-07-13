import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";

/** Add stars to a kid's wallet and return the new balance. Shared by every
 *  use case that pays out (chests, bonuses, surprise draws). */
export function bankStars(
  store: EconomyStore,
  kid: KidId,
  amount: number,
): number {
  const next = store.loadStars(kid) + amount;
  store.saveStars(kid, next);
  return next;
}

/** Bank stars into a kid's wallet (chest payouts, bonuses). Returns the new
 *  balance. */
export class EarnStarsUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, amount: number): number {
    return bankStars(this.store, kid, amount);
  }
}

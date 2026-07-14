import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { walletBalance } from "../domain/stars";

/** Add stars to a kid's wallet and return the new balance. Shared by every
 *  use case that pays out (chests, bonuses, surprise draws). Only the earned
 *  counter moves — counters are monotonic so the sync merge stays spend-safe. */
export function bankStars(
  store: EconomyStore,
  kid: KidId,
  amount: number,
): number {
  const wallet = store.loadWallet(kid);
  const next = { earned: wallet.earned + amount, spent: wallet.spent };
  store.saveWallet(kid, next);
  return walletBalance(next);
}

/** Bank stars into a kid's wallet (chest payouts, bonuses). Returns the new
 *  balance. */
export class EarnStarsUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, amount: number): number {
    return bankStars(this.store, kid, amount);
  }
}

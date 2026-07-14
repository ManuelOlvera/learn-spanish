import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { walletBalance } from "../domain/stars";

/**
 * The one spending primitive: check the balance *before* writing, so a
 * refused purchase can never deduct. Every buy use case routes its payment
 * through here (as a plain function — small enough that injecting a use case
 * into a use case would be ceremony).
 *
 * Returns the new balance, or null when the kid cannot afford it.
 */
export function trySpend(
  store: EconomyStore,
  kid: KidId,
  amount: number,
): number | null {
  const wallet = store.loadWallet(kid);
  if (walletBalance(wallet) < amount) {
    return null;
  }
  // Only the spent counter moves — monotonic, so the sync merge is spend-safe.
  const next = { earned: wallet.earned, spent: wallet.spent + amount };
  store.saveWallet(kid, next);
  return walletBalance(next);
}

/** Spend stars from a kid's wallet; null when unaffordable. */
export class SpendStarsUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, amount: number): number | null {
    return trySpend(this.store, kid, amount);
  }
}

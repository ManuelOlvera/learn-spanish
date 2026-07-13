import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { trySpend } from "./spend-stars";

/**
 * Unlock a secret deck. Unlike the catalog-priced purchases, the cost rides in
 * from the deck record (`deck.unlockCost`) — decks live behind an async
 * repository, and the deck object the caller holds already came from it.
 * Null when already unlocked or unaffordable. Returns the new balance.
 */
export class UnlockDeckUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, deckId: string, cost: number): number | null {
    const owned = this.store.loadUnlockedDecks(kid);
    if (owned.includes(deckId)) {
      return null;
    }
    const stars = trySpend(this.store, kid, cost);
    if (stars === null) {
      return null;
    }
    this.store.saveUnlockedDecks(kid, [...owned, deckId]);
    return stars;
  }
}

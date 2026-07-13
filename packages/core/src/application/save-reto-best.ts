import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";

/** Record a reto score if it beats the kid's best for that deck.
 *  Returns true when it set a new record (the caller celebrates). */
export class SaveRetoBestUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, deckId: string, score: number): boolean {
    const doc = this.store.loadRetoBest(kid);
    const best = doc[deckId] ?? 0;
    if (score <= best) {
      return false;
    }
    this.store.saveRetoBest(kid, { ...doc, [deckId]: score });
    return true;
  }
}

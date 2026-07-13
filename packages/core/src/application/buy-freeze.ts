import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { FREEZE_COST, freezesOrStarting } from "../domain/weekly";
import { trySpend } from "./spend-stars";

/** Buy one ❄️ escudo for FREEZE_COST⭐. Null when the kid can't afford it. */
export class BuyFreezeUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId): { freezes: number; stars: number } | null {
    const stars = trySpend(this.store, kid, FREEZE_COST);
    if (stars === null) {
      return null;
    }
    const freezes = freezesOrStarting(this.store.loadFreezes(kid)) + 1;
    this.store.saveFreezes(kid, freezes);
    return { freezes, stars };
  }
}

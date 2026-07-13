import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { defaultCollection } from "../domain/mascota";
import type { RandomSource } from "../domain/random";
import { drawSurprise, SURPRISE_COST } from "../domain/surprise";
import type { SurpriseResult } from "../domain/surprise";
import { buyAccessory, wear } from "../domain/wardrobe";
import { freezesOrStarting } from "../domain/weekly";
import { bankStars } from "./earn-stars";
import { trySpend } from "./spend-stars";

/** La caja sorpresa: spend, draw, apply. Null when unaffordable. */
export class OpenSurpriseUseCase {
  constructor(
    private readonly store: EconomyStore,
    private readonly random: RandomSource,
  ) {}

  execute(kid: KidId): { result: SurpriseResult; stars: number } | null {
    const owned = this.store.loadOwnedAccessories(kid);
    const stars = trySpend(this.store, kid, SURPRISE_COST);
    if (stars === null) {
      return null;
    }
    const result = drawSurprise(this.random, owned);
    if (result.type === "accessory") {
      this.store.saveOwnedAccessories(kid, buyAccessory(owned, result.id));
      const c = this.store.loadPetCollection(kid) ?? defaultCollection();
      const pet = wear(c.pets[c.active] ?? { meals: 0, lastFed: null }, result.id);
      this.store.savePetCollection(kid, {
        ...c,
        pets: { ...c.pets, [c.active]: pet },
      });
      return { result, stars };
    }
    if (result.type === "freeze") {
      this.store.saveFreezes(
        kid,
        freezesOrStarting(this.store.loadFreezes(kid)) + 1,
      );
      return { result, stars };
    }
    return { result, stars: bankStars(this.store, kid, result.amount) };
  }
}

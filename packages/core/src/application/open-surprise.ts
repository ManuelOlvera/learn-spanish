import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { defaultCollection, petShownForm } from "../domain/mascota";
import type { RandomSource } from "../domain/random";
import { drawSurprise, SURPRISE_COST } from "../domain/surprise";
import type { SurpriseResult } from "../domain/surprise";
import { buyAccessory, wear } from "../domain/wardrobe";
import { freezesOrStarting } from "../domain/weekly";
import { bankStars } from "./earn-stars";
import { grantBoost } from "./grant-boost";
import { trySpend } from "./spend-stars";

/** La caja sorpresa: spend, draw, apply. Null when unaffordable. Takes the
 *  clock because one of the prizes (a ⚡ hora doble) is a timed window. */
export class OpenSurpriseUseCase {
  constructor(
    private readonly store: EconomyStore,
    private readonly random: RandomSource,
  ) {}

  execute(
    kid: KidId,
    now: Date,
  ): { result: SurpriseResult; stars: number } | null {
    const owned = this.store.loadOwnedAccessories(kid);
    const stars = trySpend(this.store, kid, SURPRISE_COST);
    if (stars === null) {
      return null;
    }
    const result = drawSurprise(this.random, owned);
    if (result.type === "accessory") {
      this.store.saveOwnedAccessories(kid, buyAccessory(owned, result.id));
      const c = this.store.loadPetCollection(kid) ?? defaultCollection();
      const current = c.pets[c.active] ?? { meals: 0, lastFed: null };
      const pet = wear(current, petShownForm(c.active, current), result.id);
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
    if (result.type === "boost") {
      grantBoost(this.store, kid, result.tier, now);
      return { result, stars };
    }
    return { result, stars: bankStars(this.store, kid, result.amount) };
  }
}

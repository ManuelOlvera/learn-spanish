import { dayKey } from "../domain/daily";
import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { defaultCollection, feedPet } from "../domain/mascota";
import type { PetState } from "../domain/mascota";
import { MEAL_COST } from "../domain/stars";
import { trySpend } from "./spend-stars";

/** Feed the active pet one meal (MEAL_COST⭐). Null when unaffordable. */
export class FeedPetUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, now: Date): { pet: PetState; stars: number } | null {
    const stars = trySpend(this.store, kid, MEAL_COST);
    if (stars === null) {
      return null;
    }
    const c = this.store.loadPetCollection(kid) ?? defaultCollection();
    const pet = feedPet(c.pets[c.active] ?? null, dayKey(now));
    this.store.savePetCollection(kid, {
      ...c,
      pets: { ...c.pets, [c.active]: pet },
    });
    return { pet, stars };
  }
}

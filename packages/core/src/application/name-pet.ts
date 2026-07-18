import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { defaultCollection, namePet, type PetCollection } from "../domain/mascota";

/** Name (or rename) the kid's active pet. Returns the updated collection so the
 *  caller can re-render without a reload. Naming is free — it costs no stars. */
export class NamePetUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, name: string): PetCollection {
    const collection = this.store.loadPetCollection(kid) ?? defaultCollection();
    const active = collection.pets[collection.active] ?? { meals: 0, lastFed: null };
    const next: PetCollection = {
      ...collection,
      pets: { ...collection.pets, [collection.active]: namePet(active, name) },
    };
    this.store.savePetCollection(kid, next);
    return next;
  }
}

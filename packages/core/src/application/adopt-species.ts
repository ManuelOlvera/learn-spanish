import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { defaultCollection, PET_SPECIES } from "../domain/mascota";
import type { PetCollection } from "../domain/mascota";
import { trySpend } from "./spend-stars";

/**
 * Adopt a new species (a fresh egg) and make it active. The price comes from
 * the PET_SPECIES catalog — the caller names the species, never the cost.
 * Null for an unknown species, an already-owned one, or an empty wallet.
 */
export class AdoptSpeciesUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(
    kid: KidId,
    speciesId: string,
  ): { collection: PetCollection; stars: number } | null {
    const species = PET_SPECIES.find((s) => s.id === speciesId);
    if (species === undefined) {
      return null;
    }
    const c = this.store.loadPetCollection(kid) ?? defaultCollection();
    if (c.owned.includes(speciesId)) {
      return null;
    }
    const stars = trySpend(this.store, kid, species.cost);
    if (stars === null) {
      return null;
    }
    const collection: PetCollection = {
      active: speciesId,
      owned: [...c.owned, speciesId],
      pets: { ...c.pets, [speciesId]: { meals: 0, lastFed: null } },
    };
    this.store.savePetCollection(kid, collection);
    return { collection, stars };
  }
}

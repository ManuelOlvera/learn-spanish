import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { defaultCollection } from "../domain/mascota";

/** Put an owned species on screen. A species the kid doesn't own is ignored. */
export class SetActiveSpeciesUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, speciesId: string): void {
    const c = this.store.loadPetCollection(kid) ?? defaultCollection();
    if (c.owned.includes(speciesId)) {
      this.store.savePetCollection(kid, { ...c, active: speciesId });
    }
  }
}

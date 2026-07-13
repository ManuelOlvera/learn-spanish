import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { defaultCollection } from "../domain/mascota";
import type { PetState } from "../domain/mascota";
import { placeAccessory } from "../domain/wardrobe";

/** Save where the kid dragged an accessory on the active pet (percent coords,
 *  clamped by the domain rule). Free and per-pet, like toggling. */
export class PlaceAccessoryUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, accessoryId: string, x: number, y: number): PetState {
    const c = this.store.loadPetCollection(kid) ?? defaultCollection();
    const pet = c.pets[c.active] ?? { meals: 0, lastFed: null };
    const next = placeAccessory(pet, accessoryId, x, y);
    this.store.savePetCollection(kid, { ...c, pets: { ...c.pets, [c.active]: next } });
    return next;
  }
}

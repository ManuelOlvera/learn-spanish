import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { defaultCollection, petShownForm } from "../domain/mascota";
import type { PetState } from "../domain/mascota";
import { placeAccessory } from "../domain/wardrobe";

/** Save where the kid dragged an accessory on the form the active pet is
 *  showing (percent coords, clamped by the domain rule). Free and per-form,
 *  like toggling — the spot that fits a hen is not the spot that fits its egg. */
export class PlaceAccessoryUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, accessoryId: string, x: number, y: number): PetState {
    const c = this.store.loadPetCollection(kid) ?? defaultCollection();
    const pet = c.pets[c.active] ?? { meals: 0, lastFed: null };
    const next = placeAccessory(pet, petShownForm(c.active, pet), accessoryId, x, y);
    this.store.savePetCollection(kid, { ...c, pets: { ...c.pets, [c.active]: next } });
    return next;
  }
}

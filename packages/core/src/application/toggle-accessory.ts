import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { defaultCollection, petShownForm } from "../domain/mascota";
import type { PetState } from "../domain/mascota";
import { ownsAccessory, toggleWorn } from "../domain/wardrobe";

/** Put on / take off an owned accessory on the form the active pet is showing.
 *  Free — owning is permanent, only that form's outfit changes. Null when the
 *  kid doesn't own it. */
export class ToggleAccessoryUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, accessoryId: string): PetState | null {
    if (!ownsAccessory(this.store.loadOwnedAccessories(kid), accessoryId)) {
      return null;
    }
    const c = this.store.loadPetCollection(kid) ?? defaultCollection();
    const pet = c.pets[c.active] ?? { meals: 0, lastFed: null };
    const next = toggleWorn(pet, petShownForm(c.active, pet), accessoryId);
    this.store.savePetCollection(kid, { ...c, pets: { ...c.pets, [c.active]: next } });
    return next;
  }
}

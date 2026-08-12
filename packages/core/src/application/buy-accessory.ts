import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { defaultCollection, petShownForm } from "../domain/mascota";
import { ACCESSORIES, buyAccessory, ownsAccessory, wear } from "../domain/wardrobe";
import { trySpend } from "./spend-stars";

/**
 * Buy a wardrobe accessory (owned kid-level, worn per-form) and put it straight
 * on the pet's form on screen. The price comes from the ACCESSORIES catalog — the caller
 * names the item, never the cost. Null for an unknown id, an owned item, or an
 * empty wallet.
 */
export class BuyAccessoryUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(
    kid: KidId,
    accessoryId: string,
  ): { owned: readonly string[]; stars: number } | null {
    const accessory = ACCESSORIES.find((a) => a.id === accessoryId);
    if (accessory === undefined) {
      return null;
    }
    const owned = this.store.loadOwnedAccessories(kid);
    if (ownsAccessory(owned, accessoryId)) {
      return null;
    }
    const stars = trySpend(this.store, kid, accessory.cost);
    if (stars === null) {
      return null;
    }
    const next = buyAccessory(owned, accessoryId);
    this.store.saveOwnedAccessories(kid, next);
    const c = this.store.loadPetCollection(kid) ?? defaultCollection();
    const current = c.pets[c.active] ?? { meals: 0, lastFed: null };
    const pet = wear(current, petShownForm(c.active, current), accessoryId);
    this.store.savePetCollection(kid, { ...c, pets: { ...c.pets, [c.active]: pet } });
    return { owned: next, stars };
  }
}

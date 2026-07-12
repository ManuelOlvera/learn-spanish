import type { PetState } from "./mascota";

/** El armario: accessories bought with stars — the economy's permanent
 *  sink once the pet is fully grown. */
export interface Accessory {
  readonly id: string;
  readonly emoji: string;
  readonly cost: number;
}

export const ACCESSORIES: readonly Accessory[] = [
  { id: "gorro", emoji: "🎩", cost: 20 },
  { id: "globo-fiesta", emoji: "🎈", cost: 25 },
  { id: "gafas", emoji: "🕶️", cost: 30 },
  { id: "lazo", emoji: "🎀", cost: 35 },
  { id: "corona", emoji: "👑", cost: 50 },
  { id: "varita", emoji: "🪄", cost: 60 },
];

/** The accessories currently on the pet. An undefined `worn` list means the
 *  kid has never toggled anything, so every owned item shows (back-compat for
 *  pets saved before put-on/take-off existed). */
export function wornAccessories(pet: PetState): readonly string[] {
  return pet.worn ?? pet.accessories ?? [];
}

/** Buy an accessory: own it and put it straight on so the kid sees it. */
export function buyAccessory(pet: PetState, accessoryId: string): PetState {
  const owned = pet.accessories ?? [];
  if (owned.includes(accessoryId)) {
    return pet;
  }
  return {
    ...pet,
    accessories: [...owned, accessoryId],
    worn: [...wornAccessories(pet), accessoryId],
  };
}

/** Put on / take off an owned accessory. Owning is permanent; only `worn`
 *  changes. A no-op for an accessory the pet doesn't own. */
export function toggleAccessory(pet: PetState, accessoryId: string): PetState {
  const owned = pet.accessories ?? [];
  if (!owned.includes(accessoryId)) {
    return pet;
  }
  const worn = wornAccessories(pet);
  return {
    ...pet,
    worn: worn.includes(accessoryId)
      ? worn.filter((id) => id !== accessoryId)
      : [...worn, accessoryId],
  };
}

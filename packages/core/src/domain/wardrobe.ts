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

export function buyAccessory(pet: PetState, accessoryId: string): PetState {
  const owned = pet.accessories ?? [];
  if (owned.includes(accessoryId)) {
    return pet;
  }
  return { ...pet, accessories: [...owned, accessoryId] };
}

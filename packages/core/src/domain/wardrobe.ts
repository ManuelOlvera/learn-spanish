import type { PetState } from "./mascota";

/** El armario: accessories bought with stars — the economy's permanent
 *  sink once the pet is fully grown. Ownership belongs to the *kid* (buy a
 *  crown once), while *wearing* is per-pet, so each mascot keeps its own
 *  outfit. */
export interface Accessory {
  readonly id: string;
  readonly emoji: string;
  readonly cost: number;
}

export const ACCESSORIES: readonly Accessory[] = [
  { id: "flor", emoji: "🌸", cost: 18 },
  { id: "gorro", emoji: "🎩", cost: 20 },
  { id: "piruli", emoji: "🍭", cost: 20 },
  { id: "gorra", emoji: "🧢", cost: 22 },
  { id: "bufanda", emoji: "🧣", cost: 24 },
  { id: "globo-fiesta", emoji: "🎈", cost: 25 },
  { id: "gafas-ver", emoji: "👓", cost: 26 },
  { id: "gafas", emoji: "🕶️", cost: 30 },
  { id: "lazo", emoji: "🎀", cost: 35 },
  { id: "mariposa", emoji: "🦋", cost: 40 },
  { id: "corona", emoji: "👑", cost: 50 },
  { id: "varita", emoji: "🪄", cost: 60 },
];

// ---- ownership: a kid-level set (buy each accessory once) ----

export function ownsAccessory(owned: readonly string[], id: string): boolean {
  return owned.includes(id);
}

/** Add a newly-bought accessory to the kid's owned set (idempotent). */
export function buyAccessory(
  owned: readonly string[],
  id: string,
): readonly string[] {
  return owned.includes(id) ? owned : [...owned, id];
}

// ---- wearing: a per-pet outfit ----

/** The accessories currently on this pet. An undefined `worn` list falls back
 *  to the pet's legacy per-pet `accessories` (so pets saved before ownership
 *  moved kid-level keep showing what they wore), else nothing. */
export function wornAccessories(pet: PetState): readonly string[] {
  return pet.worn ?? pet.accessories ?? [];
}

/** Put an accessory on the pet (idempotent). Caller ensures the kid owns it. */
export function wear(pet: PetState, id: string): PetState {
  const worn = wornAccessories(pet);
  return worn.includes(id) ? pet : { ...pet, worn: [...worn, id] };
}

/** Put on / take off an accessory on this pet. Caller ensures the kid owns it. */
export function toggleWorn(pet: PetState, id: string): PetState {
  const worn = wornAccessories(pet);
  return {
    ...pet,
    worn: worn.includes(id)
      ? worn.filter((w) => w !== id)
      : [...worn, id],
  };
}

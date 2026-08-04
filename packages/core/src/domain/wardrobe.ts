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

/** Listed cheapest-first (the shop renders in this order). Costs start at a
 *  few games' worth of stars and climb into real savings goals — the wardrobe
 *  is meant to outlast the pet roster, not empty in a weekend. */
export const ACCESSORIES: readonly Accessory[] = [
  { id: "flor", emoji: "🌸", cost: 40 },
  { id: "gorro", emoji: "🎩", cost: 45 },
  { id: "piruli", emoji: "🍭", cost: 45 },
  { id: "gorra", emoji: "🧢", cost: 50 },
  { id: "bufanda", emoji: "🧣", cost: 55 },
  { id: "globo-fiesta", emoji: "🎈", cost: 60 },
  { id: "gafas-ver", emoji: "👓", cost: 65 },
  { id: "estrella", emoji: "⭐", cost: 70 },
  { id: "gafas", emoji: "🕶️", cost: 75 },
  { id: "medalla", emoji: "🏅", cost: 80 },
  { id: "lazo", emoji: "🎀", cost: 85 },
  { id: "birrete", emoji: "🎓", cost: 90 },
  { id: "mariposa", emoji: "🦋", cost: 95 },
  { id: "paraguas", emoji: "☂️", cost: 100 },
  { id: "reloj", emoji: "⌚", cost: 110 },
  { id: "trebol", emoji: "🍀", cost: 120 },
  { id: "corona", emoji: "👑", cost: 135 },
  { id: "varita", emoji: "🪄", cost: 150 },
  { id: "pelota", emoji: "⚽", cost: 160 },
  { id: "helado", emoji: "🍦", cost: 175 },
  { id: "osito", emoji: "🧸", cost: 190 },
  { id: "guitarra", emoji: "🎸", cost: 210 },
  { id: "arcoiris", emoji: "🌈", cost: 230 },
  { id: "cometa", emoji: "🪁", cost: 250 },
  { id: "cohete", emoji: "🚀", cost: 270 },
  { id: "luna", emoji: "🌙", cost: 290 },
  { id: "bola-magica", emoji: "🔮", cost: 320 },
  { id: "diamante", emoji: "💎", cost: 350 },
  { id: "dona", emoji: "🍩", cost: 380 },
  { id: "girasol", emoji: "🌻", cost: 410 },
  { id: "tambor", emoji: "🥁", cost: 440 },
  { id: "patineta", emoji: "🛹", cost: 470 },
  { id: "burbujas", emoji: "🫧", cost: 500 },
  { id: "violin", emoji: "🎻", cost: 540 },
  { id: "pinata", emoji: "🪅", cost: 580 },
  { id: "disco", emoji: "🪩", cost: 620 },
  { id: "trofeo", emoji: "🏆", cost: 660 },
  { id: "planeta", emoji: "🪐", cost: 700 },
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

// ---- placement: where on the pet the kid dragged each accessory ----

/** A spot on the pet box, as a percent of its width/height (0–100). */
export interface AccessoryPlacement {
  readonly x: number;
  readonly y: number;
}

const clampPercent = (n: number): number => Math.max(0, Math.min(100, n));

/** Move an accessory to a spot the kid dragged it to (percent coords, clamped
 *  to the pet box). Overwrites this accessory's spot only; others are untouched.
 *  Non-finite input is ignored so a bad drag can't corrupt the outfit. */
export function placeAccessory(
  pet: PetState,
  id: string,
  x: number,
  y: number,
): PetState {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return pet;
  }
  return {
    ...pet,
    placements: {
      ...(pet.placements ?? {}),
      [id]: { x: clampPercent(x), y: clampPercent(y) },
    },
  };
}

/** The kid's saved spot for an accessory, or null to use the app's default. */
export function accessoryPlacement(
  pet: PetState,
  id: string,
): AccessoryPlacement | null {
  return pet.placements?.[id] ?? null;
}

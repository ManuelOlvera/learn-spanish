import type { KidId } from "./kid";

/** La mascota: each kid's creature, fed with stars, growing in stages.
 *  It can get hungry (a gentle droop) but never suffers worse. */
export interface PetState {
  readonly meals: number;
  /** dayKey of the last meal; null for an unhatched egg. */
  readonly lastFed: string | null;
  /** Wardrobe accessory ids the pet owns (see domain/wardrobe.ts). */
  readonly accessories?: readonly string[];
  /** Owned accessory ids currently on the pet. Undefined means "not yet
   *  chosen" — treated as every owned item (see wornAccessories). */
  readonly worn?: readonly string[];
}

export interface PetStore {
  load(kid: KidId): Promise<PetState | null>;
  save(kid: KidId, pet: PetState): Promise<void>;
}

/** Adoptable creatures — a renewable star sink: each new pet starts as a
 *  fresh egg to feed and grow, so feeding never runs out of purpose. */
export interface PetSpecies {
  readonly id: string;
  readonly nameSpanish: string;
  readonly nameEnglish: string;
  /** Stars to adopt (0 = the free starter). */
  readonly cost: number;
  /** Emoji from youngest to grown — each animal grows as its own kind, so the
   *  list is species-length: egg-layers (chick, dragon) hatch and pass through
   *  more forms; mammals (bunny, cat) are born as a baby and grow up once. */
  readonly stages: readonly string[];
}

export const PET_SPECIES: readonly PetSpecies[] = [
  { id: "pollito", nameSpanish: "El pollito", nameEnglish: "Chick", cost: 0, stages: ["🥚", "🐣", "🐥", "🐔"] },
  { id: "conejo", nameSpanish: "El conejo", nameEnglish: "Bunny", cost: 40, stages: ["🐰", "🐇"] },
  { id: "gato", nameSpanish: "El gato", nameEnglish: "Cat", cost: 70, stages: ["🐱", "🐈"] },
  { id: "perro", nameSpanish: "El perro", nameEnglish: "Dog", cost: 90, stages: ["🐶", "🐕"] },
  { id: "tortuga", nameSpanish: "La tortuga", nameEnglish: "Turtle", cost: 100, stages: ["🥚", "🐢"] },
  { id: "pinguino", nameSpanish: "El pingüino", nameEnglish: "Penguin", cost: 110, stages: ["🥚", "🐧"] },
  { id: "dragon", nameSpanish: "El dragón", nameEnglish: "Dragon", cost: 120, stages: ["🥚", "🐲", "🐉"] },
  { id: "unicornio", nameSpanish: "El unicornio", nameEnglish: "Unicorn", cost: 160, stages: ["🥚", "🦄"] },
];

export const STARTER_SPECIES = "pollito";

export function speciesStages(speciesId: string): readonly string[] {
  return (PET_SPECIES.find((s) => s.id === speciesId) ?? PET_SPECIES[0]!).stages;
}

/** A kid's whole menagerie: which pets they've adopted, which is on screen,
 *  and each pet's own growth. */
export interface PetCollection {
  readonly active: string;
  readonly owned: readonly string[];
  readonly pets: Readonly<Record<string, PetState>>;
}

export function defaultCollection(): PetCollection {
  return {
    active: STARTER_SPECIES,
    owned: [STARTER_SPECIES],
    pets: { [STARTER_SPECIES]: { meals: 0, lastFed: null } },
  };
}

/** 0 egg → 1 hatched (3 meals) → 2 growing (8) → 3 grown (15). */
export const PET_STAGE_MEALS = [0, 3, 8, 15] as const;

export function petStage(meals: number): number {
  let stage = 0;
  for (let i = 0; i < PET_STAGE_MEALS.length; i++) {
    if (meals >= PET_STAGE_MEALS[i]!) {
      stage = i;
    }
  }
  return stage;
}

/** The emoji to draw for a species at its current meal count. Growth level
 *  (0–3, from meals) is scaled onto the species' own stage list, so a two-form
 *  animal reaches its grown look partway and a four-form one hits every beat. */
export function petEmoji(speciesId: string, meals: number): string {
  const stages = speciesStages(speciesId);
  if (stages.length <= 1) {
    return stages[0]!;
  }
  const level = petStage(meals);
  const topLevel = PET_STAGE_MEALS.length - 1;
  const index = Math.round((level / topLevel) * (stages.length - 1));
  return stages[index]!;
}

export function feedPet(pet: PetState | null, today: string): PetState {
  // Spread first so the wardrobe (accessories/worn) survives every feed —
  // growth must never undress the pet.
  return { ...pet, meals: (pet?.meals ?? 0) + 1, lastFed: today };
}

const HUNGRY_AFTER_DAYS = 2;

export function isPetHungry(pet: PetState | null, today: string): boolean {
  if (pet === null || pet.lastFed === null) {
    return false;
  }
  const last = new Date(`${pet.lastFed}T00:00:00Z`).getTime();
  const now = new Date(`${today}T00:00:00Z`).getTime();
  return now - last >= HUNGRY_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

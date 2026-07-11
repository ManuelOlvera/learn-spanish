import type { KidId } from "./kid";

/** La mascota: each kid's creature, fed with stars, growing in stages.
 *  It can get hungry (a gentle droop) but never suffers worse. */
export interface PetState {
  readonly meals: number;
  /** dayKey of the last meal; null for an unhatched egg. */
  readonly lastFed: string | null;
  /** Wardrobe accessory ids the pet owns (see domain/wardrobe.ts). */
  readonly accessories?: readonly string[];
}

export interface PetStore {
  load(kid: KidId): Promise<PetState | null>;
  save(kid: KidId, pet: PetState): Promise<void>;
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

export function feedPet(pet: PetState | null, today: string): PetState {
  return { meals: (pet?.meals ?? 0) + 1, lastFed: today };
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

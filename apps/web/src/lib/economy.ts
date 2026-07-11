"use client";

/**
 * Client-side economy orchestration: thin localStorage-backed records
 * (rules live in core — earnedStars, mission, tiers, mascota). One JSON
 * document per concern, all per-kid keyed, all failure-tolerant.
 */
import {
  buyAccessory,
  dailyMission,
  dayKey,
  defaultCollection,
  drawSurprise,
  feedPet,
  markMissionDone,
  MEAL_COST,
  MISSION_BONUS,
  missionComplete,
  SURPRISE_COST,
  type KidId,
  type MissionKind,
  type MissionState,
  type PetCollection,
  type PetState,
  type SurpriseResult,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";

function readDoc<T>(key: string): Partial<Record<KidId, T>> {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Partial<Record<KidId, T>>)
      : {};
  } catch (err) {
    log.warn("economy", `${key} unreadable, starting empty`, { err });
    return {};
  }
}

function writeDoc<T>(key: string, kid: KidId, value: T): void {
  try {
    const all = readDoc<T>(key);
    all[kid] = value;
    window.localStorage.setItem(key, JSON.stringify(all));
  } catch (err) {
    log.warn("economy", `could not persist ${key}`, { err });
  }
}

const STARS_KEY = "palabras.stars.v1";
const MISSION_KEY = "palabras.mission.v1";
const PET_KEY = "palabras.pet.v1"; // legacy single pet (migrated to v2)
const PETS_KEY = "palabras.pets.v2"; // pet collection
const COUNTS_KEY = "palabras.sticker-counts.v1";
const OWNED_AVATARS_KEY = "palabras.owned-avatars.v1";

// ---- stars ----

export function getStars(kid: KidId): number {
  const value = readDoc<number>(STARS_KEY)[kid];
  return typeof value === "number" && value >= 0 ? value : 0;
}

export function addStars(kid: KidId, amount: number): number {
  const next = getStars(kid) + amount;
  writeDoc(STARS_KEY, kid, next);
  return next;
}

/** Returns the new balance, or null if the kid cannot afford it. */
export function spendStars(kid: KidId, amount: number): number | null {
  const current = getStars(kid);
  if (current < amount) {
    return null;
  }
  const next = current - amount;
  writeDoc(STARS_KEY, kid, next);
  return next;
}

// ---- daily mission ----

export interface MissionView {
  readonly kinds: readonly MissionKind[];
  readonly state: MissionState;
  readonly complete: boolean;
}

export function getMission(kid: KidId): MissionView {
  const today = dayKey(new Date());
  const kinds = dailyMission(new Date(), kid);
  const stored = readDoc<MissionState>(MISSION_KEY)[kid] ?? null;
  const state =
    stored !== null && stored.day === today
      ? stored
      : { day: today, done: [], claimed: false };
  return { kinds, state, complete: missionComplete(state, kinds) };
}

export function markActivityDone(kid: KidId, kind: MissionKind): MissionView {
  const today = dayKey(new Date());
  const stored = readDoc<MissionState>(MISSION_KEY)[kid] ?? null;
  const next = markMissionDone(stored, today, kind);
  writeDoc(MISSION_KEY, kid, next);
  return getMission(kid);
}

/** The +10⭐ bonus chest; a no-op if already claimed or incomplete. */
export function claimMissionBonus(kid: KidId): number | null {
  const mission = getMission(kid);
  if (!mission.complete || mission.state.claimed) {
    return null;
  }
  writeDoc(MISSION_KEY, kid, { ...mission.state, claimed: true });
  return addStars(kid, MISSION_BONUS);
}

// ---- mascota (a collection of adopted pets) ----

export function getPetCollection(kid: KidId): PetCollection {
  const stored = readDoc<PetCollection>(PETS_KEY)[kid];
  if (
    stored !== undefined &&
    typeof stored.active === "string" &&
    Array.isArray(stored.owned) &&
    typeof stored.pets === "object"
  ) {
    return stored;
  }
  // Migrate the pre-collection single pet into the starter slot.
  const legacy = readDoc<PetState>(PET_KEY)[kid];
  const collection = defaultCollection();
  if (legacy !== undefined && typeof legacy.meals === "number") {
    return {
      ...collection,
      pets: { ...collection.pets, [collection.active]: legacy },
    };
  }
  return collection;
}

export function savePetCollection(kid: KidId, collection: PetCollection): void {
  writeDoc(PETS_KEY, kid, collection);
}

export function getActivePet(kid: KidId): PetState {
  const c = getPetCollection(kid);
  return c.pets[c.active] ?? { meals: 0, lastFed: null };
}

/** Feed the active pet; spends MEAL_COST, null if unaffordable. */
export function feedActivePet(
  kid: KidId,
): { pet: PetState; stars: number } | null {
  const stars = spendStars(kid, MEAL_COST);
  if (stars === null) {
    return null;
  }
  const c = getPetCollection(kid);
  const pet = feedPet(c.pets[c.active] ?? null, dayKey(new Date()));
  savePetCollection(kid, { ...c, pets: { ...c.pets, [c.active]: pet } });
  return { pet, stars };
}

/** Adopt a new species (a fresh egg) and make it active; null if unaffordable. */
export function adoptSpecies(
  kid: KidId,
  speciesId: string,
  cost: number,
): { collection: PetCollection; stars: number } | null {
  const c = getPetCollection(kid);
  if (c.owned.includes(speciesId)) {
    return null;
  }
  const stars = spendStars(kid, cost);
  if (stars === null) {
    return null;
  }
  const collection: PetCollection = {
    active: speciesId,
    owned: [...c.owned, speciesId],
    pets: { ...c.pets, [speciesId]: { meals: 0, lastFed: null } },
  };
  savePetCollection(kid, collection);
  return { collection, stars };
}

export function setActiveSpecies(kid: KidId, speciesId: string): void {
  const c = getPetCollection(kid);
  if (c.owned.includes(speciesId)) {
    savePetCollection(kid, { ...c, active: speciesId });
  }
}

/** Buy a wardrobe accessory for the active pet; null if unaffordable/owned. */
export function buyAccessoryForActive(
  kid: KidId,
  accessoryId: string,
  cost: number,
): { pet: PetState; stars: number } | null {
  const c = getPetCollection(kid);
  const pet = c.pets[c.active] ?? { meals: 0, lastFed: null };
  if ((pet.accessories ?? []).includes(accessoryId)) {
    return null;
  }
  const stars = spendStars(kid, cost);
  if (stars === null) {
    return null;
  }
  const dressed = buyAccessory(pet, accessoryId);
  savePetCollection(kid, { ...c, pets: { ...c.pets, [c.active]: dressed } });
  return { pet: dressed, stars };
}

/** La caja sorpresa: spend, draw, apply. null if unaffordable. */
export function openSurprise(
  kid: KidId,
): { result: SurpriseResult; stars: number } | null {
  const c = getPetCollection(kid);
  const pet = c.pets[c.active] ?? { meals: 0, lastFed: null };
  const stars = spendStars(kid, SURPRISE_COST);
  if (stars === null) {
    return null;
  }
  const result = drawSurprise(Math.random, pet.accessories ?? []);
  if (result.type === "accessory") {
    const dressed = buyAccessory(pet, result.id);
    savePetCollection(kid, { ...c, pets: { ...c.pets, [c.active]: dressed } });
    return { result, stars };
  }
  return { result, stars: addStars(kid, result.amount) };
}

// ---- sticker completion counts (tiers) ----

export function getStickerCounts(): Readonly<Record<string, number>> {
  try {
    const raw = window.localStorage.getItem(COUNTS_KEY);
    if (raw === null) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, number>)
      : {};
  } catch (err) {
    log.warn("economy", "sticker counts unreadable", { err });
    return {};
  }
}

export function saveStickerCounts(
  counts: Readonly<Record<string, number>>,
): void {
  try {
    window.localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
  } catch (err) {
    log.warn("economy", "could not persist sticker counts", { err });
  }
}

export function setStars(kid: KidId, amount: number): void {
  writeDoc(STARS_KEY, kid, amount);
}

// ---- owned avatars (bought with stars) ----

export function getOwnedAvatars(kid: KidId): readonly string[] {
  const value = readDoc<readonly string[]>(OWNED_AVATARS_KEY)[kid];
  return Array.isArray(value) ? value.filter((e) => typeof e === "string") : [];
}

export function saveOwnedAvatars(kid: KidId, owned: readonly string[]): void {
  writeDoc(OWNED_AVATARS_KEY, kid, owned);
}

/** Buy an avatar; returns the new balance, or null if unaffordable/owned. */
export function buyAvatar(
  kid: KidId,
  emoji: string,
  cost: number,
): number | null {
  const owned = getOwnedAvatars(kid);
  if (owned.includes(emoji)) {
    return null;
  }
  const stars = spendStars(kid, cost);
  if (stars === null) {
    return null;
  }
  saveOwnedAvatars(kid, [...owned, emoji]);
  return stars;
}

// ---- reto best scores ----

const RETO_KEY = "palabras.reto.v1";

export function getRetoBest(kid: KidId, deckId: string): number {
  const doc = readDoc<Record<string, number>>(RETO_KEY)[kid];
  const value = doc?.[deckId];
  return typeof value === "number" && value >= 0 ? value : 0;
}

/** Returns true when the score sets a new record (and saves it). */
export function saveRetoBest(kid: KidId, deckId: string, score: number): boolean {
  const best = getRetoBest(kid, deckId);
  if (score <= best) {
    return false;
  }
  const doc = readDoc<Record<string, number>>(RETO_KEY)[kid] ?? {};
  writeDoc(RETO_KEY, kid, { ...doc, [deckId]: score });
  return true;
}

/** Port adapter for the tier-aware award use case. */
export class LocalStorageStickerCountsStore {
  load(): Promise<Readonly<Record<string, number>>> {
    return Promise.resolve(getStickerCounts());
  }
  save(counts: Readonly<Record<string, number>>): Promise<void> {
    saveStickerCounts(counts);
    return Promise.resolve();
  }
}

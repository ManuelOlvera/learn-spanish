"use client";

/**
 * Client-side economy orchestration: thin localStorage-backed records
 * (rules live in core — earnedStars, mission, tiers, mascota). One JSON
 * document per concern, all per-kid keyed, all failure-tolerant.
 */
import {
  dailyMission,
  dayKey,
  feedPet,
  markMissionDone,
  MEAL_COST,
  MISSION_BONUS,
  missionComplete,
  type KidId,
  type MissionKind,
  type MissionState,
  type PetState,
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
const PET_KEY = "palabras.pet.v1";
const COUNTS_KEY = "palabras.sticker-counts.v1";

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

// ---- mascota ----

export function getPet(kid: KidId): PetState {
  return readDoc<PetState>(PET_KEY)[kid] ?? { meals: 0, lastFed: null };
}

/** Spends MEAL_COST stars and feeds; null if the kid cannot afford it. */
export function feedPetFor(kid: KidId): { pet: PetState; stars: number } | null {
  const stars = spendStars(kid, MEAL_COST);
  if (stars === null) {
    return null;
  }
  const pet = feedPet(getPet(kid), dayKey(new Date()));
  writeDoc(PET_KEY, kid, pet);
  return { pet, stars };
}

export function savePet(kid: KidId, pet: PetState): void {
  writeDoc(PET_KEY, kid, pet);
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

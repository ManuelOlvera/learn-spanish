"use client";

/**
 * Client-side economy orchestration: thin localStorage-backed records
 * (rules live in core — earnedStars, mission, tiers, mascota). One JSON
 * document per concern, all per-kid keyed, all failure-tolerant.
 */
import {
  activitiesForKid,
  buyAccessory,
  categoryReward,
  categoryTier,
  dailyMission,
  dayKey,
  defaultCollection,
  drawSurprise,
  feedPet,
  markActiveDay,
  markMissionDone,
  ownsAccessory,
  pendingCategoryTier,
  placeAccessory,
  rollWeek,
  stickerId,
  toggleWorn,
  wear,
  weekActiveDayCount,
  weekKey,
  FREEZE_COST,
  MEAL_COST,
  MISSION_BONUS,
  missionComplete,
  STARTING_FREEZES,
  SURPRISE_COST,
  type ActivityId,
  type KidId,
  type MissionKind,
  type MissionState,
  type PetCollection,
  type PetState,
  type RolloverOutcome,
  type StickerTier,
  type SurpriseResult,
  type WeekProgress,
  type WeeklyStreak,
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
const OWNED_ACCESSORIES_KEY = "palabras.owned-accessories.v1";
const UNLOCKS_KEY = "palabras.unlocks.v1";
const WEEKLY_KEY = "palabras.weekly.v1"; // WeeklyStreak per kid
const WEEK_PROGRESS_KEY = "palabras.week-progress.v1"; // WeekProgress per kid
const FREEZES_KEY = "palabras.freezes.v1"; // freeze count per kid
const CATEGORY_AWARDS_KEY = "palabras.category-awards.v1"; // highest category tier claimed, per deck

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
  const view = getMission(kid);
  // Finishing the daily mission makes today count toward the weekly streak.
  if (view.complete) {
    markMissionActiveDay(kid);
  }
  return view;
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

// ---- weekly streak & freezes ----

export interface WeeklyView {
  /** The weekly streak to show (active weeks earned so far). */
  readonly count: number;
  readonly freezes: number;
  /** Active days recorded this week (0…ACTIVE_WEEK_DAYS). */
  readonly activeDays: number;
  /** What the week rollover did — drives the once-per-week animation. */
  readonly outcome: RolloverOutcome;
}

/** Freezes default to STARTING_FREEZES for a kid who has never had the key
 *  (so every profile starts with three); a stored 0 stays 0. */
export function getFreezes(kid: KidId): number {
  const value = readDoc<number>(FREEZES_KEY)[kid];
  return typeof value === "number" && value >= 0 ? value : STARTING_FREEZES;
}

function setFreezes(kid: KidId, count: number): void {
  writeDoc(FREEZES_KEY, kid, Math.max(0, count));
}

function getWeekProgress(kid: KidId): WeekProgress | null {
  const stored = readDoc<WeekProgress>(WEEK_PROGRESS_KEY)[kid];
  return stored !== undefined &&
    typeof stored.week === "string" &&
    Array.isArray(stored.days)
    ? stored
    : null;
}

/** Mark today as an active day toward this week's streak (idempotent). */
export function markMissionActiveDay(kid: KidId): void {
  const now = new Date();
  const progress = markActiveDay(getWeekProgress(kid), weekKey(now), dayKey(now));
  writeDoc(WEEK_PROGRESS_KEY, kid, progress);
}

/** Read the weekly streak, rolling finished weeks over first. Persists the new
 *  streak/freeze state so the rollover animation fires only on the first call
 *  of a new week. Call this on app open. */
export function rolloverWeekly(kid: KidId): WeeklyView {
  const currentWeek = weekKey(new Date());
  const stored = readDoc<WeeklyStreak>(WEEKLY_KEY)[kid] ?? null;
  const freezes = getFreezes(kid);
  const result = rollWeek(stored, freezes, getWeekProgress(kid), currentWeek);
  if (
    stored === null ||
    stored.week !== result.streak.week ||
    stored.count !== result.streak.count
  ) {
    writeDoc(WEEKLY_KEY, kid, result.streak);
  }
  if (result.freezes !== freezes) {
    setFreezes(kid, result.freezes);
  }
  return {
    count: result.streak.count,
    freezes: result.freezes,
    activeDays: weekActiveDayCount(getWeekProgress(kid), currentWeek),
    outcome: result.outcome,
  };
}

/** Buy one freeze for FREEZE_COST⭐. null when the kid can't afford it. */
export function buyFreeze(
  kid: KidId,
): { freezes: number; stars: number } | null {
  const stars = spendStars(kid, FREEZE_COST);
  if (stars === null) {
    return null;
  }
  const freezes = getFreezes(kid) + 1;
  setFreezes(kid, freezes);
  return { freezes, stars };
}

/** Read the weekly streak without rolling over (parent report, InformeView). */
export function getWeeklyCount(kid: KidId): number {
  return readDoc<WeeklyStreak>(WEEKLY_KEY)[kid]?.count ?? 0;
}

// ---- sync accessors (ADR 004): expose freeze/weekly state to the snapshot ----

/** The full weekly-streak record for a kid, or null if never played. */
export function getWeeklyStreak(kid: KidId): WeeklyStreak | null {
  return readDoc<WeeklyStreak>(WEEKLY_KEY)[kid] ?? null;
}

export function saveWeeklyStreak(kid: KidId, streak: WeeklyStreak): void {
  writeDoc(WEEKLY_KEY, kid, streak);
}

/** The in-progress week's active days for a kid, or null if none. */
export function getWeekProgressDoc(kid: KidId): WeekProgress | null {
  return getWeekProgress(kid);
}

export function saveWeekProgress(kid: KidId, progress: WeekProgress): void {
  writeDoc(WEEK_PROGRESS_KEY, kid, progress);
}

/** Set a kid's freeze count (used when a sync merge resolves freezes). */
export function setFreezesCount(kid: KidId, count: number): void {
  setFreezes(kid, count);
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

/** Pin which growth form the active pet displays (non-destructive: meals and
 *  growth are unchanged, only the shown look). */
export function setPetForm(kid: KidId, form: number): void {
  const c = getPetCollection(kid);
  const pet = c.pets[c.active] ?? { meals: 0, lastFed: null };
  savePetCollection(kid, { ...c, pets: { ...c.pets, [c.active]: { ...pet, form } } });
}

/** Wardrobe accessories the kid owns (bought once, wearable on any pet).
 *  Migrates one-time from the old per-pet `accessories` if the store is
 *  empty. */
export function getOwnedAccessories(kid: KidId): readonly string[] {
  const stored = readDoc<readonly string[]>(OWNED_ACCESSORIES_KEY)[kid];
  if (Array.isArray(stored)) {
    return stored.filter((id) => typeof id === "string");
  }
  const legacy = [
    ...new Set(
      Object.values(getPetCollection(kid).pets).flatMap(
        (p) => p.accessories ?? [],
      ),
    ),
  ];
  if (legacy.length > 0) {
    writeDoc(OWNED_ACCESSORIES_KEY, kid, legacy);
  }
  return legacy;
}

export function saveOwnedAccessories(
  kid: KidId,
  owned: readonly string[],
): void {
  writeDoc(OWNED_ACCESSORIES_KEY, kid, owned);
}

/** Buy a wardrobe accessory (kid-level) and put it on the active pet.
 *  null if unaffordable or already owned. */
export function buyAccessoryForActive(
  kid: KidId,
  accessoryId: string,
  cost: number,
): { owned: readonly string[]; stars: number } | null {
  const owned = getOwnedAccessories(kid);
  if (ownsAccessory(owned, accessoryId)) {
    return null;
  }
  const stars = spendStars(kid, cost);
  if (stars === null) {
    return null;
  }
  const next = buyAccessory(owned, accessoryId);
  saveOwnedAccessories(kid, next);
  const c = getPetCollection(kid);
  const pet = wear(c.pets[c.active] ?? { meals: 0, lastFed: null }, accessoryId);
  savePetCollection(kid, { ...c, pets: { ...c.pets, [c.active]: pet } });
  return { owned: next, stars };
}

/** Put on / take off an owned accessory on the active pet. Free — owning is
 *  permanent, only that pet's outfit changes. null if the kid doesn't own it. */
export function toggleAccessoryForActive(
  kid: KidId,
  accessoryId: string,
): PetState | null {
  if (!ownsAccessory(getOwnedAccessories(kid), accessoryId)) {
    return null;
  }
  const c = getPetCollection(kid);
  const pet = c.pets[c.active] ?? { meals: 0, lastFed: null };
  const next = toggleWorn(pet, accessoryId);
  savePetCollection(kid, { ...c, pets: { ...c.pets, [c.active]: next } });
  return next;
}

/** Save where the kid dragged an accessory on the active pet (percent coords).
 *  Free and per-pet, like toggling — only that pet's layout changes. */
export function placeAccessoryOnActive(
  kid: KidId,
  accessoryId: string,
  x: number,
  y: number,
): PetState {
  const c = getPetCollection(kid);
  const pet = c.pets[c.active] ?? { meals: 0, lastFed: null };
  const next = placeAccessory(pet, accessoryId, x, y);
  savePetCollection(kid, { ...c, pets: { ...c.pets, [c.active]: next } });
  return next;
}

/** La caja sorpresa: spend, draw, apply. null if unaffordable. */
export function openSurprise(
  kid: KidId,
): { result: SurpriseResult; stars: number } | null {
  const owned = getOwnedAccessories(kid);
  const stars = spendStars(kid, SURPRISE_COST);
  if (stars === null) {
    return null;
  }
  const result = drawSurprise(Math.random, owned);
  if (result.type === "accessory") {
    saveOwnedAccessories(kid, buyAccessory(owned, result.id));
    const c = getPetCollection(kid);
    const pet = wear(c.pets[c.active] ?? { meals: 0, lastFed: null }, result.id);
    savePetCollection(kid, { ...c, pets: { ...c.pets, [c.active]: pet } });
    return { result, stars };
  }
  if (result.type === "freeze") {
    setFreezes(kid, getFreezes(kid) + 1);
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

// ---- category completion (whole-album-section chests) ----

/** The completion tier of one album section for a kid, from its earnable
 *  slots' counts. A slot earned before the tier system (in the album but with
 *  no count) reads as one completion, matching the album's own tier display. */
export function getCategoryTier(
  kid: KidId,
  deckId: string,
  activities: readonly ActivityId[],
  earned: ReadonlySet<string>,
): StickerTier {
  const counts = getStickerCounts();
  const slots = activitiesForKid(activities, kid).map((activity) => {
    const id = stickerId(kid, deckId, activity);
    return counts[id] ?? (earned.has(id) ? 1 : 0);
  });
  return categoryTier(slots);
}

/** The highest category tier this kid has already been paid out for. */
export function getClaimedCategoryTier(kid: KidId, deckId: string): StickerTier {
  return getCategoryAwards(kid)[deckId] ?? "none";
}

/** The whole per-kid ledger (deck → highest claimed tier) — for sync. */
export function getCategoryAwards(kid: KidId): Readonly<Record<string, StickerTier>> {
  return readDoc<Record<string, StickerTier>>(CATEGORY_AWARDS_KEY)[kid] ?? {};
}

export function saveCategoryAwards(
  kid: KidId,
  awards: Readonly<Record<string, StickerTier>>,
): void {
  writeDoc(CATEGORY_AWARDS_KEY, kid, awards);
}

/** Bank the chest for reaching `tier` in a category, once. Returns the star
 *  bonus paid, or null if that tier (or higher) was already claimed. */
export function claimCategoryReward(
  kid: KidId,
  deckId: string,
  tier: StickerTier,
): number | null {
  const claimed = getClaimedCategoryTier(kid, deckId);
  if (pendingCategoryTier(tier, claimed) === null) {
    return null;
  }
  const record = getCategoryAwards(kid);
  saveCategoryAwards(kid, { ...record, [deckId]: tier });
  const bonus = categoryReward(tier);
  addStars(kid, bonus);
  return bonus;
}

// ---- owned avatars (bought with stars) ----

export function getOwnedAvatars(kid: KidId): readonly string[] {
  const value = readDoc<readonly string[]>(OWNED_AVATARS_KEY)[kid];
  return Array.isArray(value) ? value.filter((e) => typeof e === "string") : [];
}

export function saveOwnedAvatars(kid: KidId, owned: readonly string[]): void {
  writeDoc(OWNED_AVATARS_KEY, kid, owned);
}

// ---- secret deck unlocks (bought with stars) ----

export function getUnlockedDecks(kid: KidId): readonly string[] {
  const value = readDoc<readonly string[]>(UNLOCKS_KEY)[kid];
  return Array.isArray(value) ? value.filter((d) => typeof d === "string") : [];
}

export function saveUnlockedDecks(kid: KidId, decks: readonly string[]): void {
  writeDoc(UNLOCKS_KEY, kid, decks);
}

export function isDeckUnlocked(kid: KidId, deckId: string): boolean {
  return getUnlockedDecks(kid).includes(deckId);
}

/** Unlock a secret deck; returns the new balance, or null if unaffordable. */
export function unlockDeck(
  kid: KidId,
  deckId: string,
  cost: number,
): number | null {
  const owned = getUnlockedDecks(kid);
  if (owned.includes(deckId)) {
    return null;
  }
  const stars = spendStars(kid, cost);
  if (stars === null) {
    return null;
  }
  writeDoc(UNLOCKS_KEY, kid, [...owned, deckId]);
  return stars;
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

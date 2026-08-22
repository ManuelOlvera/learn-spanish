"use client";

/**
 * Thin client facade over the economy use cases in `@learn-spanish/core` —
 * call-site-friendly functions that pass the clock in and delegate. Every
 * rule (spend ordering, purchase idempotence, claim-once, the misión→weekly
 * cascade) lives in core under test; storage lives in economy-store.ts; the
 * wiring lives in client-container.ts. Nothing in this file may branch on
 * business state.
 */
import {
  boostRemaining,
  canClaimDailyGift as coreCanClaimDailyGift,
  categoryTierFromAlbum,
  dayKey,
  defaultCollection,
  freezesOrStarting,
  walletBalance,
  type ActivityId,
  type Boost,
  type DailyGift,
  type KidId,
  type MissionKind,
  type MissionState,
  type MissionView,
  type PetCollection,
  type PetState,
  type StickerTier,
  type SurpriseResult,
  type Wallet,
  type WeeklyView,
  type WeekProgress,
  type WeeklyStreak,
  claimChallenge,
  recordChallengeActivity,
  setChallenge,
  CHALLENGE_BONUS,
  type ParentChallenge,
} from "@learn-spanish/core";
import * as container from "./client-container";

export type { MissionView, WeeklyView };

const store = container.economyStore;

// ---- stars ----

/** The spendable balance — derived from the counter wallet (ADR 008). */
export function getStars(kid: KidId): number {
  return walletBalance(store.loadWallet(kid));
}

/** The raw counters, for the snapshot. `getStars` is the view kids see. */
export function getWallet(kid: KidId): Wallet {
  return store.loadWallet(kid);
}

export function addStars(kid: KidId, amount: number): number {
  return container.earnStars.execute(kid, amount);
}

/** Returns the new balance, or null if the kid cannot afford it. */
export function spendStars(kid: KidId, amount: number): number | null {
  return container.spendStars.execute(kid, amount);
}

/** Write a merged wallet outright (sync-merge apply path only — never a spend:
 *  spending goes through the use case so the balance check happens first). */
export function setWallet(kid: KidId, wallet: Wallet): void {
  store.saveWallet(kid, wallet);
}

// ---- daily mission ----

export function getMission(kid: KidId): MissionView {
  return container.getMission.execute(kid, new Date());
}

/** The raw stored mission state (any day), for sync. `getMission` is the
 *  today-scoped view; this is the untouched record the snapshot carries. */
export function getStoredMission(kid: KidId): MissionState | null {
  return store.loadMission(kid);
}

export function saveStoredMission(kid: KidId, state: MissionState): void {
  store.saveMission(kid, state);
}

export function markActivityDone(kid: KidId, kind: MissionKind): MissionView {
  return container.markActivityDone.execute(kid, kind, new Date());
}

/** The +10⭐ bonus chest; a no-op if already claimed or incomplete. */
export function claimMissionBonus(kid: KidId): number | null {
  return container.claimMissionBonus.execute(kid, new Date());
}

// ---- weekly streak & freezes ----

/** Freezes default to STARTING_FREEZES for a kid who has never had the key
 *  (so every profile starts with three); a stored 0 stays 0. */
export function getFreezes(kid: KidId): number {
  return freezesOrStarting(store.loadFreezes(kid));
}

/** Read the weekly streak, rolling finished weeks over first. Call on app open. */
export function rolloverWeekly(kid: KidId): WeeklyView {
  return container.rolloverWeekly.execute(kid, new Date());
}

/** Buy one freeze for FREEZE_COST⭐. null when the kid can't afford it. */
export function buyFreeze(
  kid: KidId,
): { freezes: number; stars: number } | null {
  return container.buyFreeze.execute(kid);
}

/** Read the weekly streak without rolling over (parent report, InformeView). */
export function getWeeklyCount(kid: KidId): number {
  return store.loadWeekly(kid)?.count ?? 0;
}

// ---- sync accessors (ADR 004): expose freeze/weekly state to the snapshot ----

/** The full weekly-streak record for a kid, or null if never played. */
export function getWeeklyStreak(kid: KidId): WeeklyStreak | null {
  return store.loadWeekly(kid);
}

export function saveWeeklyStreak(kid: KidId, streak: WeeklyStreak): void {
  store.saveWeekly(kid, streak);
}

/** The in-progress week's active days for a kid, or null if none. */
export function getWeekProgressDoc(kid: KidId): WeekProgress | null {
  return store.loadWeekProgress(kid);
}

export function saveWeekProgress(kid: KidId, progress: WeekProgress): void {
  store.saveWeekProgress(kid, progress);
}

/** Set a kid's freeze count (used when a sync merge resolves freezes). */
export function setFreezesCount(kid: KidId, count: number): void {
  store.saveFreezes(kid, count);
}

// ---- mascota (a collection of adopted pets) ----

export function getPetCollection(kid: KidId): PetCollection {
  return store.loadPetCollection(kid) ?? defaultCollection();
}

export function savePetCollection(kid: KidId, collection: PetCollection): void {
  store.savePetCollection(kid, collection);
}

export function getActivePet(kid: KidId): PetState {
  const c = getPetCollection(kid);
  return c.pets[c.active] ?? { meals: 0, lastFed: null };
}

/** Feed the active pet; spends MEAL_COST, null if unaffordable. */
export function feedActivePet(
  kid: KidId,
): { pet: PetState; stars: number } | null {
  return container.feedPet.execute(kid, new Date());
}

/** Adopt a new species (a fresh egg) at its catalog price and make it active;
 *  null if unknown, already owned, or unaffordable. */
export function adoptSpecies(
  kid: KidId,
  speciesId: string,
): { collection: PetCollection; stars: number } | null {
  return container.adoptSpecies.execute(kid, speciesId);
}

export function setActiveSpecies(kid: KidId, speciesId: string): void {
  container.setActiveSpecies.execute(kid, speciesId);
}

/** Pin which growth form the active pet displays (non-destructive: meals and
 *  growth are unchanged, only the shown look). */
export function setPetForm(kid: KidId, form: number): void {
  const c = getPetCollection(kid);
  const pet = c.pets[c.active] ?? { meals: 0, lastFed: null };
  store.savePetCollection(kid, {
    ...c,
    pets: { ...c.pets, [c.active]: { ...pet, form } },
  });
}

/** Wardrobe accessories the kid owns (bought once, wearable on any pet). */
export function getOwnedAccessories(kid: KidId): readonly string[] {
  return store.loadOwnedAccessories(kid);
}

export function saveOwnedAccessories(
  kid: KidId,
  owned: readonly string[],
): void {
  store.saveOwnedAccessories(kid, owned);
}

/** Buy a wardrobe accessory at its catalog price (kid-level) and put it on
 *  the active pet. null if unknown, unaffordable, or already owned. */
export function buyAccessoryForActive(
  kid: KidId,
  accessoryId: string,
): { owned: readonly string[]; stars: number } | null {
  return container.buyAccessory.execute(kid, accessoryId);
}

/** Put on / take off an owned accessory on the active pet. Free — owning is
 *  permanent, only that pet's outfit changes. null if the kid doesn't own it. */
export function toggleAccessoryForActive(
  kid: KidId,
  accessoryId: string,
): PetState | null {
  return container.toggleAccessory.execute(kid, accessoryId);
}

/** Save where the kid dragged an accessory on the active pet (percent coords). */
export function placeAccessoryOnActive(
  kid: KidId,
  accessoryId: string,
  x: number,
  y: number,
): PetState {
  return container.placeAccessory.execute(kid, accessoryId, x, y);
}

/** Name (or rename) the active pet — free. Returns the updated collection. */
export function nameActivePet(kid: KidId, name: string): PetCollection {
  return container.namePet.execute(kid, name);
}

/** La caja sorpresa: spend, draw, apply. null if unaffordable. */
export function openSurprise(
  kid: KidId,
): { result: SurpriseResult; stars: number } | null {
  return container.openSurprise.execute(kid, new Date());
}

// ---- ⚡ la hora doble (a timed chest multiplier) ----

/** The boost window paying right now, or null. Read fresh at every call site:
 *  it expires on the clock, so a cached value goes stale on its own. */
export function getActiveBoost(kid: KidId): Boost | null {
  return container.getBoost.execute(kid, new Date());
}

/** How full the current window is, 0–1 — what the home badge's bar draws. */
export function getBoostRemaining(kid: KidId): number {
  return boostRemaining(store.loadBoost(kid), new Date());
}

// ---- el regalo del día (free daily gift) ----

/** Whether today's free gift is still waiting to be opened. */
export function canClaimDailyGift(kid: KidId): boolean {
  return coreCanClaimDailyGift(store.loadDailyGiftDay(kid), dayKey(new Date()));
}

/** Open today's gift. null when it was already claimed today. */
export function claimDailyGift(
  kid: KidId,
): { gift: DailyGift; stars: number } | null {
  return container.claimDailyGift.execute(kid, new Date());
}

// ---- sticker completion counts (tiers) ----

export function getStickerCounts(): Readonly<Record<string, number>> {
  return store.loadStickerCounts();
}

export function saveStickerCounts(
  counts: Readonly<Record<string, number>>,
): void {
  store.saveStickerCounts(counts);
}

// ---- category completion (whole-album-section chests) ----

/** The completion tier of one album section for a kid (see core's
 *  categoryTierFromAlbum for the counting rule). */
export function getCategoryTier(
  kid: KidId,
  deckId: string,
  activities: readonly ActivityId[],
  earned: ReadonlySet<string>,
): StickerTier {
  return categoryTierFromAlbum(
    kid,
    deckId,
    activities,
    store.loadStickerCounts(),
    earned,
  );
}

/** The highest category tier this kid has already been paid out for. */
export function getClaimedCategoryTier(kid: KidId, deckId: string): StickerTier {
  return store.loadCategoryAwards(kid)[deckId] ?? "none";
}

/** The whole per-kid ledger (deck → highest claimed tier) — for sync. */
export function getCategoryAwards(
  kid: KidId,
): Readonly<Record<string, StickerTier>> {
  return store.loadCategoryAwards(kid);
}

export function saveCategoryAwards(
  kid: KidId,
  awards: Readonly<Record<string, StickerTier>>,
): void {
  store.saveCategoryAwards(kid, awards);
}

/** Bank the chest for reaching `tier` in a category, once. Returns the star
 *  bonus paid, or null if that tier (or higher) was already claimed. */
export function claimCategoryReward(
  kid: KidId,
  deckId: string,
  tier: StickerTier,
): number | null {
  return container.claimCategoryReward.execute(kid, deckId, tier);
}

// ---- owned avatars (bought with stars) ----

export function getOwnedAvatars(kid: KidId): readonly string[] {
  return store.loadOwnedAvatars(kid);
}

export function saveOwnedAvatars(kid: KidId, owned: readonly string[]): void {
  store.saveOwnedAvatars(kid, owned);
}

/** Buy an avatar at its catalog price; returns the new balance, or null if
 *  not purchasable (free starter, unknown, owned) or unaffordable. */
export function buyAvatar(kid: KidId, emoji: string): number | null {
  return container.buyAvatar.execute(kid, emoji);
}

// ---- secret deck unlocks (bought with stars) ----

export function getUnlockedDecks(kid: KidId): readonly string[] {
  return store.loadUnlockedDecks(kid);
}

export function saveUnlockedDecks(kid: KidId, decks: readonly string[]): void {
  store.saveUnlockedDecks(kid, decks);
}

export function isDeckUnlocked(kid: KidId, deckId: string): boolean {
  return store.loadUnlockedDecks(kid).includes(deckId);
}

/** Unlock a secret deck; returns the new balance, or null if unaffordable. */
export function unlockDeck(
  kid: KidId,
  deckId: string,
  cost: number,
): number | null {
  return container.unlockDeck.execute(kid, deckId, cost);
}

// ---- reto best scores ----

export function getRetoBest(kid: KidId, deckId: string): number {
  const value = store.loadRetoBest(kid)[deckId];
  return typeof value === "number" && value >= 0 ? value : 0;
}

/** Returns true when the score sets a new record (and saves it). */
// ---- el reto de papá ----

export function getChallenge(kid: KidId): ParentChallenge | null {
  return store.loadChallenge(kid);
}

/** Set (or replace) a kid's challenge from the report. */
export function setKidChallenge(kid: KidId, deckId: string): ParentChallenge {
  const challenge = setChallenge(deckId);
  store.saveChallenge(kid, challenge);
  return challenge;
}

export function clearKidChallenge(kid: KidId): void {
  store.saveChallenge(kid, null);
}

/** Fold a finished activity in; returns true when it just completed. */
export function noteChallengeActivity(kid: KidId, deckId: string): boolean {
  const before = store.loadChallenge(kid);
  const after = recordChallengeActivity(before, deckId);
  if (after !== before && after !== null) {
    store.saveChallenge(kid, after);
    return after.done && !(before?.done ?? false);
  }
  return false;
}

/** Bank the challenge bonus; returns the new star balance, or null if there
 *  was nothing to claim. */
export function claimChallengeBonus(kid: KidId): number | null {
  const claimed = claimChallenge(store.loadChallenge(kid));
  if (claimed === null) {
    return null;
  }
  // Paid means over: clear it rather than leaving a finished challenge on the
  // home screen forever. The parent sets the next one when they want one.
  store.saveChallenge(kid, null);
  return addStars(kid, CHALLENGE_BONUS);
}

/** Every deck's record for a kid — the sync snapshot carries the whole map. */
export function getRetoBests(kid: KidId): Readonly<Record<string, number>> {
  return store.loadRetoBest(kid);
}

/** Set a kid's whole record map (used when a sync merge resolves records). */
export function saveRetoBests(
  kid: KidId,
  bests: Readonly<Record<string, number>>,
): void {
  store.saveRetoBest(kid, bests);
}

export function saveRetoBest(kid: KidId, deckId: string, score: number): boolean {
  return container.saveRetoBest.execute(kid, deckId, score);
}

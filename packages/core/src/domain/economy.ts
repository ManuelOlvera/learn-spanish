import type { KidId } from "./kid";
import type { MissionState } from "./mission";
import type { PetCollection } from "./mascota";
import type { Wallet } from "./stars";
import type { StickerTier } from "./sticker-tiers";
import type { WeekProgress, WeeklyStreak } from "./weekly";

/**
 * Port over the per-kid economy documents (stars, misión, weekly streak,
 * mascota, wardrobe, unlocks…). The web app backs it with localStorage —
 * a synchronous medium — so the port is deliberately synchronous: async here
 * would force promise plumbing through every click handler for nothing.
 *
 * All the *rules* over this state (spend ordering, purchase idempotence,
 * claim-once, the misión→weekly cascade) live in the economy use cases in
 * `application/` — an adapter implements storage, nothing else.
 */
export interface EconomyStore {
  /** The counter wallet (see domain/stars.ts Wallet); balance is derived. */
  loadWallet(kid: KidId): Wallet;
  saveWallet(kid: KidId, wallet: Wallet): void;

  /** Null when the kid has never had the key — see freezesOrStarting. */
  loadFreezes(kid: KidId): number | null;
  saveFreezes(kid: KidId, count: number): void;

  loadMission(kid: KidId): MissionState | null;
  saveMission(kid: KidId, state: MissionState): void;

  loadWeekly(kid: KidId): WeeklyStreak | null;
  saveWeekly(kid: KidId, streak: WeeklyStreak): void;

  loadWeekProgress(kid: KidId): WeekProgress | null;
  saveWeekProgress(kid: KidId, progress: WeekProgress): void;

  /** Null when the kid has never adopted — callers fall back to defaultCollection(). */
  loadPetCollection(kid: KidId): PetCollection | null;
  savePetCollection(kid: KidId, collection: PetCollection): void;

  loadOwnedAccessories(kid: KidId): readonly string[];
  saveOwnedAccessories(kid: KidId, owned: readonly string[]): void;

  loadOwnedAvatars(kid: KidId): readonly string[];
  saveOwnedAvatars(kid: KidId, owned: readonly string[]): void;

  loadUnlockedDecks(kid: KidId): readonly string[];
  saveUnlockedDecks(kid: KidId, decks: readonly string[]): void;

  /** Sticker completion counts are album-wide (ids already carry the kid). */
  loadStickerCounts(): Readonly<Record<string, number>>;
  saveStickerCounts(counts: Readonly<Record<string, number>>): void;

  /** Deck → highest completion tier already paid out, per kid. */
  loadCategoryAwards(kid: KidId): Readonly<Record<string, StickerTier>>;
  saveCategoryAwards(
    kid: KidId,
    awards: Readonly<Record<string, StickerTier>>,
  ): void;

  /** Deck → best reto score, per kid. */
  loadRetoBest(kid: KidId): Readonly<Record<string, number>>;
  saveRetoBest(kid: KidId, best: Readonly<Record<string, number>>): void;
}

"use client";

import {
  EMPTY_WALLET,
  isCategoryAwards,
  isMissionState,
  isPetCollection,
  isWeekProgress,
  isWeeklyStreak,
  type EconomyStore,
  type KidId,
  type MissionState,
  type PetCollection,
  type StickerTier,
  type Wallet,
  type WeekProgress,
  type WeeklyStreak,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { runStorageMigrations } from "./storage-migrations";

/**
 * localStorage adapter for the EconomyStore port — one JSON document per
 * concern, per-kid keyed, all failure-tolerant. Storage only: every rule
 * (spend ordering, idempotence, cascades) lives in core's economy use cases.
 */

const WALLET_KEY = "palabras.wallet.v1"; // earned/spent counters (stars.v1 is the legacy balance)
const MISSION_KEY = "palabras.mission.v1";
const PETS_KEY = "palabras.pets.v2";
const COUNTS_KEY = "palabras.sticker-counts.v1";
const OWNED_AVATARS_KEY = "palabras.owned-avatars.v1";
const OWNED_ACCESSORIES_KEY = "palabras.owned-accessories.v1";
const UNLOCKS_KEY = "palabras.unlocks.v1";
const WEEKLY_KEY = "palabras.weekly.v1";
const WEEK_PROGRESS_KEY = "palabras.week-progress.v1";
const FREEZES_KEY = "palabras.freezes.v1";
const CATEGORY_AWARDS_KEY = "palabras.category-awards.v1";
const RETO_KEY = "palabras.reto.v1";
const DAILY_GIFT_KEY = "palabras.daily-gift.v1"; // dayKey of the last claim; not synced

/** Schema migrations run once, on the first storage access of a session —
 *  after this, every reader can assume the current key layout. */
let migrated = false;
function ensureMigrated(): void {
  if (!migrated) {
    migrated = true;
    try {
      runStorageMigrations();
    } catch (err) {
      log.warn("economy", "storage migrations failed", { err });
    }
  }
}

/** Shared by the other per-kid localStorage adapters (trend-store) so every
 *  kid-doc read passes the same failure handling and the migration gate. */
export function readDoc<T>(key: string): Partial<Record<KidId, T>> {
  ensureMigrated();
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

export function writeDoc<T>(key: string, kid: KidId, value: T): void {
  try {
    const all = readDoc<T>(key);
    all[kid] = value;
    window.localStorage.setItem(key, JSON.stringify(all));
  } catch (err) {
    log.warn("economy", `could not persist ${key}`, { err });
  }
}

function stringList(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((e): e is string => typeof e === "string")
    : [];
}

export class LocalStorageEconomyStore implements EconomyStore {
  loadWallet(kid: KidId): Wallet {
    const value = readDoc<Wallet>(WALLET_KEY)[kid];
    return typeof value === "object" &&
      value !== null &&
      typeof value.earned === "number" &&
      value.earned >= 0 &&
      typeof value.spent === "number" &&
      value.spent >= 0
      ? value
      : EMPTY_WALLET;
  }
  saveWallet(kid: KidId, wallet: Wallet): void {
    writeDoc(WALLET_KEY, kid, wallet);
  }

  loadFreezes(kid: KidId): number | null {
    const value = readDoc<number>(FREEZES_KEY)[kid];
    return typeof value === "number" && value >= 0 ? value : null;
  }
  saveFreezes(kid: KidId, count: number): void {
    writeDoc(FREEZES_KEY, kid, Math.max(0, count));
  }

  // Reads validate with the same core guards the sync sanitizer uses — a
  // corrupt document reads as absent instead of surfacing later as a shape
  // surprise deep in a use case.

  loadMission(kid: KidId): MissionState | null {
    const stored: unknown = readDoc<MissionState>(MISSION_KEY)[kid];
    return isMissionState(stored) ? stored : null;
  }
  saveMission(kid: KidId, state: MissionState): void {
    writeDoc(MISSION_KEY, kid, state);
  }

  loadWeekly(kid: KidId): WeeklyStreak | null {
    const stored: unknown = readDoc<WeeklyStreak>(WEEKLY_KEY)[kid];
    return isWeeklyStreak(stored) ? stored : null;
  }
  saveWeekly(kid: KidId, streak: WeeklyStreak): void {
    writeDoc(WEEKLY_KEY, kid, streak);
  }

  loadWeekProgress(kid: KidId): WeekProgress | null {
    const stored: unknown = readDoc<WeekProgress>(WEEK_PROGRESS_KEY)[kid];
    return isWeekProgress(stored) ? stored : null;
  }
  saveWeekProgress(kid: KidId, progress: WeekProgress): void {
    writeDoc(WEEK_PROGRESS_KEY, kid, progress);
  }

  loadPetCollection(kid: KidId): PetCollection | null {
    const stored: unknown = readDoc<PetCollection>(PETS_KEY)[kid];
    return isPetCollection(stored) ? stored : null;
  }
  savePetCollection(kid: KidId, collection: PetCollection): void {
    writeDoc(PETS_KEY, kid, collection);
  }

  loadOwnedAccessories(kid: KidId): readonly string[] {
    return stringList(readDoc<readonly string[]>(OWNED_ACCESSORIES_KEY)[kid]);
  }
  saveOwnedAccessories(kid: KidId, owned: readonly string[]): void {
    writeDoc(OWNED_ACCESSORIES_KEY, kid, owned);
  }

  loadOwnedAvatars(kid: KidId): readonly string[] {
    return stringList(readDoc<readonly string[]>(OWNED_AVATARS_KEY)[kid]);
  }
  saveOwnedAvatars(kid: KidId, owned: readonly string[]): void {
    writeDoc(OWNED_AVATARS_KEY, kid, owned);
  }

  loadUnlockedDecks(kid: KidId): readonly string[] {
    return stringList(readDoc<readonly string[]>(UNLOCKS_KEY)[kid]);
  }
  saveUnlockedDecks(kid: KidId, decks: readonly string[]): void {
    writeDoc(UNLOCKS_KEY, kid, decks);
  }

  loadStickerCounts(): Readonly<Record<string, number>> {
    ensureMigrated();
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
  saveStickerCounts(counts: Readonly<Record<string, number>>): void {
    try {
      window.localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
    } catch (err) {
      log.warn("economy", "could not persist sticker counts", { err });
    }
  }

  loadCategoryAwards(kid: KidId): Readonly<Record<string, StickerTier>> {
    const stored: unknown = readDoc<Record<string, StickerTier>>(
      CATEGORY_AWARDS_KEY,
    )[kid];
    return isCategoryAwards(stored) ? stored : {};
  }
  saveCategoryAwards(
    kid: KidId,
    awards: Readonly<Record<string, StickerTier>>,
  ): void {
    writeDoc(CATEGORY_AWARDS_KEY, kid, awards);
  }

  loadRetoBest(kid: KidId): Readonly<Record<string, number>> {
    const stored = readDoc<Record<string, number>>(RETO_KEY)[kid];
    if (typeof stored !== "object" || stored === null) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(stored).filter(
        ([, score]) => typeof score === "number" && score >= 0,
      ),
    );
  }
  saveRetoBest(kid: KidId, best: Readonly<Record<string, number>>): void {
    writeDoc(RETO_KEY, kid, best);
  }

  loadDailyGiftDay(kid: KidId): string | null {
    const value = readDoc<string>(DAILY_GIFT_KEY)[kid];
    return typeof value === "string" && value !== "" ? value : null;
  }
  saveDailyGiftDay(kid: KidId, day: string): void {
    writeDoc(DAILY_GIFT_KEY, kid, day);
  }
}

/** Port adapter for the tier-aware award use case (shares the counts doc). */
export class LocalStorageStickerCountsStore {
  constructor(private readonly economy: LocalStorageEconomyStore) {}

  load(): Promise<Readonly<Record<string, number>>> {
    return Promise.resolve(this.economy.loadStickerCounts());
  }
  save(counts: Readonly<Record<string, number>>): Promise<void> {
    this.economy.saveStickerCounts(counts);
    return Promise.resolve();
  }
}

"use client";

import {
  ALL_KIDS,
  decodeProgress,
  encodeProgress,
  mergeProgress,
  type PetCollection,
  type ProgressSnapshot,
  type Streak,
  type WeeklyStreak,
  type WeekProgress,
  type WordStats,
} from "@learn-spanish/core";
import type { KidId } from "@learn-spanish/core";
import type { PetState } from "@learn-spanish/core";
import { LocalStorageAlbumStore } from "./album-store";
import { LocalStorageStreakStore } from "./streak-store";
import { LocalStorageWordStatsStore } from "./word-stats-store";
import { getAvatars, setAvatar } from "./kid";
import {
  getActivePet,
  getFreezes,
  getOwnedAccessories,
  getOwnedAvatars,
  getPetCollection,
  getStars,
  getStickerCounts,
  getUnlockedDecks,
  getWeeklyStreak,
  getWeekProgressDoc,
  saveOwnedAccessories,
  saveOwnedAvatars,
  savePetCollection,
  saveStickerCounts,
  saveUnlockedDecks,
  saveWeeklyStreak,
  saveWeekProgress,
  setFreezesCount,
  setStars,
} from "./economy";

const albumStore = new LocalStorageAlbumStore();
const streakStore = new LocalStorageStreakStore();
const wordStatsStore = new LocalStorageWordStatsStore();

/** Build a ProgressSnapshot of everything on this device worth syncing. Shared
 *  by the transfer-code export and the cross-device sync (ADR 004). */
export async function currentSnapshot(): Promise<ProgressSnapshot> {
  const stickers = await albumStore.load();
  const streaks: Partial<Record<KidId, Streak>> = {};
  const stats: Partial<Record<KidId, WordStats>> = {};
  const stars: Partial<Record<KidId, number>> = {};
  const pets: Partial<Record<KidId, PetState>> = {};
  const petCollections: Partial<Record<KidId, PetCollection>> = {};
  const ownedAvatars: Partial<Record<KidId, readonly string[]>> = {};
  const ownedAccessories: Partial<Record<KidId, readonly string[]>> = {};
  const unlockedDecks: Partial<Record<KidId, readonly string[]>> = {};
  const freezes: Partial<Record<KidId, number>> = {};
  const weekly: Partial<Record<KidId, WeeklyStreak>> = {};
  const weekProgress: Partial<Record<KidId, WeekProgress>> = {};
  for (const kid of ALL_KIDS) {
    const streak = await streakStore.load(kid);
    if (streak !== null) {
      streaks[kid] = streak;
    }
    const kidStats = await wordStatsStore.load(kid);
    if (Object.keys(kidStats).length > 0) {
      stats[kid] = kidStats;
    }
    stars[kid] = getStars(kid);
    // `pets` (active pet) stays for compat; `petCollections` is authoritative.
    pets[kid] = getActivePet(kid);
    petCollections[kid] = getPetCollection(kid);
    freezes[kid] = getFreezes(kid);
    const kidWeekly = getWeeklyStreak(kid);
    if (kidWeekly !== null) {
      weekly[kid] = kidWeekly;
    }
    const kidWeekProgress = getWeekProgressDoc(kid);
    if (kidWeekProgress !== null) {
      weekProgress[kid] = kidWeekProgress;
    }
    const owned = getOwnedAvatars(kid);
    if (owned.length > 0) {
      ownedAvatars[kid] = owned;
    }
    const accessories = getOwnedAccessories(kid);
    if (accessories.length > 0) {
      ownedAccessories[kid] = accessories;
    }
    const unlocked = getUnlockedDecks(kid);
    if (unlocked.length > 0) {
      unlockedDecks[kid] = unlocked;
    }
  }
  return {
    stickers,
    streaks,
    avatars: getAvatars(),
    stats,
    stars,
    stickerCounts: getStickerCounts(),
    pets,
    petCollections,
    freezes,
    ...(Object.keys(weekly).length > 0 ? { weekly } : {}),
    ...(Object.keys(weekProgress).length > 0 ? { weekProgress } : {}),
    ...(Object.keys(ownedAvatars).length > 0 ? { ownedAvatars } : {}),
    ...(Object.keys(ownedAccessories).length > 0 ? { ownedAccessories } : {}),
    ...(Object.keys(unlockedDecks).length > 0 ? { unlockedDecks } : {}),
  };
}

/** The copy-able one-time code for this device's progress (ADR 002: no backend). */
export async function exportProgressCode(): Promise<string> {
  return encodeProgress(await currentSnapshot());
}

export interface ImportOutcome {
  readonly newStickers: number;
}

/** Write a (already-merged) snapshot into this device's stores. Shared by the
 *  transfer-code import and cross-device sync (ADR 004). */
export async function applySnapshot(merged: ProgressSnapshot): Promise<void> {
  await albumStore.save(merged.stickers);
  for (const kid of ALL_KIDS) {
    const streak = merged.streaks[kid];
    if (streak !== undefined) {
      await streakStore.save(kid, streak);
    }
    const avatar = merged.avatars[kid];
    if (avatar !== undefined) {
      setAvatar(kid, avatar);
    }
    const kidStats = merged.stats?.[kid];
    if (kidStats !== undefined) {
      await wordStatsStore.save(kid, kidStats);
    }
    const kidStars = merged.stars?.[kid];
    if (kidStars !== undefined) {
      setStars(kid, kidStars);
    }
    const kidCollection = merged.petCollections?.[kid];
    if (kidCollection !== undefined) {
      savePetCollection(kid, kidCollection);
    }
    const kidAvatars = merged.ownedAvatars?.[kid];
    if (kidAvatars !== undefined) {
      saveOwnedAvatars(kid, kidAvatars);
    }
    const kidAccessories = merged.ownedAccessories?.[kid];
    if (kidAccessories !== undefined) {
      saveOwnedAccessories(kid, kidAccessories);
    }
    const kidUnlocks = merged.unlockedDecks?.[kid];
    if (kidUnlocks !== undefined) {
      saveUnlockedDecks(kid, kidUnlocks);
    }
    const kidFreezes = merged.freezes?.[kid];
    if (kidFreezes !== undefined) {
      setFreezesCount(kid, kidFreezes);
    }
    const kidWeekly = merged.weekly?.[kid];
    if (kidWeekly !== undefined) {
      saveWeeklyStreak(kid, kidWeekly);
    }
    const kidWeekProgress = merged.weekProgress?.[kid];
    if (kidWeekProgress !== undefined) {
      saveWeekProgress(kid, kidWeekProgress);
    }
  }
  if (merged.stickerCounts !== undefined) {
    saveStickerCounts(merged.stickerCounts);
  }
}

/** Decode + merge a code into this device. Throws InvalidTransferCodeError. */
export async function importProgressCode(code: string): Promise<ImportOutcome> {
  const incoming = decodeProgress(code);
  const current = await currentSnapshot();
  const merged = mergeProgress(current, incoming);
  await applySnapshot(merged);
  return { newStickers: merged.stickers.length - current.stickers.length };
}

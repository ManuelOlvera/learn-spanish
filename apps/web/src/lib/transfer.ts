"use client";

import {
  ALL_KIDS,
  decodeProgress,
  encodeProgress,
  mergeProgress,
  type PetCollection,
  type ProgressSnapshot,
  type Streak,
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
  getOwnedAvatars,
  getPetCollection,
  getStars,
  getStickerCounts,
  saveOwnedAvatars,
  savePetCollection,
  saveStickerCounts,
  setStars,
} from "./economy";

const albumStore = new LocalStorageAlbumStore();
const streakStore = new LocalStorageStreakStore();
const wordStatsStore = new LocalStorageWordStatsStore();

async function currentSnapshot(): Promise<ProgressSnapshot> {
  const stickers = await albumStore.load();
  const streaks: Partial<Record<KidId, Streak>> = {};
  const stats: Partial<Record<KidId, WordStats>> = {};
  const stars: Partial<Record<KidId, number>> = {};
  const pets: Partial<Record<KidId, PetState>> = {};
  const petCollections: Partial<Record<KidId, PetCollection>> = {};
  const ownedAvatars: Partial<Record<KidId, readonly string[]>> = {};
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
    const owned = getOwnedAvatars(kid);
    if (owned.length > 0) {
      ownedAvatars[kid] = owned;
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
    ...(Object.keys(ownedAvatars).length > 0 ? { ownedAvatars } : {}),
  };
}

/** The copy-able one-time code for this device's progress (ADR 002: no backend). */
export async function exportProgressCode(): Promise<string> {
  return encodeProgress(await currentSnapshot());
}

export interface ImportOutcome {
  readonly newStickers: number;
}

/** Decode + merge a code into this device. Throws InvalidTransferCodeError. */
export async function importProgressCode(code: string): Promise<ImportOutcome> {
  const incoming = decodeProgress(code);
  const current = await currentSnapshot();
  const merged = mergeProgress(current, incoming);

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
  }
  if (merged.stickerCounts !== undefined) {
    saveStickerCounts(merged.stickerCounts);
  }

  return { newStickers: merged.stickers.length - current.stickers.length };
}

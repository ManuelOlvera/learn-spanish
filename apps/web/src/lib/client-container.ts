"use client";

import {
  AdoptSpeciesUseCase,
  AwardStickerUseCase,
  BuyAccessoryUseCase,
  BuyAvatarUseCase,
  BuyFreezeUseCase,
  ClaimCategoryRewardUseCase,
  ClaimDailyGiftUseCase,
  ClaimMissionBonusUseCase,
  EarnStarsUseCase,
  FeedPetUseCase,
  NamePetUseCase,
  FeedStreakUseCase,
  GetAlbumUseCase,
  GetMissionUseCase,
  GetStreakUseCase,
  GetWordStatsUseCase,
  MarkActivityDoneUseCase,
  OpenSurpriseUseCase,
  PlaceAccessoryUseCase,
  RecordAnswerUseCase,
  RolloverWeeklyUseCase,
  SampleTrendUseCase,
  SaveRetoBestUseCase,
  SetActiveSpeciesUseCase,
  SpendStarsUseCase,
  ToggleAccessoryUseCase,
  UnlockDeckUseCase,
} from "@learn-spanish/core";
import { LocalStorageAlbumStore } from "./album-store";
import { LocalStorageStreakStore } from "./streak-store";
import { LocalStorageWordStatsStore } from "./word-stats-store";
import {
  LocalStorageEconomyStore,
  LocalStorageStickerCountsStore,
} from "./economy-store";
import { LocalStorageTrendStore } from "./trend-store";
import { SupabaseProgressStore } from "./supabase-progress-store";

/**
 * The client-side composition root — the only place browser-storage adapters
 * meet use cases (container.ts is its server-safe counterpart for the static
 * deck/sentence repositories). Everything client-side takes its stores and
 * use cases from here; no other module may construct an adapter.
 */

// ---- stores (one instance each; constructors never touch window, so this
// module is safe to import during SSR of client components) ----

export const albumStore = new LocalStorageAlbumStore();
export const streakStore = new LocalStorageStreakStore();
export const wordStatsStore = new LocalStorageWordStatsStore();
export const economyStore = new LocalStorageEconomyStore();
const stickerCountsStore = new LocalStorageStickerCountsStore(economyStore);
const trendStore = new LocalStorageTrendStore();

/** Null when sync is not configured for this deployment (ADR 004). */
export const remoteProgress = SupabaseProgressStore.fromEnv();

// ---- album / streak / word-stats use cases ----

export const awardSticker = new AwardStickerUseCase(albumStore, stickerCountsStore);
export const getAlbum = new GetAlbumUseCase(albumStore);
export const feedStreak = new FeedStreakUseCase(streakStore);
export const getStreak = new GetStreakUseCase(streakStore);
export const getWordStats = new GetWordStatsUseCase(wordStatsStore);
export const recordAnswer = new RecordAnswerUseCase(wordStatsStore);
export const sampleTrend = new SampleTrendUseCase(trendStore, wordStatsStore);

// ---- economy use cases ----

export const earnStars = new EarnStarsUseCase(economyStore);
export const spendStars = new SpendStarsUseCase(economyStore);
export const getMission = new GetMissionUseCase(economyStore);
export const markActivityDone = new MarkActivityDoneUseCase(economyStore);
export const claimMissionBonus = new ClaimMissionBonusUseCase(economyStore);
export const rolloverWeekly = new RolloverWeeklyUseCase(economyStore);
export const buyFreeze = new BuyFreezeUseCase(economyStore);
export const feedPet = new FeedPetUseCase(economyStore);
export const namePet = new NamePetUseCase(economyStore);
export const claimDailyGift = new ClaimDailyGiftUseCase(economyStore, Math.random);
export const adoptSpecies = new AdoptSpeciesUseCase(economyStore);
export const setActiveSpecies = new SetActiveSpeciesUseCase(economyStore);
export const buyAccessory = new BuyAccessoryUseCase(economyStore);
export const toggleAccessory = new ToggleAccessoryUseCase(economyStore);
export const placeAccessory = new PlaceAccessoryUseCase(economyStore);
export const openSurprise = new OpenSurpriseUseCase(economyStore, Math.random);
export const buyAvatar = new BuyAvatarUseCase(economyStore);
export const unlockDeck = new UnlockDeckUseCase(economyStore);
export const claimCategoryReward = new ClaimCategoryRewardUseCase(economyStore);
export const saveRetoBest = new SaveRetoBestUseCase(economyStore);

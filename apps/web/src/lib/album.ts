"use client";

import {
  AwardStickerUseCase,
  FeedStreakUseCase,
  GetAlbumUseCase,
  GetStreakUseCase,
  GetWordStatsUseCase,
  RecordAnswerUseCase,
} from "@learn-spanish/core";
import { LocalStorageAlbumStore } from "./album-store";
import { LocalStorageStreakStore } from "./streak-store";
import { LocalStorageWordStatsStore } from "./word-stats-store";
import { LocalStorageStickerCountsStore } from "./economy";

/**
 * Client-side composition root: album and streaks live in browser storage,
 * so their use cases are wired here rather than in container.ts (which
 * server components also import).
 */
const albumStore = new LocalStorageAlbumStore();
const streakStore = new LocalStorageStreakStore();
const wordStatsStore = new LocalStorageWordStatsStore();

export const awardSticker = new AwardStickerUseCase(
  albumStore,
  new LocalStorageStickerCountsStore(),
);
export const getAlbum = new GetAlbumUseCase(albumStore);
export const feedStreak = new FeedStreakUseCase(streakStore);
export const getStreak = new GetStreakUseCase(streakStore);
export const getWordStats = new GetWordStatsUseCase(wordStatsStore);
export const recordAnswer = new RecordAnswerUseCase(wordStatsStore);

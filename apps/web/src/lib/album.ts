"use client";

import {
  AwardStickerUseCase,
  FeedStreakUseCase,
  GetAlbumUseCase,
  GetStreakUseCase,
} from "@learn-spanish/core";
import { LocalStorageAlbumStore } from "./album-store";
import { LocalStorageStreakStore } from "./streak-store";

/**
 * Client-side composition root: album and streaks live in browser storage,
 * so their use cases are wired here rather than in container.ts (which
 * server components also import).
 */
const albumStore = new LocalStorageAlbumStore();
const streakStore = new LocalStorageStreakStore();

export const awardSticker = new AwardStickerUseCase(albumStore);
export const getAlbum = new GetAlbumUseCase(albumStore);
export const feedStreak = new FeedStreakUseCase(streakStore);
export const getStreak = new GetStreakUseCase(streakStore);

"use client";

import { AwardStickerUseCase, GetAlbumUseCase } from "@learn-spanish/core";
import { LocalStorageAlbumStore } from "./album-store";

/**
 * Client-side composition root: the album lives in browser storage, so its
 * use cases are wired here rather than in container.ts (which server
 * components also import).
 */
const albumStore = new LocalStorageAlbumStore();

export const awardSticker = new AwardStickerUseCase(albumStore);
export const getAlbum = new GetAlbumUseCase(albumStore);

"use client";

import {
  salvageStickerIds,
  upgradeLegacyStickers,
  type AlbumStore,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";

const STORAGE_KEY = "palabras.album.v1";

/**
 * On-device album persistence. Storage failures (private browsing, full
 * quota) degrade to an empty album rather than breaking play.
 */
export class LocalStorageAlbumStore implements AlbumStore {
  load(): Promise<readonly string[]> {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return Promise.resolve([]);
      }
      const parsed: unknown = JSON.parse(raw);
      // Salvage per entry: one corrupt sticker must not cost the whole album
      // (a rejected array used to reset it to empty). Shared-era stickers
      // ("deck:activity") then become both kids' stickers.
      const salvaged = salvageStickerIds(parsed);
      if (!Array.isArray(parsed)) {
        log.warn("album", "discarding malformed album payload");
      } else if (salvaged.length < parsed.length) {
        log.warn("album", "dropped malformed album entries", {
          kept: salvaged.length,
          found: parsed.length,
        });
      }
      return Promise.resolve(upgradeLegacyStickers(salvaged));
    } catch (err) {
      log.warn("album", "album storage unreadable, starting empty", { err });
      return Promise.resolve([]);
    }
  }

  save(stickers: readonly string[]): Promise<void> {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stickers));
    } catch (err) {
      log.warn("album", "could not persist album", { err });
    }
    return Promise.resolve();
  }
}

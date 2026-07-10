"use client";

import type { AlbumStore } from "@learn-spanish/core";
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
      if (
        Array.isArray(parsed) &&
        parsed.every((entry) => typeof entry === "string")
      ) {
        return Promise.resolve(parsed);
      }
      log.warn("album", "discarding malformed album payload");
      return Promise.resolve([]);
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

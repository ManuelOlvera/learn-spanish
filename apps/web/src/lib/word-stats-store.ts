"use client";

import type { KidId, WordStat, WordStats, WordStatsStore } from "@learn-spanish/core";
import { log } from "@learn-spanish/config";

const STORAGE_KEY = "palabras.word-stats.v1";

type Stored = Partial<Record<KidId, Record<string, WordStat>>>;

function isWordStat(value: unknown): value is WordStat {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as WordStat).right === "number" &&
    typeof (value as WordStat).wrong === "number"
  );
}

/** On-device per-kid word tallies; unreadable storage means empty stats. */
export class LocalStorageWordStatsStore implements WordStatsStore {
  private read(): Stored {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return {};
      }
      const parsed: unknown = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Stored)
        : {};
    } catch (err) {
      log.warn("word-stats", "stats storage unreadable, starting empty", { err });
      return {};
    }
  }

  load(kid: KidId): Promise<WordStats> {
    const stored = this.read()[kid];
    if (typeof stored !== "object" || stored === null) {
      return Promise.resolve({});
    }
    const clean: Record<string, WordStat> = {};
    for (const [cardId, stat] of Object.entries(stored)) {
      if (isWordStat(stat)) {
        clean[cardId] = stat;
      }
    }
    return Promise.resolve(clean);
  }

  save(kid: KidId, stats: WordStats): Promise<void> {
    try {
      const all = this.read();
      all[kid] = { ...stats };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
      log.warn("word-stats", "could not persist stats", { err });
    }
    return Promise.resolve();
  }
}

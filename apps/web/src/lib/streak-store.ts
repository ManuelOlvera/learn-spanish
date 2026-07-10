"use client";

import type { KidId, Streak, StreakStore } from "@learn-spanish/core";
import { log } from "@learn-spanish/config";

const STORAGE_KEY = "palabras.streaks.v1";

type StoredStreaks = Partial<Record<KidId, Streak>>;

function isStreak(value: unknown): value is Streak {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Streak).day === "string" &&
    typeof (value as Streak).count === "number"
  );
}

/** On-device streak persistence; unreadable storage means no streak, not a crash. */
export class LocalStorageStreakStore implements StreakStore {
  private read(): StoredStreaks {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return {};
      }
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) {
        return {};
      }
      return parsed as StoredStreaks;
    } catch (err) {
      log.warn("streak", "streak storage unreadable, starting empty", { err });
      return {};
    }
  }

  load(kid: KidId): Promise<Streak | null> {
    const stored = this.read()[kid];
    return Promise.resolve(isStreak(stored) ? stored : null);
  }

  save(kid: KidId, streak: Streak): Promise<void> {
    try {
      const all = this.read();
      all[kid] = streak;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
      log.warn("streak", "could not persist streak", { err });
    }
    return Promise.resolve();
  }
}

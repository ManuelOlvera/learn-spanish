"use client";

import { isSnapshotTooLarge } from "@learn-spanish/core";
import { log } from "@learn-spanish/config";

/**
 * Whether cross-device sync is actually working on this device.
 *
 * Every exchange in `sync.ts` is best-effort: a failure is caught, logged and
 * retried on the next one. That is right for the retry logic and useless to
 * the parent, because `log.warn` on a family tablet is a message to nobody. A
 * device whose pushes all fail looks exactly like a device that works — the
 * panel says "paired", the kids keep earning stickers locally, and the two
 * devices quietly diverge until somebody notices months missing from the
 * phone.
 *
 * So each exchange stamps its outcome here and the album's sync panel reads
 * it. Device-local, like the pairing code and the theme: it describes *this*
 * device's connection, so it is deliberately not in `ProgressSnapshot`
 * (syncing a record of failed syncs is its own joke).
 */
const HEALTH_KEY = "palabras.sync-health.v1";

export interface SyncHealth {
  /** Epoch ms of the last exchange that actually reached the server. */
  readonly okAt?: number;
  /** Epoch ms of the last failure, when it is newer than the last success. */
  readonly failAt?: number;
  /** What went wrong, in the terms the panel explains it in. `too-big` is the
   *  one that never clears by itself. */
  readonly reason?: SyncFailure;
}

export type SyncFailure = "too-big" | "network";

export function getSyncHealth(): SyncHealth {
  try {
    const raw = window.localStorage.getItem(HEALTH_KEY);
    if (raw === null) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as SyncHealth)
      : {};
  } catch (err) {
    log.warn("sync", "health record unreadable", { err });
    return {};
  }
}

function write(health: SyncHealth): void {
  try {
    window.localStorage.setItem(HEALTH_KEY, JSON.stringify(health));
  } catch (err) {
    // This record exists to report trouble; failing to write it must never
    // become trouble of its own.
    log.warn("sync", "could not store the health record", { err });
  }
}

/** An exchange reached the server. Clears any standing failure — the record
 *  describes the CURRENT state, not a history of every hiccup. */
export function noteSyncOk(now: number = Date.now()): void {
  write({ okAt: now });
}

/**
 * An exchange failed. Keeps the last success time, because "failing" matters
 * much less to a parent than "failing since Tuesday".
 */
export function noteSyncFailed(err: unknown, now: number = Date.now()): void {
  write({
    ...getSyncHealth(),
    failAt: now,
    reason: isSnapshotTooLarge(err) ? "too-big" : "network",
  });
}

/**
 * How long a paired device may go without reaching the server before the panel
 * says so. Sync runs on app open and on every game completion, so a device in
 * daily use touches the server many times a day; a whole day of silence means
 * something is wrong, where an hour usually means nobody played.
 */
export const STALE_SYNC_HOURS = 24;

export type SyncTone = "ok" | "warn" | "bad";

export interface SyncNote {
  readonly tone: SyncTone;
  /** Which case was hit, so the panel picks its wording — this module decides
   *  what is true, the component decides how to say it. */
  readonly kind: "too-big" | "never-connected" | "failing" | "stale" | "fresh";
  /** Age in ms of the fact being reported, when there is one to report. */
  readonly age?: number;
}

/**
 * What to tell the parent about this device's connection, or `null` when there
 * is nothing worth saying (paired, but nothing exchanged yet — the panel's own
 * text already covers that).
 */
export function syncNote(health: SyncHealth, now: number): SyncNote | null {
  const failing =
    health.failAt !== undefined && health.failAt > (health.okAt ?? 0);
  if (failing && health.reason === "too-big") {
    // The one failure that never clears on its own: the family has outgrown
    // the server's per-row cap, so every push from here fails identically.
    // Suggesting the wifi would be exactly the wrong advice.
    return { tone: "bad", kind: "too-big" };
  }
  if (failing) {
    return health.okAt === undefined
      ? { tone: "warn", kind: "never-connected" }
      : { tone: "warn", kind: "failing", age: now - health.okAt };
  }
  if (health.okAt === undefined) {
    return null;
  }
  const age = now - health.okAt;
  return age > STALE_SYNC_HOURS * 3_600_000
    ? { tone: "warn", kind: "stale", age }
    : { tone: "ok", kind: "fresh", age };
}

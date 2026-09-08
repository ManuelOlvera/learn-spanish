"use client";

import { log } from "@learn-spanish/config";

/**
 * Whether this device's storage has refused a write.
 *
 * Every local store here is deliberately failure-tolerant: `save()` catches,
 * logs a warning and resolves, so one bad write never takes a game down. The
 * gap that leaves is that a *permanently* failing write looks identical to a
 * successful one — a full quota means the session's stickers, stars and stats
 * are never persisted and nothing on any screen says so. That is not
 * hypothetical: a swallowed album write under a full quota is one of the two
 * routes that produced the orphaned-medal bug (`docs/bugs.md`).
 *
 * **Held in memory, not in storage**, which looks wrong for a full page and is
 * the only thing that can work: the condition being reported is "writes are
 * failing", so a record that needs a write to survive is exactly the record
 * that will not be there. It lasts the session, which is long enough — the
 * parent's report reads it while the app is open, and the next session
 * re-raises it on the next refused write anyway.
 */
let refusedAt: number | null = null;
let refusedTag: string | null = null;

/**
 * Watchers of the flag.
 *
 * A subscription rather than a plain read, because of *when* the failure
 * happens: the parent's report mounts, and only then loads the data whose
 * write fails. A component that read the flag once on mount would ask before
 * there was anything to know and stay silent for the rest of the session —
 * which is exactly how this shipped broken the first time, caught by driving
 * the real screen with a storage that refuses writes.
 */
type Listener = () => void;
const listeners = new Set<Listener>();

/** Watch the flag; returns the unsubscribe. Fires only on the transition into
 *  the bad state, which happens at most once per session. */
export function subscribeStorageHealth(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * True for the quota errors browsers actually throw, and only those.
 *
 * A private-mode Safari, a locked-down WebView and a genuinely full origin all
 * land here; a `JSON.parse` failure or a null `localStorage` must not, because
 * "your device is full" is the wrong thing to tell a parent whose storage is
 * merely switched off. The name check carries it on every current browser;
 * codes 22 and 1014 are the older Chrome/Firefox spellings.
 */
export function isQuotaError(err: unknown): boolean {
  if (!(err instanceof DOMException)) {
    return false;
  }
  return (
    err.name === "QuotaExceededError" ||
    err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    err.code === 22 ||
    err.code === 1014
  );
}

/** Record a refused write. Callers pass their own tag so the log says which
 *  store hit it first; the parent-facing message never names a store. */
export function noteStorageRefused(tag: string, err: unknown): void {
  if (!isQuotaError(err)) {
    return;
  }
  const first = refusedAt === null;
  refusedAt = Date.now();
  refusedTag = tag;
  if (first) {
    // Once per session is enough for a condition that will now repeat on
    // every write; logging each one would bury everything else.
    log.error("storage", "device storage is full; writes are being lost", {
      tag,
    });
    for (const listener of listeners) {
      listener();
    }
  }
}

export interface StorageHealth {
  readonly full: boolean;
  readonly since?: number;
  readonly tag?: string;
}

export function getStorageHealth(): StorageHealth {
  return refusedAt === null
    ? { full: false }
    : { full: true, since: refusedAt, tag: refusedTag ?? undefined };
}

/** Testing seam only — the app never recovers this state on its own. */
export function resetStorageHealth(): void {
  refusedAt = null;
  refusedTag = null;
  listeners.clear();
}

"use client";

import {
  ALL_KIDS,
  defaultCollection,
  type KidId,
  type PetCollection,
  type PetState,
  WALLET_EPOCH,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";

/**
 * The one place localStorage schema evolution lives. Each migration runs once
 * per device (the applied set is itself persisted), in order, on the first
 * storage access of a session — so readers stay migration-free and the schema
 * history is auditable here instead of buried inside individual getters.
 *
 * Rules: migrations only move data between keys (no business logic), are safe
 * to re-run (idempotent), and never delete the legacy key — an old app version
 * still running elsewhere may read it, and localStorage is not so scarce that
 * a few dead bytes matter.
 */
const APPLIED_KEY = "palabras.migrations.v1";

const PET_KEY = "palabras.pet.v1"; // legacy single pet
const PETS_KEY = "palabras.pets.v2"; // pet collection
const OWNED_ACCESSORIES_KEY = "palabras.owned-accessories.v1";
const STARS_KEY = "palabras.stars.v1"; // must match economy-store.ts

function readKidDoc<T>(key: string): Partial<Record<KidId, T>> {
  const raw = window.localStorage.getItem(key);
  if (raw === null) {
    return {};
  }
  const parsed: unknown = JSON.parse(raw);
  return typeof parsed === "object" && parsed !== null
    ? (parsed as Partial<Record<KidId, T>>)
    : {};
}

function writeKidDoc<T>(key: string, kid: KidId, value: T): void {
  const all = readKidDoc<T>(key);
  all[kid] = value;
  window.localStorage.setItem(key, JSON.stringify(all));
}

/** Pre-collection kids kept one pet under palabras.pet.v1 — seat it in the
 *  starter slot of a fresh collection. */
function migrateLegacyPetToCollection(): void {
  for (const kid of ALL_KIDS) {
    const existing = readKidDoc<PetCollection>(PETS_KEY)[kid];
    if (existing !== undefined) {
      continue;
    }
    const legacy = readKidDoc<PetState>(PET_KEY)[kid];
    if (legacy === undefined || typeof legacy.meals !== "number") {
      continue;
    }
    const collection = defaultCollection();
    writeKidDoc(PETS_KEY, kid, {
      ...collection,
      pets: { ...collection.pets, [collection.active]: legacy },
    });
  }
}

/** Accessory ownership moved from per-pet lists to one kid-level wardrobe. */
function migrateAccessoriesToWardrobe(): void {
  for (const kid of ALL_KIDS) {
    const existing = readKidDoc<readonly string[]>(OWNED_ACCESSORIES_KEY)[kid];
    if (Array.isArray(existing)) {
      continue;
    }
    const collection = readKidDoc<PetCollection>(PETS_KEY)[kid];
    const owned = [
      ...new Set(
        Object.values(collection?.pets ?? {}).flatMap(
          (p) => p.accessories ?? [],
        ),
      ),
    ];
    if (owned.length > 0) {
      writeKidDoc(OWNED_ACCESSORIES_KEY, kid, owned);
    }
  }
}

/** Deliberate exception to the move-only rule: WALLET_EPOCH 1 is a policy
 *  reset (the 2026-07 economy rebalance — balances earned under weekend-sized
 *  prices would buy out the new catalog on day one). Zeroes every kid's
 *  wallet once per device; the matching merge rule in core keeps stale cloud
 *  rows and old transfer codes from resurrecting the old balances. Owned
 *  items, freezes, and streaks are untouched. */
function resetWalletsForEpoch(): void {
  for (const kid of ALL_KIDS) {
    writeKidDoc(STARS_KEY, kid, 0);
  }
}

/** Ordered: later migrations may read the output of earlier ones. */
const MIGRATIONS: readonly { id: string; run: () => void }[] = [
  { id: "pet-v1-to-collection", run: migrateLegacyPetToCollection },
  { id: "accessories-to-wardrobe", run: migrateAccessoriesToWardrobe },
  { id: `wallet-epoch-${WALLET_EPOCH}`, run: resetWalletsForEpoch },
];

/** Run every not-yet-applied migration. A migration that throws is retried on
 *  the next session (it is not recorded as applied); the ones after it still
 *  run so one bad key can't block the rest. */
export function runStorageMigrations(): void {
  let applied: string[];
  try {
    const raw = window.localStorage.getItem(APPLIED_KEY);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    applied = Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch (err) {
    log.warn("migrations", "applied set unreadable; assuming none", { err });
    applied = [];
  }
  for (const migration of MIGRATIONS) {
    if (applied.includes(migration.id)) {
      continue;
    }
    try {
      migration.run();
      applied.push(migration.id);
    } catch (err) {
      log.warn("migrations", `${migration.id} failed; will retry next open`, {
        err,
      });
    }
  }
  try {
    window.localStorage.setItem(APPLIED_KEY, JSON.stringify(applied));
  } catch (err) {
    log.warn("migrations", "could not persist applied set", { err });
  }
}

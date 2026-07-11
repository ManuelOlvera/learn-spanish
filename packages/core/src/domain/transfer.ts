import { isKidId } from "./kid";
import type { KidId } from "./kid";
import type { Streak } from "./daily";
import type { WordStat, WordStats } from "./word-stats";
import type { PetCollection, PetState } from "./mascota";

/**
 * One-time progress transfer between devices — a copy-able code, no backend
 * (ADR 002 stays intact). A code is a snapshot, not a sync: importing merges
 * once and the devices drift apart again afterwards.
 */
export interface ProgressSnapshot {
  readonly stickers: readonly string[];
  readonly streaks: Partial<Record<KidId, Streak>>;
  /** Presentation identity travels with progress (opaque emoji per kid). */
  readonly avatars: Partial<Record<KidId, string>>;
  /** Per-kid word tallies; optional so pre-stats codes still decode. */
  readonly stats?: Partial<Record<KidId, WordStats>>;
  /** Economy fields — all optional for backwards compatibility. */
  readonly stars?: Partial<Record<KidId, number>>;
  readonly stickerCounts?: Readonly<Record<string, number>>;
  /** Legacy single active pet (pre-collection codes); still emitted for
   *  compat. `petCollections` is authoritative when present. */
  readonly pets?: Partial<Record<KidId, PetState>>;
  readonly petCollections?: Partial<Record<KidId, PetCollection>>;
  /** Bought avatars a kid owns (free starters are implicit). */
  readonly ownedAvatars?: Partial<Record<KidId, readonly string[]>>;
}

export class InvalidTransferCodeError extends Error {
  constructor(public readonly reason: string) {
    super(`Invalid transfer code: ${reason}`);
    this.name = "InvalidTransferCodeError";
  }
}

const PREFIX = "PALABRAS1.";

const BASE64URL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/* Hand-rolled base64url over UTF-8 bytes: framework-agnostic (btoa is
 * browser-only, Buffer is Node-only) and emoji-safe. */
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const [a, b, c] = [bytes[i]!, bytes[i + 1], bytes[i + 2]];
    out += BASE64URL[a >> 2]!;
    out += BASE64URL[((a & 3) << 4) | ((b ?? 0) >> 4)]!;
    if (b !== undefined) out += BASE64URL[((b & 15) << 2) | ((c ?? 0) >> 6)]!;
    if (c !== undefined) out += BASE64URL[c & 63]!;
  }
  return out;
}

function fromBase64Url(encoded: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) {
    throw new InvalidTransferCodeError("not base64url");
  }
  const values = [...encoded].map((ch) => BASE64URL.indexOf(ch));
  const bytes: number[] = [];
  for (let i = 0; i < values.length; i += 4) {
    const [a, b, c, d] = [values[i]!, values[i + 1], values[i + 2], values[i + 3]];
    if (b === undefined) throw new InvalidTransferCodeError("truncated");
    bytes.push(((a << 2) | (b >> 4)) & 0xff);
    if (c !== undefined) bytes.push(((b << 4) | (c >> 2)) & 0xff);
    if (d !== undefined) bytes.push(((c! << 6) | d) & 0xff);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function isValidStickerId(id: string): boolean {
  const parts = id.split(":");
  return parts.length === 3 && isKidId(parts[0]!) && parts.every((p) => p !== "");
}

function isStreak(value: unknown): value is Streak {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Streak).day === "string" &&
    typeof (value as Streak).count === "number"
  );
}

function sanitizeKidRecord<T>(
  raw: unknown,
  isValid: (value: unknown) => value is T,
): Partial<Record<KidId, T>> {
  const result: Partial<Record<KidId, T>> = {};
  if (typeof raw !== "object" || raw === null) {
    return result;
  }
  for (const [key, value] of Object.entries(raw)) {
    if (isKidId(key) && isValid(value)) {
      result[key] = value;
    }
  }
  return result;
}

export function encodeProgress(snapshot: ProgressSnapshot): string {
  return PREFIX + toBase64Url(JSON.stringify(snapshot));
}

export function decodeProgress(code: string): ProgressSnapshot {
  const trimmed = code.trim();
  if (!trimmed.startsWith(PREFIX)) {
    throw new InvalidTransferCodeError("unknown code format or version");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fromBase64Url(trimmed.slice(PREFIX.length)));
  } catch (err) {
    if (err instanceof InvalidTransferCodeError) throw err;
    throw new InvalidTransferCodeError("undecodable payload");
  }
  if (typeof raw !== "object" || raw === null) {
    throw new InvalidTransferCodeError("payload is not a snapshot");
  }
  const candidate = raw as Record<string, unknown>;
  const stickers = Array.isArray(candidate.stickers)
    ? candidate.stickers.filter(
        (id): id is string => typeof id === "string" && isValidStickerId(id),
      )
    : [];
  const stats = sanitizeKidRecord(candidate.stats, isWordStats);
  const stars = sanitizeKidRecord(
    candidate.stars,
    (v): v is number => typeof v === "number" && v >= 0,
  );
  const pets = sanitizeKidRecord(candidate.pets, isPetState);
  const stickerCounts: Record<string, number> = {};
  if (typeof candidate.stickerCounts === "object" && candidate.stickerCounts !== null) {
    for (const [id, count] of Object.entries(candidate.stickerCounts)) {
      if (isValidStickerId(id) && typeof count === "number" && count > 0) {
        stickerCounts[id] = count;
      }
    }
  }
  const petCollections = sanitizeKidRecord(
    candidate.petCollections,
    isPetCollection,
  );
  const ownedAvatars = sanitizeKidRecord(
    candidate.ownedAvatars,
    (v): v is readonly string[] =>
      Array.isArray(v) && v.every((e) => typeof e === "string"),
  );
  return {
    stickers,
    streaks: sanitizeKidRecord(candidate.streaks, isStreak),
    avatars: sanitizeKidRecord(
      candidate.avatars,
      (v): v is string => typeof v === "string" && v !== "",
    ),
    // Optional fields omitted when absent so older codes round-trip unchanged.
    ...(Object.keys(stats).length > 0 ? { stats } : {}),
    ...(Object.keys(stars).length > 0 ? { stars } : {}),
    ...(Object.keys(stickerCounts).length > 0 ? { stickerCounts } : {}),
    ...(Object.keys(pets).length > 0 ? { pets } : {}),
    ...(Object.keys(petCollections).length > 0 ? { petCollections } : {}),
    ...(Object.keys(ownedAvatars).length > 0 ? { ownedAvatars } : {}),
  };
}

function isPetCollection(value: unknown): value is PetCollection {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const c = value as PetCollection;
  return (
    typeof c.active === "string" &&
    Array.isArray(c.owned) &&
    c.owned.every((s) => typeof s === "string") &&
    typeof c.pets === "object" &&
    c.pets !== null &&
    Object.values(c.pets).every(isPetState)
  );
}

function isPetState(value: unknown): value is PetState {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const pet = value as PetState;
  const accessoriesOk =
    pet.accessories === undefined ||
    (Array.isArray(pet.accessories) &&
      pet.accessories.every((a) => typeof a === "string"));
  return (
    typeof pet.meals === "number" &&
    (pet.lastFed === null || typeof pet.lastFed === "string") &&
    accessoriesOk
  );
}

function isWordStats(value: unknown): value is WordStats {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return Object.values(value).every(
    (stat) =>
      typeof stat === "object" &&
      stat !== null &&
      typeof (stat as WordStat).right === "number" &&
      typeof (stat as WordStat).wrong === "number",
  );
}

/** Import = merge, never overwrite: sticker union, later streak day wins
 *  (higher count on ties), incoming avatars win where present. */
export function mergeProgress(
  current: ProgressSnapshot,
  incoming: ProgressSnapshot,
): ProgressSnapshot {
  const stickers = [...current.stickers];
  for (const id of incoming.stickers) {
    if (!stickers.includes(id)) {
      stickers.push(id);
    }
  }

  const streaks: Partial<Record<KidId, Streak>> = { ...current.streaks };
  for (const [kid, streak] of Object.entries(incoming.streaks) as [
    KidId,
    Streak,
  ][]) {
    const existing = streaks[kid];
    if (
      existing === undefined ||
      streak.day > existing.day ||
      (streak.day === existing.day && streak.count > existing.count)
    ) {
      streaks[kid] = streak;
    }
  }

  // Per-word maxima keep the merge idempotent (re-importing never inflates).
  const stats: Partial<Record<KidId, WordStats>> = { ...(current.stats ?? {}) };
  for (const [kid, incomingStats] of Object.entries(incoming.stats ?? {}) as [
    KidId,
    WordStats,
  ][]) {
    const merged: Record<string, WordStat> = { ...(stats[kid] ?? {}) };
    for (const [cardId, stat] of Object.entries(incomingStats)) {
      const existing = merged[cardId];
      merged[cardId] = {
        right: Math.max(existing?.right ?? 0, stat.right),
        wrong: Math.max(existing?.wrong ?? 0, stat.wrong),
      };
    }
    stats[kid] = merged;
  }

  // Economy fields max-merge for idempotence (re-import never inflates).
  const stars: Partial<Record<KidId, number>> = { ...(current.stars ?? {}) };
  for (const [kid, value] of Object.entries(incoming.stars ?? {}) as [KidId, number][]) {
    stars[kid] = Math.max(stars[kid] ?? 0, value);
  }
  const stickerCounts: Record<string, number> = { ...(current.stickerCounts ?? {}) };
  for (const [id, count] of Object.entries(incoming.stickerCounts ?? {})) {
    stickerCounts[id] = Math.max(stickerCounts[id] ?? 0, count);
  }
  const pets: Partial<Record<KidId, PetState>> = { ...(current.pets ?? {}) };
  for (const [kid, pet] of Object.entries(incoming.pets ?? {}) as [KidId, PetState][]) {
    pets[kid] = mergePet(pets[kid], pet);
  }

  // Owned avatars union (bought content is never lost on a merge).
  const ownedAvatars: Partial<Record<KidId, readonly string[]>> = {
    ...(current.ownedAvatars ?? {}),
  };
  for (const [kid, list] of Object.entries(incoming.ownedAvatars ?? {}) as [
    KidId,
    readonly string[],
  ][]) {
    ownedAvatars[kid] = [...new Set([...(ownedAvatars[kid] ?? []), ...list])];
  }

  // Pet collections: union owned species, max-merge each pet, keep an active.
  const petCollections: Partial<Record<KidId, PetCollection>> = {
    ...(current.petCollections ?? {}),
  };
  for (const [kid, incomingCol] of Object.entries(
    incoming.petCollections ?? {},
  ) as [KidId, PetCollection][]) {
    const existing = petCollections[kid];
    if (existing === undefined) {
      petCollections[kid] = incomingCol;
      continue;
    }
    const owned = [...new Set([...existing.owned, ...incomingCol.owned])];
    const petsBySpecies: Record<string, PetState> = { ...existing.pets };
    for (const [species, pet] of Object.entries(incomingCol.pets)) {
      petsBySpecies[species] = mergePet(petsBySpecies[species], pet);
    }
    petCollections[kid] = {
      active: incomingCol.active || existing.active,
      owned,
      pets: petsBySpecies,
    };
  }

  return {
    stickers,
    streaks,
    avatars: { ...current.avatars, ...incoming.avatars },
    stats,
    stars,
    stickerCounts,
    pets,
    ...(Object.keys(petCollections).length > 0 ? { petCollections } : {}),
    ...(Object.keys(ownedAvatars).length > 0 ? { ownedAvatars } : {}),
  };
}

/** Max-merge two pet states (meals, later feed day, accessory union). */
function mergePet(a: PetState | undefined, b: PetState): PetState {
  if (a === undefined) {
    return b;
  }
  const accessories = [...new Set([...(a.accessories ?? []), ...(b.accessories ?? [])])];
  return {
    meals: Math.max(a.meals, b.meals),
    lastFed:
      a.lastFed === null
        ? b.lastFed
        : b.lastFed === null
          ? a.lastFed
          : a.lastFed > b.lastFed
            ? a.lastFed
            : b.lastFed,
    ...(accessories.length > 0 ? { accessories } : {}),
  };
}

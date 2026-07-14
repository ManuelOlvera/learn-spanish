import { isKidId } from "./kid";
import type { KidId } from "./kid";
import type { Streak } from "./daily";
import type { WordStat, WordStats } from "./word-stats";
import type { PetCollection, PetState } from "./mascota";
import type { WeekProgress, WeeklyStreak } from "./weekly";
import { tierRank } from "./category";
import type { StickerTier } from "./sticker-tiers";
import type { MissionState } from "./mission";
import { walletBalance, type Wallet } from "./stars";

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
  /** Legacy balance view of the wallet, kept so pre-counter clients can still
   *  read the row/code. Emitted derived from `wallets`; on merge, `wallets`
   *  is authoritative wherever it exists. */
  readonly stars?: Partial<Record<KidId, number>>;
  /** The counter wallet (earned/spent, balance derived — see domain/stars.ts).
   *  Counters are monotonic, so per-counter max-merge makes spends survive
   *  syncing; max-merging the raw balance resurrected them. */
  readonly wallets?: Partial<Record<KidId, Wallet>>;
  /** The wallet generation the wallet fields belong to (see WALLET_EPOCH).
   *  Absent means epoch 0; older-epoch wallet fields lose to newer wholesale. */
  readonly walletEpoch?: number;
  readonly stickerCounts?: Readonly<Record<string, number>>;
  /** Legacy single active pet (pre-collection codes); still emitted for
   *  compat. `petCollections` is authoritative when present. */
  readonly pets?: Partial<Record<KidId, PetState>>;
  readonly petCollections?: Partial<Record<KidId, PetCollection>>;
  /** Bought avatars a kid owns (free starters are implicit). */
  readonly ownedAvatars?: Partial<Record<KidId, readonly string[]>>;
  /** Wardrobe accessories a kid owns (kid-level; worn state travels per-pet). */
  readonly ownedAccessories?: Partial<Record<KidId, readonly string[]>>;
  /** Secret decks a kid has unlocked with stars. */
  readonly unlockedDecks?: Partial<Record<KidId, readonly string[]>>;
  /** Streak freezes a kid holds (bought/earned) — merge takes the max. */
  readonly freezes?: Partial<Record<KidId, number>>;
  /** Weekly streak per kid — merge keeps the higher count (later week on ties). */
  readonly weekly?: Partial<Record<KidId, WeeklyStreak>>;
  /** The in-progress week's active days — merge unions within a week, else the
   *  later week wins. */
  readonly weekProgress?: Partial<Record<KidId, WeekProgress>>;
  /** Highest category-completion tier each deck's chest has been paid out for,
   *  per kid — merge keeps the higher tier so a chest never re-pays on sync. */
  readonly categoryAwards?: Partial<Record<KidId, Readonly<Record<string, StickerTier>>>>;
  /** Today's daily-mission state per kid — merge unions the done kinds within a
   *  day (later day supersedes) and keeps `claimed` once set, so a completed
   *  mission shows complete on every device and the bonus can't be re-claimed. */
  readonly missions?: Partial<Record<KidId, MissionState>>;
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

/*
 * Magnitude caps for anything crossing a trust boundary. Shape checks alone
 * aren't enough: `Infinity` passes `typeof === "number"`, sticks forever under
 * max-merge, and stringifies to `null` in storage; unbounded strings/arrays
 * let one hostile payload fill a device's ~5 MB localStorage quota. Ceilings
 * are generous — orders of magnitude above anything a kid can earn.
 */
const MAX_COUNT = 1_000_000;
const MAX_TEXT = 64;
const MAX_LIST = 5_000;

function isSaneCount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= MAX_COUNT
  );
}

function isSaneText(value: unknown): value is string {
  return typeof value === "string" && value !== "" && value.length <= MAX_TEXT;
}

function isSaneStringList(value: unknown, max = MAX_LIST): value is readonly string[] {
  return Array.isArray(value) && value.length <= max && value.every(isSaneText);
}

function isValidStickerId(id: string): boolean {
  if (id.length > MAX_TEXT) {
    return false;
  }
  const parts = id.split(":");
  return parts.length === 3 && isKidId(parts[0]!) && parts.every((p) => p !== "");
}

function isStreak(value: unknown): value is Streak {
  return (
    typeof value === "object" &&
    value !== null &&
    isSaneText((value as Streak).day) &&
    isSaneCount((value as Streak).count)
  );
}

export function isWeeklyStreak(value: unknown): value is WeeklyStreak {
  return (
    typeof value === "object" &&
    value !== null &&
    isSaneText((value as WeeklyStreak).week) &&
    isSaneCount((value as WeeklyStreak).count)
  );
}

export function isWeekProgress(value: unknown): value is WeekProgress {
  return (
    typeof value === "object" &&
    value !== null &&
    isSaneText((value as WeekProgress).week) &&
    // A week has at most 7 active days; 366 leaves room without being a bomb.
    isSaneStringList((value as WeekProgress).days, 366)
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

/** Real codes are a few KB; anything near this is a storage-filling payload,
 *  not progress. Rejected before the O(n) decode + parse even starts. */
const MAX_CODE_LENGTH = 256 * 1024;

export function decodeProgress(code: string): ProgressSnapshot {
  const trimmed = code.trim();
  if (trimmed.length > MAX_CODE_LENGTH) {
    throw new InvalidTransferCodeError("code too large");
  }
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
  return sanitizeSnapshot(raw);
}

/**
 * Coerce an untrusted object into a valid `ProgressSnapshot`, dropping anything
 * malformed. Shared by the transfer-code path and the remote-sync adapter — any
 * payload that crosses a trust boundary (a pasted code, a Supabase row) must
 * pass through here before it reaches `mergeProgress`. A non-object yields an
 * empty snapshot.
 */
export function sanitizeSnapshot(raw: unknown): ProgressSnapshot {
  if (typeof raw !== "object" || raw === null) {
    return { stickers: [], streaks: {}, avatars: {} };
  }
  const candidate = raw as Record<string, unknown>;
  const stickers = Array.isArray(candidate.stickers)
    ? candidate.stickers
        .filter(
          (id): id is string => typeof id === "string" && isValidStickerId(id),
        )
        .slice(0, MAX_LIST)
    : [];
  const stats = sanitizeKidRecord(candidate.stats, isWordStats);
  const stars = sanitizeKidRecord(candidate.stars, isSaneCount);
  const wallets = sanitizeKidRecord(candidate.wallets, isWallet);
  const pets = sanitizeKidRecord(candidate.pets, isPetState);
  const stickerCounts: Record<string, number> = {};
  if (typeof candidate.stickerCounts === "object" && candidate.stickerCounts !== null) {
    for (const [id, count] of Object.entries(candidate.stickerCounts).slice(0, MAX_LIST)) {
      if (isValidStickerId(id) && isSaneCount(count) && count > 0) {
        stickerCounts[id] = count;
      }
    }
  }
  const petCollections = sanitizeKidRecord(
    candidate.petCollections,
    isPetCollection,
  );
  const isStringArray = (v: unknown): v is readonly string[] =>
    isSaneStringList(v);
  const ownedAvatars = sanitizeKidRecord(candidate.ownedAvatars, isStringArray);
  const ownedAccessories = sanitizeKidRecord(
    candidate.ownedAccessories,
    isStringArray,
  );
  const unlockedDecks = sanitizeKidRecord(candidate.unlockedDecks, isStringArray);
  const freezes = sanitizeKidRecord(candidate.freezes, isSaneCount);
  const weekly = sanitizeKidRecord(candidate.weekly, isWeeklyStreak);
  const weekProgress = sanitizeKidRecord(candidate.weekProgress, isWeekProgress);
  const categoryAwards = sanitizeKidRecord(
    candidate.categoryAwards,
    isCategoryAwards,
  );
  const missions = sanitizeKidRecord(candidate.missions, isMissionState);
  return {
    stickers,
    streaks: sanitizeKidRecord(candidate.streaks, isStreak),
    avatars: sanitizeKidRecord(candidate.avatars, isSaneText),
    // Optional fields omitted when absent so older codes round-trip unchanged.
    ...(Object.keys(stats).length > 0 ? { stats } : {}),
    ...(Object.keys(stars).length > 0 ? { stars } : {}),
    ...(Object.keys(wallets).length > 0 ? { wallets } : {}),
    ...(isSaneCount(candidate.walletEpoch) && candidate.walletEpoch > 0
      ? { walletEpoch: candidate.walletEpoch }
      : {}),
    ...(Object.keys(stickerCounts).length > 0 ? { stickerCounts } : {}),
    ...(Object.keys(pets).length > 0 ? { pets } : {}),
    ...(Object.keys(petCollections).length > 0 ? { petCollections } : {}),
    ...(Object.keys(ownedAvatars).length > 0 ? { ownedAvatars } : {}),
    ...(Object.keys(ownedAccessories).length > 0 ? { ownedAccessories } : {}),
    ...(Object.keys(unlockedDecks).length > 0 ? { unlockedDecks } : {}),
    ...(Object.keys(freezes).length > 0 ? { freezes } : {}),
    ...(Object.keys(weekly).length > 0 ? { weekly } : {}),
    ...(Object.keys(weekProgress).length > 0 ? { weekProgress } : {}),
    ...(Object.keys(categoryAwards).length > 0 ? { categoryAwards } : {}),
    ...(Object.keys(missions).length > 0 ? { missions } : {}),
  };
}

function isWallet(value: unknown): value is Wallet {
  return (
    typeof value === "object" &&
    value !== null &&
    isSaneCount((value as Wallet).earned) &&
    isSaneCount((value as Wallet).spent)
  );
}

export function isMissionState(value: unknown): value is MissionState {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const m = value as MissionState;
  return (
    isSaneText(m.day) &&
    // A mission holds a handful of activity kinds; 32 is already absurd.
    isSaneStringList(m.done, 32) &&
    typeof m.claimed === "boolean"
  );
}

const CLAIMABLE_TIERS: readonly StickerTier[] = ["earned", "silver", "gold"];

/** A deck→tier ledger: keys must be sticker-deck-like, values real claim tiers. */
export function isCategoryAwards(
  value: unknown,
): value is Readonly<Record<string, StickerTier>> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entries = Object.entries(value);
  return (
    entries.length <= MAX_LIST &&
    entries.every(
      ([deckId, tier]) =>
        isSaneText(deckId) &&
        typeof tier === "string" &&
        CLAIMABLE_TIERS.includes(tier as StickerTier),
    )
  );
}

export function isPetCollection(value: unknown): value is PetCollection {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const c = value as PetCollection;
  return (
    isSaneText(c.active) &&
    // The species catalog is small; 100 owned/kept pets is already absurd.
    isSaneStringList(c.owned, 100) &&
    typeof c.pets === "object" &&
    c.pets !== null &&
    Object.entries(c.pets).length <= 100 &&
    Object.entries(c.pets).every(
      ([species, pet]) => isSaneText(species) && isPetState(pet),
    )
  );
}

function isPetState(value: unknown): value is PetState {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const pet = value as PetState;
  const isStringListOrAbsent = (v: unknown): boolean =>
    // A wardrobe holds tens of accessories; 200 is already absurd.
    v === undefined || isSaneStringList(v, 200);
  return (
    isSaneCount(pet.meals) &&
    (pet.lastFed === null || isSaneText(pet.lastFed)) &&
    isStringListOrAbsent(pet.accessories) &&
    isStringListOrAbsent(pet.worn) &&
    (pet.form === undefined || isSaneCount(pet.form))
  );
}

function isWordStats(value: unknown): value is WordStats {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entries = Object.entries(value);
  return (
    entries.length <= MAX_LIST &&
    entries.every(
      ([cardId, stat]) =>
        isSaneText(cardId) &&
        typeof stat === "object" &&
        stat !== null &&
        isSaneCount((stat as WordStat).right) &&
        isSaneCount((stat as WordStat).wrong),
    )
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

  // Economy fields max-merge for idempotence (re-import never inflates) —
  // except across wallet epochs: a bumped WALLET_EPOCH is a deliberate wallet
  // event (a reset, a schema change), so wallet fields from an older epoch
  // are discarded, never merged, or every stale cloud row and transfer code
  // would resurrect the pre-bump values.
  const currentEpoch = current.walletEpoch ?? 0;
  const incomingEpoch = incoming.walletEpoch ?? 0;
  const walletEpoch = Math.max(currentEpoch, incomingEpoch);
  // Counter wallets: per-counter max. Both counters are monotonic, so this is
  // idempotent AND spend-safe — a stale peer's lower `spent` can't undo a buy.
  const wallets: Partial<Record<KidId, Wallet>> = {
    ...(currentEpoch === walletEpoch ? current.wallets ?? {} : {}),
  };
  if (incomingEpoch === walletEpoch) {
    for (const [kid, wallet] of Object.entries(incoming.wallets ?? {}) as [KidId, Wallet][]) {
      const existing = wallets[kid];
      wallets[kid] = existing === undefined
        ? wallet
        : {
            earned: Math.max(existing.earned, wallet.earned),
            spent: Math.max(existing.spent, wallet.spent),
          };
    }
  }
  // Legacy balances still merge for kids without counters (old snapshots);
  // wherever a counter wallet exists it is authoritative and overwrites the
  // balance view below.
  const stars: Partial<Record<KidId, number>> = {
    ...(currentEpoch === walletEpoch ? current.stars ?? {} : {}),
  };
  if (incomingEpoch === walletEpoch) {
    for (const [kid, value] of Object.entries(incoming.stars ?? {}) as [KidId, number][]) {
      stars[kid] = Math.max(stars[kid] ?? 0, value);
    }
  }
  for (const [kid, wallet] of Object.entries(wallets) as [KidId, Wallet][]) {
    stars[kid] = walletBalance(wallet);
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

  // Owned accessories union too (bought once, kept forever).
  const ownedAccessories: Partial<Record<KidId, readonly string[]>> = {
    ...(current.ownedAccessories ?? {}),
  };
  for (const [kid, list] of Object.entries(incoming.ownedAccessories ?? {}) as [
    KidId,
    readonly string[],
  ][]) {
    ownedAccessories[kid] = [
      ...new Set([...(ownedAccessories[kid] ?? []), ...list]),
    ];
  }

  // Secret-deck unlocks union too (a bought deck is never lost).
  const unlockedDecks: Partial<Record<KidId, readonly string[]>> = {
    ...(current.unlockedDecks ?? {}),
  };
  for (const [kid, list] of Object.entries(incoming.unlockedDecks ?? {}) as [
    KidId,
    readonly string[],
  ][]) {
    unlockedDecks[kid] = [...new Set([...(unlockedDecks[kid] ?? []), ...list])];
  }

  // Freezes max-merge (a bought/earned freeze is never lost on a merge).
  const freezes: Partial<Record<KidId, number>> = { ...(current.freezes ?? {}) };
  for (const [kid, count] of Object.entries(incoming.freezes ?? {}) as [
    KidId,
    number,
  ][]) {
    freezes[kid] = Math.max(freezes[kid] ?? 0, count);
  }

  // Weekly streak: higher count wins, later in-progress week breaks ties.
  const weekly: Partial<Record<KidId, WeeklyStreak>> = { ...(current.weekly ?? {}) };
  for (const [kid, streak] of Object.entries(incoming.weekly ?? {}) as [
    KidId,
    WeeklyStreak,
  ][]) {
    const existing = weekly[kid];
    if (
      existing === undefined ||
      streak.count > existing.count ||
      (streak.count === existing.count && streak.week > existing.week)
    ) {
      weekly[kid] = streak;
    }
  }

  // Week progress: union active days within the same week; a later week (a
  // fresh week that reset the day set) supersedes an older one.
  const weekProgress: Partial<Record<KidId, WeekProgress>> = {
    ...(current.weekProgress ?? {}),
  };
  for (const [kid, incomingWeek] of Object.entries(incoming.weekProgress ?? {}) as [
    KidId,
    WeekProgress,
  ][]) {
    const existing = weekProgress[kid];
    if (existing === undefined || incomingWeek.week > existing.week) {
      weekProgress[kid] = incomingWeek;
    } else if (incomingWeek.week === existing.week) {
      weekProgress[kid] = {
        week: existing.week,
        days: [...new Set([...existing.days, ...incomingWeek.days])],
      };
    }
  }

  // Category awards: per deck keep the higher tier, so a completion chest that
  // already paid on one device never re-pays after the sticker counts sync in.
  const categoryAwards: Partial<Record<KidId, Record<string, StickerTier>>> = {};
  for (const [kid, record] of Object.entries(current.categoryAwards ?? {}) as [
    KidId,
    Record<string, StickerTier>,
  ][]) {
    categoryAwards[kid] = { ...record };
  }
  for (const [kid, record] of Object.entries(incoming.categoryAwards ?? {}) as [
    KidId,
    Record<string, StickerTier>,
  ][]) {
    const merged: Record<string, StickerTier> = { ...(categoryAwards[kid] ?? {}) };
    for (const [deckId, tier] of Object.entries(record)) {
      const existing = merged[deckId];
      if (existing === undefined || tierRank(tier) > tierRank(existing)) {
        merged[deckId] = tier;
      }
    }
    categoryAwards[kid] = merged;
  }

  // Daily mission: a later day supersedes; within the same day, union the done
  // kinds and keep `claimed` once either device has claimed the bonus.
  const missions: Partial<Record<KidId, MissionState>> = { ...(current.missions ?? {}) };
  for (const [kid, incomingMission] of Object.entries(incoming.missions ?? {}) as [
    KidId,
    MissionState,
  ][]) {
    const existing = missions[kid];
    if (existing === undefined || incomingMission.day > existing.day) {
      missions[kid] = incomingMission;
    } else if (incomingMission.day === existing.day) {
      missions[kid] = {
        day: existing.day,
        done: [...new Set([...existing.done, ...incomingMission.done])],
        claimed: existing.claimed || incomingMission.claimed,
      };
    }
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
    ...(Object.keys(wallets).length > 0 ? { wallets } : {}),
    ...(walletEpoch > 0 ? { walletEpoch } : {}),
    stickerCounts,
    pets,
    ...(Object.keys(petCollections).length > 0 ? { petCollections } : {}),
    ...(Object.keys(ownedAvatars).length > 0 ? { ownedAvatars } : {}),
    ...(Object.keys(ownedAccessories).length > 0 ? { ownedAccessories } : {}),
    ...(Object.keys(unlockedDecks).length > 0 ? { unlockedDecks } : {}),
    ...(Object.keys(freezes).length > 0 ? { freezes } : {}),
    ...(Object.keys(weekly).length > 0 ? { weekly } : {}),
    ...(Object.keys(weekProgress).length > 0 ? { weekProgress } : {}),
    ...(Object.keys(categoryAwards).length > 0 ? { categoryAwards } : {}),
    ...(Object.keys(missions).length > 0 ? { missions } : {}),
  };
}

/** Max-merge two pet states (meals, later feed day, accessory union). Owning
 *  is unioned so bought content is never lost; `worn` is a per-device outfit
 *  choice, so the receiving device (current) keeps its own. */
function mergePet(a: PetState | undefined, b: PetState): PetState {
  if (a === undefined) {
    return b;
  }
  const accessories = [...new Set([...(a.accessories ?? []), ...(b.accessories ?? [])])];
  const wornSource = a.worn ?? b.worn;
  const worn = wornSource?.filter((id) => accessories.includes(id));
  // `form` is a per-device display choice, like worn: the receiving device wins.
  const form = a.form ?? b.form;
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
    ...(worn !== undefined ? { worn } : {}),
    ...(form !== undefined ? { form } : {}),
  };
}

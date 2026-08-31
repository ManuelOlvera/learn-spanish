import { isKidId } from "./kid";
import type { KidId } from "./kid";
import type { Streak } from "./daily";
import type { WordStat, WordStats } from "./word-stats";
import type { FormOutfit, PetCollection, PetState } from "./mascota";
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
  /** Deck → best El reto score, per kid. Merge takes the max, which is exactly
   *  ADR 004's additive rule — a best score only ever goes up, so syncing can
   *  never take a record away. (Contrast the ⚡ boost, whose expiry made it the
   *  one shape that merge can't carry — ADR 014.) It syncs so a record set on
   *  one device is still there to be beaten on the other. */
  readonly retoBests?: Partial<Record<KidId, Readonly<Record<string, number>>>>;
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

/**
 * Sticker counts, salvaged per entry.
 *
 * Shared by both trust boundaries — the sync sanitizer below and the local
 * counts document in `economy-store` — so a remote row and this device's own
 * disk are held to the same rules. It matters most locally: `AwardStickerUseCase`
 * adds 1 to whatever it finds, so a count stored as the string "3" becomes
 * "31", which compares as gold and then grows by concatenation on every replay,
 * feeding an inflated tier into the category chest that pays stars.
 *
 * Safe to apply to the stored document: `palabras.sticker-counts.v1` arrived
 * with the star economy, which postdates kid profiles, so unlike the album it
 * has never held shared-era "deck:activity" keys for the id check to drop.
 */
export function sanitizeStickerCounts(
  raw: unknown,
): Readonly<Record<string, number>> {
  if (typeof raw !== "object" || raw === null) {
    return {};
  }
  const counts: Record<string, number> = {};
  for (const [id, count] of Object.entries(raw).slice(0, MAX_LIST)) {
    // A count of zero is an absent sticker, not a held one.
    if (isValidStickerId(id) && isSaneCount(count) && count > 0) {
      counts[id] = count;
    }
  }
  return counts;
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
  const stickerCounts = sanitizeStickerCounts(candidate.stickerCounts);
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
  const retoBests = sanitizeKidRecord(candidate.retoBests, isRetoBests);
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
    ...(Object.keys(retoBests).length > 0 ? { retoBests } : {}),
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
export function isRetoBests(
  value: unknown,
): value is Readonly<Record<string, number>> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entries = Object.entries(value);
  return (
    entries.length <= MAX_LIST &&
    entries.every(([deckId, score]) => isSaneText(deckId) && isSaneCount(score))
  );
}

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

/** A dragged spot: a point on the pet box, in percent. */
function isPlacementMap(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entries = Object.entries(value);
  return (
    entries.length <= 200 &&
    entries.every(([id, spot]) => {
      if (!isSaneText(id) || typeof spot !== "object" || spot === null) {
        return false;
      }
      const { x, y } = spot as { x: unknown; y: unknown };
      const onBox = (n: unknown): boolean =>
        typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100;
      return onBox(x) && onBox(y);
    })
  );
}

/** Outfits keyed by form index — one entry per shape the pet can show. The
 *  longest species has four forms, so a handful is already generous. */
function isOutfitMap(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entries = Object.entries(value);
  return (
    entries.length <= 20 &&
    entries.every(([form, outfit]) => {
      if (!/^\d{1,2}$/.test(form)) {
        return false;
      }
      if (typeof outfit !== "object" || outfit === null) {
        return false;
      }
      const { worn, placements } = outfit as {
        worn: unknown;
        placements: unknown;
      };
      return (
        (worn === undefined || isSaneStringList(worn, 200)) &&
        (placements === undefined || isPlacementMap(placements))
      );
    })
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
    (pet.outfits === undefined || isOutfitMap(pet.outfits)) &&
    (pet.form === undefined || isSaneCount(pet.form)) &&
    (pet.name === undefined || isSaneText(pet.name))
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

/**
 * How one kid's value for a field is combined. `mine` is undefined when this
 * device has never held one — the common case for a field the other device
 * invented.
 */
type Combine<T> = (mine: T | undefined, theirs: T) => T;

/**
 * Apply a per-kid rule across two kid-keyed documents.
 *
 * Almost every snapshot field is `Partial<Record<KidId, T>>` and differs only
 * in how one kid's value is combined, so the walk lives here once and each
 * field below names its rule instead of rewriting the loop. Kids the incoming
 * side has never heard of are carried through untouched — a device only one
 * child uses must never delete the other's progress.
 */
function mergeKidField<T>(
  mine: Partial<Record<KidId, T>> | undefined,
  theirs: Partial<Record<KidId, T>> | undefined,
  combine: Combine<T>,
): Partial<Record<KidId, T>> {
  const merged: Partial<Record<KidId, T>> = { ...(mine ?? {}) };
  for (const [kid, value] of Object.entries(theirs ?? {}) as [KidId, T][]) {
    merged[kid] = combine(merged[kid], value);
  }
  return merged;
}

/** Bigger wins. The workhorse: every counter in the economy only goes up, so
 *  this is idempotent and safe against a stale peer. */
const highest: Combine<number> = (mine, theirs) => Math.max(mine ?? 0, theirs);

/** Everything either side owns, first-seen order — bought content is never lost. */
const union: Combine<readonly string[]> = (mine, theirs) => [
  ...new Set([...(mine ?? []), ...theirs]),
];

/** The incoming value always wins, for fields where the other device is simply
 *  more recent and there is nothing to reconcile. */
const takeTheirs: Combine<string> = (_mine, theirs) => theirs;

/** Per key of a record, whichever side ranks higher. */
function bestPerKey<V>(
  rank: (value: V) => number,
): Combine<Readonly<Record<string, V>>> {
  return (mine, theirs) => {
    const merged: Record<string, V> = { ...(mine ?? {}) };
    for (const [key, value] of Object.entries(theirs)) {
      const existing = merged[key];
      if (existing === undefined || rank(value) > rank(existing)) {
        merged[key] = value;
      }
    }
    return merged;
  };
}

/** Whole-value contest: the incoming value replaces this device's only when
 *  `better` says so, so a tie keeps what the receiving device already had. */
function preferring<T>(better: (theirs: T, mine: T) => boolean): Combine<T> {
  return (mine, theirs) =>
    mine === undefined || better(theirs, mine) ? theirs : mine;
}

/** Per word the higher right and the higher wrong, independently, so a
 *  re-import can never inflate either. */
const mergeWordStats: Combine<WordStats> = (mine, theirs) => {
  const merged: Record<string, WordStat> = { ...(mine ?? {}) };
  for (const [cardId, stat] of Object.entries(theirs)) {
    const existing = merged[cardId];
    merged[cardId] = {
      right: Math.max(existing?.right ?? 0, stat.right),
      wrong: Math.max(existing?.wrong ?? 0, stat.wrong),
    };
  }
  return merged;
};

/** Within one week union the active days; a later week supersedes outright —
 *  it is a fresh week that reset the day set, not a smaller one. */
const mergeWeekProgress: Combine<WeekProgress> = (mine, theirs) => {
  if (mine === undefined || theirs.week > mine.week) {
    return theirs;
  }
  if (theirs.week < mine.week) {
    return mine;
  }
  return { week: mine.week, days: [...new Set([...mine.days, ...theirs.days])] };
};

/** A later day supersedes; within a day, union what was done and keep
 *  `claimed` once either device has taken the bonus, so it cannot re-pay. */
const mergeMission: Combine<MissionState> = (mine, theirs) => {
  if (mine === undefined || theirs.day > mine.day) {
    return theirs;
  }
  if (theirs.day < mine.day) {
    return mine;
  }
  return {
    day: mine.day,
    done: [...new Set([...mine.done, ...theirs.done])],
    claimed: mine.claimed || theirs.claimed,
  };
};

/** Union owned species and merge each pet. Which pet is on screen is a
 *  per-device choice like `worn` and `form`: the RECEIVING device wins and the
 *  incoming value only fills a gap. Incoming-wins made every pull adopt the
 *  other device's active pet — feed the one on screen, then a pull would swap
 *  in a pet that had not been fed in days and the hungry face came back
 *  (docs/bugs.md). */
const mergeCollection: Combine<PetCollection> = (mine, theirs) => {
  if (mine === undefined) {
    return theirs;
  }
  const pets: Record<string, PetState> = { ...mine.pets };
  for (const [species, pet] of Object.entries(theirs.pets)) {
    pets[species] = mergePet(pets[species], pet);
  }
  return {
    active: mine.active || theirs.active,
    owned: [...new Set([...mine.owned, ...theirs.owned])],
    pets,
  };
};

/**
 * Import = merge, never overwrite.
 *
 * Each field names the rule it obeys rather than spelling out the walk, so a
 * new snapshot field is one line here and one guard in `sanitizeSnapshot` —
 * and, more to the point, so the rule is legible at a glance instead of being
 * inferred from twenty lines of loop. The irregular fields below keep their own
 * code because they are genuinely irregular: stickers are a flat list, sticker
 * counts are not keyed by kid, and the wallet is gated on its epoch.
 */
export function mergeProgress(
  current: ProgressSnapshot,
  incoming: ProgressSnapshot,
): ProgressSnapshot {
  // ---- the regular per-kid fields, one rule each ----
  const streaks = mergeKidField<Streak>(
    current.streaks,
    incoming.streaks,
    preferring((t, m) => t.day > m.day || (t.day === m.day && t.count > m.count)),
  );
  const avatars = mergeKidField<string>(current.avatars, incoming.avatars, takeTheirs);
  const stats = mergeKidField(current.stats, incoming.stats, mergeWordStats);
  const pets = mergeKidField(current.pets, incoming.pets, (mine, theirs) =>
    mergePet(mine, theirs),
  );
  const petCollections = mergeKidField(
    current.petCollections,
    incoming.petCollections,
    mergeCollection,
  );
  const ownedAvatars = mergeKidField(current.ownedAvatars, incoming.ownedAvatars, union);
  const ownedAccessories = mergeKidField(
    current.ownedAccessories,
    incoming.ownedAccessories,
    union,
  );
  const unlockedDecks = mergeKidField(
    current.unlockedDecks,
    incoming.unlockedDecks,
    union,
  );
  const freezes = mergeKidField(current.freezes, incoming.freezes, highest);
  const weekly = mergeKidField<WeeklyStreak>(
    current.weekly,
    incoming.weekly,
    preferring((t, m) => t.count > m.count || (t.count === m.count && t.week > m.week)),
  );
  const weekProgress = mergeKidField(
    current.weekProgress,
    incoming.weekProgress,
    mergeWeekProgress,
  );
  // Per deck keep the higher tier, so a completion chest that already paid on
  // one device never re-pays after the sticker counts sync in.
  const categoryAwards = mergeKidField(
    current.categoryAwards,
    incoming.categoryAwards,
    bestPerKey<StickerTier>(tierRank),
  );
  // A reto best only ever goes up, so no device can erase the other's record.
  const retoBests = mergeKidField(
    current.retoBests,
    incoming.retoBests,
    bestPerKey<number>((score) => score),
  );
  const missions = mergeKidField(current.missions, incoming.missions, mergeMission);

  // ---- the irregular fields ----

  const stickers = [...current.stickers];
  for (const id of incoming.stickers) {
    if (!stickers.includes(id)) {
      stickers.push(id);
    }
  }

  // Not keyed by kid: a sticker id already carries the kid.
  const stickerCounts: Record<string, number> = { ...(current.stickerCounts ?? {}) };
  for (const [id, count] of Object.entries(incoming.stickerCounts ?? {})) {
    stickerCounts[id] = Math.max(stickerCounts[id] ?? 0, count);
  }

  // The wallet is epoch-gated: a bumped WALLET_EPOCH is a deliberate wallet
  // event (a reset, a schema change), so wallet fields from an older epoch are
  // discarded rather than merged, or every stale cloud row and transfer code
  // would resurrect the pre-bump values.
  const currentEpoch = current.walletEpoch ?? 0;
  const incomingEpoch = incoming.walletEpoch ?? 0;
  const walletEpoch = Math.max(currentEpoch, incomingEpoch);
  // Counters are monotonic, so per-counter max is idempotent AND spend-safe: a
  // stale peer's lower `spent` cannot undo a buy.
  const wallets = mergeKidField<Wallet>(
    currentEpoch === walletEpoch ? current.wallets : {},
    incomingEpoch === walletEpoch ? incoming.wallets : {},
    (mine, theirs) =>
      mine === undefined
        ? theirs
        : {
            earned: Math.max(mine.earned, theirs.earned),
            spent: Math.max(mine.spent, theirs.spent),
          },
  );
  // Legacy balances still merge for kids without counters (old snapshots);
  // wherever a counter wallet exists it is authoritative and overwrites the
  // balance view below.
  const stars = mergeKidField<number>(
    currentEpoch === walletEpoch ? current.stars : {},
    incomingEpoch === walletEpoch ? incoming.stars : {},
    highest,
  );
  for (const [kid, wallet] of Object.entries(wallets) as [KidId, Wallet][]) {
    stars[kid] = walletBalance(wallet);
  }

  return {
    stickers,
    streaks,
    avatars,
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
    ...(Object.keys(retoBests).length > 0 ? { retoBests } : {}),
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
  // Only prune worn against a legacy per-pet `accessories` list. Ownership is
  // kid-level now, so modern pets carry no `accessories` — filtering against an
  // empty list would strip every worn item on each merge (accessories vanishing
  // off the mascot after a sync). Kept as-is when there's nothing to prune by.
  const worn =
    accessories.length > 0
      ? wornSource?.filter((id) => accessories.includes(id))
      : wornSource;
  // Where the kid dragged each accessory. Merged per accessory so neither
  // device loses a spot it saved; the receiving device wins a conflict, like
  // worn/form. Dropping this key entirely (the old behaviour) reset every
  // dragged accessory to its default spot on each sync (docs/bugs.md).
  const placements =
    a.placements === undefined && b.placements === undefined
      ? undefined
      : { ...(b.placements ?? {}), ...(a.placements ?? {}) };
  // Outfits are per form, so they merge per form: a shape only the other device
  // has dressed is adopted whole (growing up on one device must not undress it
  // on the other), and inside a shape the receiving device wins — like worn.
  const outfits = mergeOutfits(a.outfits, b.outfits);
  // `form` is a per-device display choice, like worn: the receiving device wins.
  const form = a.form ?? b.form;
  // A name is precious — never let an unnamed side clobber a named one; the
  // receiving device wins only when both have named the pet.
  const name = a.name ?? b.name;
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
    ...(placements !== undefined ? { placements } : {}),
    ...(outfits !== undefined ? { outfits } : {}),
    ...(form !== undefined ? { form } : {}),
    ...(name !== undefined ? { name } : {}),
  };
}

/** Union the two devices' per-form outfits. Every form either side has dressed
 *  survives; where both dressed the same form, the receiving device (a) keeps
 *  what it is wearing and its dragged spots win item by item. */
function mergeOutfits(
  a: PetState["outfits"],
  b: PetState["outfits"],
): PetState["outfits"] {
  if (a === undefined || b === undefined) {
    return a ?? b;
  }
  const merged: Record<string, FormOutfit> = { ...b };
  for (const [form, mine] of Object.entries(a)) {
    const theirs = merged[form];
    if (theirs === undefined) {
      merged[form] = mine;
      continue;
    }
    const worn = mine.worn ?? theirs.worn;
    const placements =
      mine.placements === undefined && theirs.placements === undefined
        ? undefined
        : { ...(theirs.placements ?? {}), ...(mine.placements ?? {}) };
    merged[form] = {
      ...(worn !== undefined ? { worn } : {}),
      ...(placements !== undefined ? { placements } : {}),
    };
  }
  return merged;
}

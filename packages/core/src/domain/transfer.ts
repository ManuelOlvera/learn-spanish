import { isKidId } from "./kid";
import type { KidId } from "./kid";
import type { Streak } from "./daily";

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
  return {
    stickers,
    streaks: sanitizeKidRecord(candidate.streaks, isStreak),
    avatars: sanitizeKidRecord(
      candidate.avatars,
      (v): v is string => typeof v === "string" && v !== "",
    ),
  };
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

  return {
    stickers,
    streaks,
    avatars: { ...current.avatars, ...incoming.avatars },
  };
}

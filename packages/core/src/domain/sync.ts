import type { ProgressSnapshot } from "./transfer";

/**
 * Optional cross-device sync (ADR 004). A remote store holds one
 * `ProgressSnapshot` per pairing code; the code is a capability key — knowing
 * it is the only authorization, so there are no accounts. This port is
 * framework-agnostic; the concrete adapter (Supabase) lives in `apps/web`.
 */
export interface RemoteProgressStore {
  /** The snapshot stored for a code, or null when no row exists yet. */
  load(code: string): Promise<ProgressSnapshot | null>;
  /** Overwrite the snapshot stored for a code. */
  save(code: string, snapshot: ProgressSnapshot): Promise<void>;
  /** Remove the row for a code entirely; a no-op when it never existed. */
  delete(code: string): Promise<void>;
}

/** A random source returning one byte (0…255). Injected for testability. */
export type ByteSource = () => number;

/** Crockford base32 minus ambiguous glyphs (I, L, O, U) — 32 symbols, so one
 *  byte masked to 5 bits maps to exactly one symbol with no modulo bias. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const GROUP = 5;
const GROUPS = 4;
const LENGTH = GROUP * GROUPS; // 20 symbols ≈ 100 bits of capability entropy

/** Generate a high-entropy pairing code (the capability key), grouped for a
 *  parent to read/retype once, e.g. `A1B2C-3D4E5-F6G7H-8J9K0`. */
export function generatePairingCode(nextByte: ByteSource): string {
  let raw = "";
  for (let i = 0; i < LENGTH; i += 1) {
    raw += ALPHABET[nextByte() & 31];
  }
  return group(raw);
}

function group(raw: string): string {
  const parts: string[] = [];
  for (let i = 0; i < raw.length; i += GROUP) {
    parts.push(raw.slice(i, i + GROUP));
  }
  return parts.join("-");
}

/** Strip formatting and upper-case so any spacing/case a parent types maps to
 *  the one canonical code (also the remote row id). Returns "" if unusable. */
export function normalizePairingCode(input: string): string {
  const bare = input.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (bare.length !== LENGTH || ![...bare].every((c) => ALPHABET.includes(c))) {
    return "";
  }
  return group(bare);
}

export function isPairingCode(input: string): boolean {
  return normalizePairingCode(input) !== "";
}

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

/**
 * Strip formatting and upper-case so any spacing/case a parent types maps to
 * the one canonical code (also the remote row id). Returns "" if unusable.
 *
 * I, L and O fold onto 1, 1 and 0, which is the other half of choosing
 * Crockford base32: leaving them out of the alphabet is what makes the fold
 * unambiguous, and a generated code can never contain them, so this can never
 * collide. Without it, excluding them only helps a parent who was already
 * reading carefully — the one copying 20 symbols off another screen reads 0 as
 * O and 1 as I, gets "ese código no es válido", and retypes it identically.
 * (U stays invalid: Crockford excludes it with no mapping.)
 */
export function normalizePairingCode(input: string): string {
  const bare = input
    .toUpperCase()
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0")
    .replace(/[^0-9A-Z]/g, "");
  if (bare.length !== LENGTH || ![...bare].every((c) => ALPHABET.includes(c))) {
    return "";
  }
  return group(bare);
}

export function isPairingCode(input: string): boolean {
  return normalizePairingCode(input) !== "";
}

/** The fragment key carrying a pairing code in a shareable link. */
const LINK_PARAM = "sync";

/**
 * A link that both installs the app and hands over the pairing code, so a
 * second device joins by scanning instead of retyping 20 symbols.
 *
 * The code rides in the URL **fragment**, never the query: a fragment is not
 * sent to the server, so this capability key stays out of hosting request
 * logs. Returns "" when the code is malformed or the origin is empty — the
 * caller shows the typeable code alone rather than a link that pairs nothing.
 */
export function buildSyncLink(origin: string, code: string): string {
  const canonical = normalizePairingCode(code);
  const base = origin.replace(/\/+$/, "");
  if (canonical === "" || base === "") {
    return "";
  }
  return `${base}/#${LINK_PARAM}=${canonical}`;
}

/**
 * The pairing code carried by a scanned link, or "" when there isn't a valid
 * one. Accepts a full URL or a bare `location.hash`. A code in the *query*
 * string is ignored on purpose: honoring it would quietly bless the one link
 * shape that leaks the key to a server log.
 */
export function parseSyncLink(url: string): string {
  const hash = url.slice(url.indexOf("#") + 1);
  if (!url.includes("#") || hash === "") {
    return "";
  }
  for (const part of hash.split("&")) {
    const eq = part.indexOf("=");
    if (eq === -1 || part.slice(0, eq) !== LINK_PARAM) {
      continue;
    }
    return normalizePairingCode(safeDecode(part.slice(eq + 1)));
  }
  return "";
}

/** A hand-mangled link can carry a stray `%`, which throws in decodeURI. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

import { ALL_KIDS, isKidId } from "./kid";
import type { KidId } from "./kid";

/** Every completable activity that can earn a sticker. */
export type ActivityId =
  | "learn"
  | "quiz-listen"
  | "quiz-read"
  | "si-no-listen"
  | "si-no-read"
  | "match-pictures"
  | "match-words"
  | "connect-listen"
  | "connect-read"
  | "scene-listen"
  | "scene-read"
  | "frases-listen"
  | "frases-read"
  | "cuento-listen"
  | "cuento-read"
  // Sticker-less activities (stars/mission only — not album slots):
  | "counting-listen"
  | "counting-read"
  | "spelling"
  | "sopa"
  | "globo"
  | "hablar"
  | "adivina";

/** The activities every deck offers (frases are pack-wide, not per-deck). */
export const ALL_ACTIVITIES: readonly ActivityId[] = [
  "learn",
  "quiz-listen",
  "quiz-read",
  "si-no-listen",
  "si-no-read",
  "match-pictures",
  "match-words",
  "connect-listen",
  "connect-read",
  "scene-listen",
  "scene-read",
];

/** The pack-wide sentence activities; their sticker "deck" is SENTENCES_ID. */
export const SENTENCE_ACTIVITIES: readonly ActivityId[] = [
  "frases-listen",
  "frases-read",
];

export const SENTENCES_ID = "frases";

/** The pack-wide story activities; their sticker "deck" is STORIES_ID.
 *  Pack-wide like the sentences, not per-deck — nobody is writing 31 stories. */
export const STORY_ACTIVITIES: readonly ActivityId[] = [
  "cuento-listen",
  "cuento-read",
];

export const STORIES_ID = "cuento";

export function stickerId(
  kid: KidId,
  deckId: string,
  activity: ActivityId,
): string {
  return `${kid}:${deckId}:${activity}`;
}

/**
 * The album predates kid profiles: shared-era entries were "deck:activity".
 * Grant those to both kids so nobody loses stickers; drop anything malformed.
 */
export function upgradeLegacyStickers(
  ids: readonly string[],
): readonly string[] {
  const upgraded: string[] = [];
  for (const id of ids) {
    const parts = id.split(":");
    const candidates =
      parts.length === 3 && isKidId(parts[0]!)
        ? [id]
        : parts.length === 2
          ? ALL_KIDS.map((kid) => `${kid}:${id}`)
          : [];
    for (const candidate of candidates) {
      if (!upgraded.includes(candidate)) {
        upgraded.push(candidate);
      }
    }
  }
  return upgraded;
}

/** Where earned sticker ids live (the web app persists them on-device). */
export interface AlbumStore {
  load(): Promise<readonly string[]>;
  save(stickers: readonly string[]): Promise<void>;
}

/** Completion counts per sticker id — the tier system's ledger. */
export interface StickerCountsStore {
  load(): Promise<Readonly<Record<string, number>>>;
  save(counts: Readonly<Record<string, number>>): Promise<void>;
}

/** A sticker id is short; anything longer is corruption or a storage bomb. */
const MAX_STICKER_ID = 128;
/** Matches the transfer sanitizer's list cap — the same album, same ceiling. */
const MAX_STICKERS = 5_000;

/**
 * Rescue every usable sticker id from an untrusted stored album.
 *
 * The album reader used to accept the array only if *every* entry was a
 * string, so one corrupt entry threw away a child's whole collection. Salvage
 * per entry instead: a damaged document costs the damaged stickers and
 * nothing more. Runs *before* `upgradeLegacyStickers`, so it must not judge
 * id shape — legacy two-part ids are still valid input to the upgrader.
 */
export function salvageStickerIds(raw: unknown): readonly string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter(
      (id): id is string =>
        typeof id === "string" && id !== "" && id.length <= MAX_STICKER_ID,
    )
    .slice(0, MAX_STICKERS);
}

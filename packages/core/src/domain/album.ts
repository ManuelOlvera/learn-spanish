import { ALL_KIDS, isKidId } from "./kid";
import type { KidId } from "./kid";

/** Every completable activity that can earn a sticker, per deck. */
export type ActivityId =
  | "learn"
  | "quiz-listen"
  | "quiz-read"
  | "si-no-listen"
  | "si-no-read"
  | "match-pictures"
  | "match-words";

export const ALL_ACTIVITIES: readonly ActivityId[] = [
  "learn",
  "quiz-listen",
  "quiz-read",
  "si-no-listen",
  "si-no-read",
  "match-pictures",
  "match-words",
];

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

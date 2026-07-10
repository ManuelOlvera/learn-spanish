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

export function stickerId(deckId: string, activity: ActivityId): string {
  return `${deckId}:${activity}`;
}

/** Where earned sticker ids live (the web app persists them on-device). */
export interface AlbumStore {
  load(): Promise<readonly string[]>;
  save(stickers: readonly string[]): Promise<void>;
}

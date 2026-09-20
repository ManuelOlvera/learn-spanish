import type { ActivityId } from "./album";
import type { MemoryMode } from "./memory";
import type { QuizMode } from "./quiz";

/** The two difficulty profiles. Semantic, not personal — the app draws
 *  avatars on top of these; "listener" is the pre-reader. */
export type KidId = "listener" | "reader";

export const ALL_KIDS: readonly KidId[] = ["listener", "reader"];

export function isKidId(value: string): value is KidId {
  return (ALL_KIDS as readonly string[]).includes(value);
}

/**
 * The difficulty a profile plays at — **the thing `KidId` used to be**.
 *
 * Splitting the two apart is what roadmap 18 needed: the ids *are* the levels,
 * so a pre-reader who learns to read would have needed a second read-level
 * profile and the model had no way to say that. The ids stay exactly as they
 * are (every storage key, every sticker id and the whole snapshot keep
 * working, and the kids have always identified by 🦖 and 🦄 rather than by
 * these words); the level moves out into a field.
 */
export type KidLevel = "listen" | "read";

/** The level each id has always implied — the default when nothing is stored,
 *  which is why this ships with no migration. */
export const DEFAULT_LEVEL: Record<KidId, KidLevel> = {
  listener: "listen",
  reader: "read",
};

/**
 * A grown-up's decision about one profile, with when they made it.
 *
 * The timestamp is the merge rule, not decoration: this is the app's first
 * *reversible* synced field, so it cannot ride the additive merge everything
 * else uses (see ADR 023). Later wins, the same shape `weekProgress` and
 * `missions` already use for "a later day supersedes outright".
 */
export interface LevelChange {
  readonly level: KidLevel;
  /** Epoch ms. */
  readonly at: number;
}

export type KidLevels = Partial<Record<KidId, LevelChange>>;

export function levelFor(kid: KidId, levels: KidLevels = {}): KidLevel {
  return levels[kid]?.level ?? DEFAULT_LEVEL[kid];
}

/** Record a grown-up's change. Reversible on purpose — "she can read" is a
 *  judgement made over weeks, so promoting early must be undoable. */
export function promoteLevel(
  levels: KidLevels,
  kid: KidId,
  level: KidLevel,
  at: number,
): KidLevels {
  return { ...levels, [kid]: { level, at } };
}

/** Which mode each game plays at, for a level. */
export function gameModesFor(
  level: KidLevel,
): { readonly quiz: QuizMode; readonly match: MemoryMode } {
  return level === "read"
    ? { quiz: "read", match: "words" }
    : { quiz: "listen", match: "pictures" };
}

/** Which mode each game plays at for a kid at their default level.
 *  Prefer `gameModesFor(levelFor(kid, levels))` — this is the historical
 *  shape, kept for the surfaces that have no level to hand. */
export const KID_GAME_MODES: Record<
  KidId,
  { readonly quiz: QuizMode; readonly match: MemoryMode }
> = {
  listener: gameModesFor("listen"),
  reader: gameModesFor("read"),
};

/** The level a mode-specific activity belongs to; null for shared ones. */
export function levelForActivity(activity: ActivityId): KidLevel | null {
  if (activity === "learn") {
    return null;
  }
  return activity.endsWith("-listen") || activity.endsWith("-pictures")
    ? "listen"
    : "read";
}

/**
 * The same activity at the other level — `quiz-listen` ↔ `quiz-read`.
 *
 * This is the twin rule roadmap 18 turns on: a sticker earned at one level
 * satisfies its counterpart, so promoting a kid never costs her a medal, a
 * completed deck or her place on el camino. Null for an activity that belongs
 * to no level (`learn`), which is shared already.
 *
 * It is a **no-op for everyone today**: each profile has only ever earned its
 * own level's stickers, so a twin never exists to be found. That is what lets
 * it apply unconditionally, with no "was promoted" flag to store and drift.
 */
export function twinActivity(activity: ActivityId): ActivityId | null {
  const swaps: Readonly<Record<string, string>> = {
    "-listen": "-read",
    "-read": "-listen",
    "-pictures": "-words",
    "-words": "-pictures",
  };
  for (const [from, to] of Object.entries(swaps)) {
    if (activity.endsWith(from)) {
      return (activity.slice(0, -from.length) + to) as ActivityId;
    }
  }
  return null;
}

/** The kid a mode-specific activity belongs to **by default**; null for shared
 *  ones. Still the right answer for "no kid is selected, whose activity is
 *  this?" — it is an identity fallback, not a level question. */
export function kidForActivity(activity: ActivityId): KidId | null {
  const level = levelForActivity(activity);
  return level === null ? null : level === "listen" ? "listener" : "reader";
}

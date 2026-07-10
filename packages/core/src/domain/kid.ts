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

/** Which mode each game plays at for a kid. */
export const KID_GAME_MODES: Record<
  KidId,
  { readonly quiz: QuizMode; readonly match: MemoryMode }
> = {
  listener: { quiz: "listen", match: "pictures" },
  reader: { quiz: "read", match: "words" },
};

/** The kid a mode-specific activity belongs to; null for shared ones (learn). */
export function kidForActivity(activity: ActivityId): KidId | null {
  if (activity === "learn") {
    return null;
  }
  return activity.endsWith("-listen") || activity.endsWith("-pictures")
    ? "listener"
    : "reader";
}

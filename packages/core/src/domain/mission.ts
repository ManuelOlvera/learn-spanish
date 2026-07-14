import { dayKey } from "./daily";
import type { KidId } from "./kid";
import type { ActivityId } from "./album";

/** La misión del día: three activity kinds to complete, new every day,
 *  different per kid, +MISSION_BONUS stars from the bonus chest. */
export type MissionKind =
  | "learn"
  | "quiz"
  | "si-no"
  | "match"
  | "connect"
  | "scene"
  | "frases"
  | "duel"
  | "counting"
  | "spelling"
  | "sopa"
  | "reto";

/** Kinds either kid can complete at their own difficulty. Reto stays out for
 *  both: it's timed, and the misión must be pressure-free. */
const SHARED_KINDS: readonly MissionKind[] = [
  "learn",
  "quiz",
  "si-no",
  "match",
  "connect",
  "scene",
  "frases",
  "duel",
  "counting",
];

/** Each kid draws from their own pool: the reader's adds spelling and the
 *  sopa de letras (reading practice a pre-reader can't do), so the misión
 *  leans into what that kid is actually working on. */
const KIND_POOLS: Record<KidId, readonly MissionKind[]> = {
  listener: SHARED_KINDS,
  reader: [...SHARED_KINDS, "spelling", "sopa"],
};

export const MISSION_SIZE = 3;

export interface MissionState {
  readonly day: string;
  readonly done: readonly MissionKind[];
  readonly claimed: boolean;
}

/** Which mission kind an activity feeds. */
export function activityKind(activity: ActivityId): MissionKind {
  if (!activity.includes("-")) {
    return activity as MissionKind;
  }
  const game = activity.slice(0, activity.lastIndexOf("-"));
  return game as MissionKind;
}

/** Deterministic for (day, kid): FNV-1a seeds a small PRNG over the kinds. */
export function dailyMission(date: Date, kid: KidId): readonly MissionKind[] {
  let hash = 0x811c9dc5;
  for (const char of `${dayKey(date)}:${kid}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  const kinds = [...KIND_POOLS[kid]];
  const picked: MissionKind[] = [];
  for (let i = 0; i < MISSION_SIZE; i++) {
    hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
    hash = Math.imul(hash ^ (hash >>> 12), 0x297a2d39) ^ (hash >>> 16);
    picked.push(kinds.splice((hash >>> 0) % kinds.length, 1)[0]!);
  }
  return picked;
}

export function markMissionDone(
  state: MissionState | null,
  today: string,
  kind: MissionKind,
): MissionState {
  const current =
    state !== null && state.day === today
      ? state
      : { day: today, done: [] as readonly MissionKind[], claimed: false };
  if (current.done.includes(kind)) {
    return current;
  }
  return { ...current, done: [...current.done, kind] };
}

export function missionComplete(
  state: MissionState | null,
  mission: readonly MissionKind[],
): boolean {
  return state !== null && mission.every((kind) => state.done.includes(kind));
}

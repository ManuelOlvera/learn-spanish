import { dayKey } from "../domain/daily";
import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { dailyMission, missionComplete } from "../domain/mission";
import type { MissionKind, MissionState } from "../domain/mission";

/** Today's misión as the UI shows it: the kinds to do, where the kid stands,
 *  and whether it's complete. */
export interface MissionView {
  readonly kinds: readonly MissionKind[];
  readonly state: MissionState;
  readonly complete: boolean;
}

/** Today's misión view. A stored state from another day reads as a fresh,
 *  untouched misión — the stored record is only overwritten on progress.
 *  Shared by the claim/mark use cases so they judge the same view the UI shows. */
export function missionView(
  store: EconomyStore,
  kid: KidId,
  now: Date,
): MissionView {
  const today = dayKey(now);
  const kinds = dailyMission(now, kid);
  const stored = store.loadMission(kid);
  const state =
    stored !== null && stored.day === today
      ? stored
      : { day: today, done: [] as readonly MissionKind[], claimed: false };
  return { kinds, state, complete: missionComplete(state, kinds) };
}

export class GetMissionUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, now: Date): MissionView {
    return missionView(this.store, kid, now);
  }
}

import { dayKey } from "../domain/daily";
import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { dailyMission, markMissionDone, missionComplete } from "../domain/mission";
import type { MissionKind } from "../domain/mission";
import { markActiveDay, weekKey } from "../domain/weekly";
import type { MissionView } from "./get-mission";

/**
 * Record one finished activity kind against today's misión — and, the moment
 * the misión completes, cascade today into the weekly streak's active days
 * (that cascade is the whole reason the misión feeds retention). Idempotent
 * per kind and per day.
 */
export class MarkActivityDoneUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, kind: MissionKind, now: Date): MissionView {
    const today = dayKey(now);
    const state = markMissionDone(this.store.loadMission(kid), today, kind);
    this.store.saveMission(kid, state);
    const kinds = dailyMission(now, kid);
    const complete = missionComplete(state, kinds);
    if (complete) {
      this.store.saveWeekProgress(
        kid,
        markActiveDay(this.store.loadWeekProgress(kid), weekKey(now), today),
      );
    }
    return { kinds, state, complete };
  }
}

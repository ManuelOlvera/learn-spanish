import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";
import { MISSION_BONUS } from "../domain/stars";
import { missionView } from "./get-mission";
import { bankStars } from "./earn-stars";

/** The +10⭐ misión chest: pays once per day, only on a complete misión.
 *  Returns the new balance, or null when there is nothing to claim. */
export class ClaimMissionBonusUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, now: Date): number | null {
    const mission = missionView(this.store, kid, now);
    if (!mission.complete || mission.state.claimed) {
      return null;
    }
    this.store.saveMission(kid, { ...mission.state, claimed: true });
    return bankStars(this.store, kid, MISSION_BONUS);
  }
}

import { activeBoost, type Boost } from "../domain/boost";
import type { EconomyStore } from "../domain/economy";
import type { KidId } from "../domain/kid";

/** The ⚡ hora doble currently paying for a kid, or null. Expiry is decided
 *  here on read, so a closed window needs no cleanup write and a device that
 *  was asleep through the whole thing still reads it as over. */
export class GetBoostUseCase {
  constructor(private readonly store: EconomyStore) {}

  execute(kid: KidId, now: Date): Boost | null {
    return activeBoost(this.store.loadBoost(kid), now);
  }
}

import type { Streak, StreakStore } from "../domain/daily";
import type { KidId } from "../domain/kid";

export class GetStreakUseCase {
  constructor(private readonly streaks: StreakStore) {}

  execute(kid: KidId): Promise<Streak | null> {
    return this.streaks.load(kid);
  }
}

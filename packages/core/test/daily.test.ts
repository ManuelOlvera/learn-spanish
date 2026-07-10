import { describe, expect, it } from "vitest";
import { advanceStreak, dailyCard, dayKey } from "../src/domain/daily";
import type { Streak, StreakStore } from "../src/domain/daily";
import type { KidId } from "../src/domain/kid";
import { FeedStreakUseCase } from "../src/application/feed-streak";
import { deckOf } from "./helpers";

const decks = [deckOf(12), { ...deckOf(10), id: "other-deck" }];

describe("dayKey", () => {
  it("formats a date as YYYY-MM-DD in UTC", () => {
    expect(dayKey(new Date("2026-07-10T23:59:00Z"))).toBe("2026-07-10");
    expect(dayKey(new Date("2026-01-02T00:00:00Z"))).toBe("2026-01-02");
  });
});

describe("dailyCard", () => {
  it("picks the same card all day", () => {
    const a = dailyCard(decks, new Date("2026-07-10T08:00:00Z"));
    const b = dailyCard(decks, new Date("2026-07-10T20:30:00Z"));
    expect(a.id).toBe(b.id);
  });

  it("picks from the combined pack", () => {
    const all = new Set(decks.flatMap((d) => d.cards.map((c) => c.id)));
    const card = dailyCard(decks, new Date("2026-07-10T08:00:00Z"));
    expect(all.has(card.id)).toBe(true);
  });

  it("varies across days", () => {
    const picks = new Set<string>();
    for (let day = 1; day <= 14; day++) {
      const date = new Date(`2026-07-${String(day).padStart(2, "0")}T12:00:00Z`);
      picks.add(dailyCard(decks, date).id);
    }
    expect(picks.size).toBeGreaterThan(1);
  });
});

describe("advanceStreak", () => {
  it("starts a streak on first play", () => {
    expect(advanceStreak(null, "2026-07-10")).toEqual({
      day: "2026-07-10",
      count: 1,
    });
  });

  it("does not grow twice on the same day", () => {
    const streak = { day: "2026-07-10", count: 3 };
    expect(advanceStreak(streak, "2026-07-10")).toEqual(streak);
  });

  it("grows on the next calendar day", () => {
    expect(advanceStreak({ day: "2026-07-10", count: 3 }, "2026-07-11")).toEqual(
      { day: "2026-07-11", count: 4 },
    );
  });

  it("grows across a month boundary", () => {
    expect(advanceStreak({ day: "2026-07-31", count: 1 }, "2026-08-01")).toEqual(
      { day: "2026-08-01", count: 2 },
    );
  });

  it("resets to 1 after a missed day", () => {
    expect(advanceStreak({ day: "2026-07-10", count: 9 }, "2026-07-12")).toEqual(
      { day: "2026-07-12", count: 1 },
    );
  });
});

class FakeStreakStore implements StreakStore {
  public saves = 0;
  constructor(private streaks: Partial<Record<KidId, Streak>> = {}) {}
  load(kid: KidId): Promise<Streak | null> {
    return Promise.resolve(this.streaks[kid] ?? null);
  }
  save(kid: KidId, streak: Streak): Promise<void> {
    this.streaks[kid] = streak;
    this.saves += 1;
    return Promise.resolve();
  }
}

describe("FeedStreakUseCase", () => {
  it("persists a grown streak per kid", async () => {
    const store = new FakeStreakStore({
      listener: { day: "2026-07-09", count: 2 },
    });
    const feed = new FeedStreakUseCase(store);
    const result = await feed.execute("listener", new Date("2026-07-10T12:00:00Z"));
    expect(result).toEqual({ day: "2026-07-10", count: 3 });
    await expect(store.load("listener")).resolves.toEqual(result);
    await expect(store.load("reader")).resolves.toBeNull();
  });

  it("does not save again on the same day", async () => {
    const store = new FakeStreakStore({
      reader: { day: "2026-07-10", count: 5 },
    });
    const feed = new FeedStreakUseCase(store);
    const result = await feed.execute("reader", new Date("2026-07-10T20:00:00Z"));
    expect(result.count).toBe(5);
    expect(store.saves).toBe(0);
  });
});

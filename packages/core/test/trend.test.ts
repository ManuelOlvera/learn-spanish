import { describe, expect, it } from "vitest";
import {
  isLearnedStat,
  learnedCount,
  learnedThisWeek,
  recordSample,
  TREND_WEEKS_CAP,
} from "../src/domain/trend";
import type { TrendHistory, TrendStore } from "../src/domain/trend";
import type { KidId } from "../src/domain/kid";
import type { WordStats, WordStatsStore } from "../src/domain/word-stats";
import { SampleTrendUseCase } from "../src/application/sample-trend";

describe("isLearnedStat / learnedCount", () => {
  it("counts words with a right answer that are not struggling", () => {
    // Same bar as the informe's palabras fuertes: right > 0, weakScore <= 0.
    expect(isLearnedStat({ right: 1, wrong: 0 })).toBe(true);
    expect(isLearnedStat({ right: 2, wrong: 1 })).toBe(true); // 2*1-2 = 0
    expect(isLearnedStat({ right: 0, wrong: 0 })).toBe(false); // never right
    expect(isLearnedStat({ right: 1, wrong: 1 })).toBe(false); // struggling
    const stats: WordStats = {
      perro: { right: 3, wrong: 0 },
      gato: { right: 1, wrong: 2 },
      vaca: { right: 0, wrong: 0 },
    };
    expect(learnedCount(stats)).toBe(1);
  });
});

describe("recordSample", () => {
  it("appends a new week and overwrites a re-sampled one", () => {
    let history: TrendHistory = [];
    history = recordSample(history, "2026-07-06", 5);
    history = recordSample(history, "2026-07-13", 8);
    history = recordSample(history, "2026-07-13", 9); // later look, same week
    expect(history).toEqual([
      { week: "2026-07-06", learned: 5 },
      { week: "2026-07-13", learned: 9 },
    ]);
  });

  it("keeps weeks sorted even when sampled out of order", () => {
    let history: TrendHistory = [{ week: "2026-07-13", learned: 8 }];
    history = recordSample(history, "2026-07-06", 5);
    expect(history.map((s) => s.week)).toEqual(["2026-07-06", "2026-07-13"]);
  });

  it("caps the history at the newest TREND_WEEKS_CAP samples", () => {
    let history: TrendHistory = [];
    for (let i = 0; i < TREND_WEEKS_CAP + 3; i++) {
      const week = `2026-${String(i + 10).padStart(2, "0")}-01`; // sortable fake keys
      history = recordSample(history, week, i);
    }
    expect(history).toHaveLength(TREND_WEEKS_CAP);
    expect(history[0]!.learned).toBe(3); // the three oldest dropped
  });
});

describe("learnedThisWeek", () => {
  it("is the delta between the two newest samples, floored at zero", () => {
    expect(
      learnedThisWeek([
        { week: "2026-07-06", learned: 5 },
        { week: "2026-07-13", learned: 9 },
      ]),
    ).toBe(4);
    // Stats can only grow, but a corrupt sample must not show negative growth.
    expect(
      learnedThisWeek([
        { week: "2026-07-06", learned: 9 },
        { week: "2026-07-13", learned: 5 },
      ]),
    ).toBe(0);
  });

  it("is null with fewer than two samples (nothing to compare)", () => {
    expect(learnedThisWeek([])).toBeNull();
    expect(learnedThisWeek([{ week: "2026-07-13", learned: 8 }])).toBeNull();
  });
});

class FakeTrendStore implements TrendStore {
  histories: Partial<Record<KidId, TrendHistory>> = {};
  load(kid: KidId) { return this.histories[kid] ?? []; }
  save(kid: KidId, history: TrendHistory) { this.histories[kid] = history; }
}

class FakeWordStatsStore implements WordStatsStore {
  constructor(private stats: Partial<Record<KidId, WordStats>> = {}) {}
  load(kid: KidId) { return Promise.resolve(this.stats[kid] ?? {}); }
  save() { return Promise.resolve(); }
}

describe("SampleTrendUseCase", () => {
  it("records this week's cumulative learned count and returns the history", async () => {
    const trend = new FakeTrendStore();
    const stats = new FakeWordStatsStore({
      listener: { perro: { right: 3, wrong: 0 }, gato: { right: 2, wrong: 0 } },
    });
    const sample = new SampleTrendUseCase(trend, stats);
    const history = await sample.execute("listener", new Date("2026-07-15T10:00:00"));
    expect(history).toEqual([{ week: "2026-07-13", learned: 2 }]);
    expect(trend.load("listener")).toEqual(history);
  });

  it("re-sampling the same week overwrites, not appends", async () => {
    const trend = new FakeTrendStore();
    trend.save("reader", [{ week: "2026-07-13", learned: 1 }]);
    const stats = new FakeWordStatsStore({
      reader: { sol: { right: 1, wrong: 0 } },
    });
    const history = await new SampleTrendUseCase(trend, stats).execute(
      "reader",
      new Date("2026-07-16T18:00:00"),
    );
    expect(history).toEqual([{ week: "2026-07-13", learned: 1 }]);
    expect(history).toHaveLength(1);
  });
});

import { describe, expect, it } from "vitest";
import {
  isLearnedStat,
  LEARNED_MIN_RIGHT,
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
  it("counts words answered right enough times and not struggling", () => {
    expect(isLearnedStat({ right: 2, wrong: 0 })).toBe(true);
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

  it("does not call one lucky tap 'learned'", () => {
    // A quiz round shows three pictures: one right answer is a 1-in-3 guess.
    // This was the old bar, and it inflated every number built on top of it.
    expect(isLearnedStat({ right: 1, wrong: 0 })).toBe(false);
    expect(LEARNED_MIN_RIGHT).toBeGreaterThan(1);
    expect(learnedCount({ suerte: { right: 1, wrong: 0 } })).toBe(0);
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

  it("backfills skipped weeks flat, so a gap can't read as one week", () => {
    // The bug: samples a month apart were drawn as adjacent bars and their
    // delta labelled "esta semana".
    let history: TrendHistory = recordSample([], "2026-07-06", 5);
    history = recordSample(history, "2026-08-03", 9);
    expect(history).toEqual([
      { week: "2026-07-06", learned: 5 },
      { week: "2026-07-13", learned: 5 },
      { week: "2026-07-20", learned: 5 },
      { week: "2026-07-27", learned: 5 },
      { week: "2026-08-03", learned: 9 },
    ]);
    // …and the headline now means what it says.
    expect(learnedThisWeek(history)).toBe(4);
  });

  it("adds no filler between consecutive weeks", () => {
    let history: TrendHistory = recordSample([], "2026-07-06", 5);
    history = recordSample(history, "2026-07-13", 6);
    expect(history).toHaveLength(2);
  });

  it("does not spin when a device clock jumps backwards", () => {
    let history: TrendHistory = recordSample([], "2026-08-03", 9);
    history = recordSample(history, "2026-07-06", 5);
    expect(history.map((s) => s.week)).toEqual(["2026-07-06", "2026-08-03"]);
  });

  it("caps the history at the newest TREND_WEEKS_CAP samples", () => {
    let history: TrendHistory = [];
    const monday = new Date("2026-01-05T00:00:00Z"); // a real Monday
    for (let i = 0; i < TREND_WEEKS_CAP + 3; i++) {
      const week = new Date(monday);
      week.setUTCDate(week.getUTCDate() + i * 7);
      history = recordSample(history, week.toISOString().slice(0, 10), i);
    }
    expect(history).toHaveLength(TREND_WEEKS_CAP);
    expect(history[0]!.learned).toBe(3); // the three oldest dropped
  });

  it("drops an unparseable week key from stored history", () => {
    // The history is read off localStorage. A corrupt key sorts after every
    // real one, so keeping it would make garbage the newest sample and the
    // "esta semana" delta meaningless — and it must never throw.
    const history = recordSample(
      [
        { week: "2026-07-27", learned: 4 },
        { week: "not-a-date", learned: 999 },
      ],
      "2026-08-03",
      6,
    );
    expect(history).toEqual([
      { week: "2026-07-27", learned: 4 },
      { week: "2026-08-03", learned: 6 },
    ]);
    expect(learnedThisWeek(history)).toBe(2);
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
      reader: { sol: { right: 2, wrong: 0 } },
    });
    const history = await new SampleTrendUseCase(trend, stats).execute(
      "reader",
      new Date("2026-07-16T18:00:00"),
    );
    expect(history).toEqual([{ week: "2026-07-13", learned: 1 }]);
    expect(history).toHaveLength(1);
  });
});

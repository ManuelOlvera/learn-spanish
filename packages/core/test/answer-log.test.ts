import { describe, expect, it } from "vitest";
import {
  accuracyByGame,
  appendAnswer,
  LOG_RETENTION_DAYS,
  MAX_LOG_EVENTS,
  practiceDays,
  practiceSummary,
  pruneLog,
  SESSION_GAP_MINUTES,
} from "../src/domain/answer-log";
import type {
  AnswerEvent,
  AnswerLog,
  AnswerLogStore,
} from "../src/domain/answer-log";
import { RecordAnswerUseCase } from "../src/application/record-answer";
import type { KidId } from "../src/domain/kid";
import type { WordStats, WordStatsStore } from "../src/domain/word-stats";

const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;
const NOW = new Date("2026-08-03T18:00:00");

function event(overrides: Partial<AnswerEvent> = {}): AnswerEvent {
  return {
    at: NOW.getTime(),
    activity: "quiz-listen",
    cardId: "perro",
    correct: true,
    ...overrides,
  };
}

describe("appendAnswer / pruneLog", () => {
  it("appends in time order", () => {
    let log: AnswerLog = [];
    log = appendAnswer(log, event({ cardId: "a" }), NOW);
    log = appendAnswer(log, event({ cardId: "b", at: NOW.getTime() + MIN }), NOW);
    expect(log.map((e) => e.cardId)).toEqual(["a", "b"]);
  });

  it("drops events older than the retention window", () => {
    const stale = event({ at: NOW.getTime() - (LOG_RETENTION_DAYS + 1) * DAY });
    const fresh = event({ at: NOW.getTime() - DAY });
    expect(pruneLog([stale, fresh], NOW)).toEqual([fresh]);
  });

  it("keeps an event exactly on the retention boundary", () => {
    const edge = event({ at: NOW.getTime() - (LOG_RETENTION_DAYS - 1) * DAY });
    expect(pruneLog([edge], NOW)).toEqual([edge]);
  });

  it("prunes on append, so the log can't grow past the window on its own", () => {
    const stale = event({ at: NOW.getTime() - 200 * DAY });
    const log = appendAnswer([stale], event(), NOW);
    expect(log).toHaveLength(1);
    expect(log[0]!.at).toBe(NOW.getTime());
  });

  it("caps runaway growth inside the window, keeping the newest", () => {
    // The date window is the policy; this is the backstop for a device that
    // plays far more than any child could.
    const total = MAX_LOG_EVENTS + 50;
    const many = Array.from({ length: total }, (_, i) =>
      event({ at: NOW.getTime() - (total - i) * MIN, cardId: `c${i}` }),
    );
    const log = appendAnswer(many, event({ cardId: "newest" }), NOW);
    expect(log).toHaveLength(MAX_LOG_EVENTS);
    expect(log[log.length - 1]!.cardId).toBe("newest");
  });

  it("tolerates a stored event with a broken timestamp", () => {
    const broken = { ...event(), at: Number.NaN };
    expect(pruneLog([broken, event()], NOW)).toEqual([event()]);
  });
});

describe("accuracyByGame", () => {
  const log: AnswerLog = [
    event({ activity: "quiz-listen", correct: true }),
    event({ activity: "quiz-listen", correct: true }),
    event({ activity: "quiz-listen", correct: false }),
    event({ activity: "quiz-listen", correct: true }),
    event({ activity: "globo", correct: false }),
    event({ activity: "globo", correct: false }),
  ];

  it("reports hits, answers and a ratio per game", () => {
    const [quiz, globo] = accuracyByGame(log);
    expect(quiz).toEqual({
      activity: "quiz-listen",
      answers: 4,
      right: 3,
      accuracy: 0.75,
    });
    expect(globo).toEqual({
      activity: "globo",
      answers: 2,
      right: 0,
      accuracy: 0,
    });
  });

  it("sorts by most answered, so the games they actually play lead", () => {
    expect(accuracyByGame(log).map((g) => g.activity)).toEqual([
      "quiz-listen",
      "globo",
    ]);
  });

  it("omits games with no answers rather than showing a 0% that isn't real", () => {
    // A game nobody played has no accuracy — that is different from 0%.
    expect(accuracyByGame([]).length).toBe(0);
    expect(accuracyByGame(log).some((g) => g.activity === "sopa")).toBe(false);
  });
});

describe("practiceDays", () => {
  it("counts answers per local day", () => {
    const log: AnswerLog = [
      event({ at: new Date("2026-08-01T09:00:00").getTime() }),
      event({ at: new Date("2026-08-01T20:00:00").getTime() }),
      event({ at: new Date("2026-08-03T09:00:00").getTime() }),
    ];
    const days = practiceDays(log);
    expect(days.get("2026-08-01")?.answers).toBe(2);
    expect(days.get("2026-08-03")?.answers).toBe(1);
    expect(days.has("2026-08-02")).toBe(false); // a day with no play is absent
  });

  it("measures a sitting as the span of answers close together", () => {
    const start = new Date("2026-08-01T09:00:00").getTime();
    const log: AnswerLog = [
      event({ at: start }),
      event({ at: start + 4 * MIN }),
      event({ at: start + 9 * MIN }),
    ];
    expect(practiceDays(log).get("2026-08-01")?.minutes).toBe(9);
  });

  it("splits a long gap into two sittings instead of one long one", () => {
    const start = new Date("2026-08-01T09:00:00").getTime();
    const gap = (SESSION_GAP_MINUTES + 5) * MIN;
    const log: AnswerLog = [
      event({ at: start }),
      event({ at: start + 5 * MIN }), // 5-minute sitting
      event({ at: start + 5 * MIN + gap }),
      event({ at: start + 11 * MIN + gap }), // 6-minute sitting
    ];
    const day = practiceDays(log).get("2026-08-01");
    expect(day?.minutes).toBe(11); // 5 + 6, not the 36-minute span
    expect(day?.sittings).toBe(2);
  });

  it("gives a single-answer day a floor of one minute, never zero", () => {
    expect(practiceDays([event()]).get("2026-08-03")?.minutes).toBe(1);
  });
});

describe("RecordAnswerUseCase", () => {
  class FakeStats implements WordStatsStore {
    stats: Partial<Record<KidId, WordStats>> = {};
    load(kid: KidId) {
      return Promise.resolve(this.stats[kid] ?? {});
    }
    save(kid: KidId, value: WordStats) {
      this.stats[kid] = value;
      return Promise.resolve();
    }
  }
  class FakeLog implements AnswerLogStore {
    logs: Partial<Record<KidId, AnswerLog>> = {};
    load(kid: KidId) {
      return this.logs[kid] ?? [];
    }
    save(kid: KidId, log: AnswerLog) {
      this.logs[kid] = log;
    }
  }

  it("tallies the word and logs the answer with its game and time", async () => {
    const stats = new FakeStats();
    const log = new FakeLog();
    await new RecordAnswerUseCase(stats, log, () => NOW).execute({
      kid: "listener",
      cardId: "perro",
      correct: true,
      activity: "globo",
    });
    expect(stats.stats.listener).toEqual({ perro: { right: 1, wrong: 0 } });
    expect(log.logs.listener).toEqual([
      { at: NOW.getTime(), activity: "globo", cardId: "perro", correct: true },
    ]);
  });

  it("still forgives a prior miss in review mode", async () => {
    const stats = new FakeStats();
    stats.stats.reader = { sol: { right: 0, wrong: 2 } };
    await new RecordAnswerUseCase(stats, new FakeLog(), () => NOW).execute({
      kid: "reader",
      cardId: "sol",
      correct: true,
      activity: "quiz-read",
      review: true,
    });
    expect(stats.stats.reader).toEqual({ sol: { right: 1, wrong: 1 } });
  });

  it("keeps each kid's log to itself", async () => {
    const log = new FakeLog();
    const use = new RecordAnswerUseCase(new FakeStats(), log, () => NOW);
    await use.execute({
      kid: "listener",
      cardId: "perro",
      correct: true,
      activity: "learn",
    });
    await use.execute({
      kid: "reader",
      cardId: "gato",
      correct: false,
      activity: "sopa",
    });
    expect(log.logs.listener).toHaveLength(1);
    expect(log.logs.reader).toHaveLength(1);
    expect(log.logs.reader![0]!.cardId).toBe("gato");
  });

  it("prunes the window as it writes, so the log self-limits", async () => {
    const log = new FakeLog();
    log.logs.listener = [
      event({ at: NOW.getTime() - (LOG_RETENTION_DAYS + 5) * DAY }),
    ];
    await new RecordAnswerUseCase(new FakeStats(), log, () => NOW).execute({
      kid: "listener",
      cardId: "perro",
      correct: true,
      activity: "learn",
    });
    expect(log.logs.listener).toHaveLength(1);
    expect(log.logs.listener![0]!.at).toBe(NOW.getTime());
  });
});

describe("practiceSummary", () => {
  it("totals the window a parent is looking at", () => {
    const start = new Date("2026-08-01T09:00:00").getTime();
    const log: AnswerLog = [
      event({ at: start }),
      event({ at: start + 6 * MIN }),
      event({ at: start + DAY, correct: false }),
    ];
    expect(practiceSummary(log)).toEqual({
      answers: 3,
      right: 2,
      activeDays: 2,
      minutes: 7, // 6-minute sitting + a 1-minute floor
      longestSittingMinutes: 6,
    });
  });

  it("reports the LONGEST sitting, not the average of them", () => {
    const start = new Date("2026-08-01T09:00:00").getTime();
    const gap = (SESSION_GAP_MINUTES + 5) * MIN;
    const log: AnswerLog = [
      event({ at: start }),
      event({ at: start + 2 * MIN }), // 2-minute sitting
      event({ at: start + 2 * MIN + gap }),
      event({ at: start + 12 * MIN + gap }), // 10-minute sitting
    ];
    expect(practiceSummary(log).longestSittingMinutes).toBe(10); // not 6
  });

  it("is all zeroes on an empty log, not NaN", () => {
    expect(practiceSummary([])).toEqual({
      answers: 0,
      right: 0,
      activeDays: 0,
      minutes: 0,
      longestSittingMinutes: 0,
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  EXAM_HISTORY_LIMIT,
  EXAM_PASS_MARK,
  examHistory,
  mergeExamSittings,
  recordExamScore,
  sanitizeExamRecords,
  type ExamRecords,
} from "../src/domain/exam";
import {
  decodeProgress,
  encodeProgress,
  mergeProgress,
  sanitizeSnapshot,
} from "../src/domain/transfer";
import type { ProgressSnapshot } from "../src/domain/transfer";

const base: ProgressSnapshot = { stickers: [], streaks: {}, avatars: {} };

/** A fixed clock, so a test never depends on how fast it runs. */
const T = Date.UTC(2026, 8, 19, 9, 0, 0);
const minute = 60_000;

describe("recording a sitting (ADR 022's history addendum)", () => {
  it("appends the sitting to the shelf's history", () => {
    const records = recordExamScore({}, "g1", 4, T);
    expect(examHistory(records.g1)).toEqual([{ at: T, score: 4 }]);
  });

  it("keeps every sitting, not just the best", () => {
    let records: ExamRecords = {};
    records = recordExamScore(records, "g1", 4, T);
    records = recordExamScore(records, "g1", 9, T + minute);
    records = recordExamScore(records, "g1", 2, T + 2 * minute);
    expect(examHistory(records.g1).map((s) => s.score)).toEqual([4, 9, 2]);
  });

  it("leaves the two counters behaving exactly as ADR 022 fixed them", () => {
    let records: ExamRecords = {};
    records = recordExamScore(records, "g1", 4, T);
    records = recordExamScore(records, "g1", 9, T + minute);
    records = recordExamScore(records, "g1", 2, T + 2 * minute);
    expect(records.g1?.bestScore).toBe(9);
    expect(records.g1?.attempts).toBe(3);
  });

  it("keeps each shelf's history to itself", () => {
    let records: ExamRecords = {};
    records = recordExamScore(records, "g1", 7, T);
    records = recordExamScore(records, "g2", 3, T + minute);
    expect(examHistory(records.g1).map((s) => s.score)).toEqual([7]);
    expect(examHistory(records.g2).map((s) => s.score)).toEqual([3]);
  });

  it("drops the oldest sitting past the cap while attempts keeps counting", () => {
    let records: ExamRecords = {};
    const sittings = EXAM_HISTORY_LIMIT + 3;
    for (let i = 0; i < sittings; i += 1) {
      records = recordExamScore(records, "g1", i, T + i * minute);
    }
    const history = examHistory(records.g1);
    expect(history).toHaveLength(EXAM_HISTORY_LIMIT);
    // The window is the most recent ones — the first three have fallen off.
    expect(history[0]?.score).toBe(3);
    expect(history.at(-1)?.score).toBe(sittings - 1);
    // ...but the lifetime total is still the truth (ADR 022).
    expect(records.g1?.attempts).toBe(sittings);
  });

  it("reads an absent history as no sittings, not as a crash", () => {
    expect(examHistory(undefined)).toEqual([]);
    expect(examHistory({ bestScore: 9, attempts: 2 })).toEqual([]);
  });

  it("has nothing to merge when neither side has sat it", () => {
    // The empty case is what lets every writer omit the key entirely, which is
    // what keeps a pre-history record byte-identical on the wire.
    expect(mergeExamSittings([], [])).toEqual([]);
  });
});

describe("merging two devices' sittings", () => {
  const tablet = [
    { at: T, score: 4 },
    { at: T + minute, score: 9 },
  ];
  const phone = [{ at: T + 2 * minute, score: 6 }];

  it("unions sittings neither device has seen", () => {
    expect(mergeExamSittings(tablet, phone).map((s) => s.score)).toEqual([4, 9, 6]);
  });

  it("is order-independent, the property max-merge gave for free", () => {
    expect(mergeExamSittings(tablet, phone)).toEqual(mergeExamSittings(phone, tablet));
  });

  it("does not duplicate on a re-merge", () => {
    expect(mergeExamSittings(tablet, tablet)).toEqual(tablet);
  });

  it("orders by when it happened, not by which device sent it", () => {
    const merged = mergeExamSittings(phone, tablet);
    expect(merged.map((s) => s.at)).toEqual([T, T + minute, T + 2 * minute]);
  });

  it("keeps the higher score when two sittings claim the same instant", () => {
    // A collision is near-impossible, but the tie-break has to be commutative
    // or the merge stops being order-independent.
    const a = [{ at: T, score: 3 }];
    const b = [{ at: T, score: 8 }];
    expect(mergeExamSittings(a, b)).toEqual([{ at: T, score: 8 }]);
    expect(mergeExamSittings(b, a)).toEqual([{ at: T, score: 8 }]);
  });

  it("trims to the cap after the union, so the result cannot grow unbounded", () => {
    const mine = Array.from({ length: EXAM_HISTORY_LIMIT }, (_, i) => ({
      at: T + i * minute,
      score: 1,
    }));
    const theirs = Array.from({ length: EXAM_HISTORY_LIMIT }, (_, i) => ({
      at: T + (i + 100) * minute,
      score: 2,
    }));
    expect(mergeExamSittings(mine, theirs)).toHaveLength(EXAM_HISTORY_LIMIT);
    // Truncating after the union is what makes it deterministic: a stale peer
    // can resurrect an old sitting, and it is dropped again to the same result.
    expect(mergeExamSittings(mine, theirs)).toEqual(mergeExamSittings(theirs, mine));
  });
});

describe("exam history on the wire", () => {
  it("carries a device's sittings across a merge", () => {
    const merged = mergeProgress(
      {
        ...base,
        examRecords: {
          listener: {
            g1: { bestScore: 9, attempts: 1, history: [{ at: T, score: 9 }] },
          },
        },
      },
      {
        ...base,
        examRecords: {
          listener: {
            g1: { bestScore: 4, attempts: 1, history: [{ at: T + minute, score: 4 }] },
          },
        },
      },
    );
    expect(merged.examRecords?.listener?.g1?.history?.map((s) => s.score)).toEqual([
      9, 4,
    ]);
    // The counters are untouched by any of this.
    expect(merged.examRecords?.listener?.g1?.bestScore).toBe(9);
  });

  it("leaves a pre-history record with no history key at all", () => {
    const merged = mergeProgress(
      { ...base, examRecords: { listener: { g1: { bestScore: 10, attempts: 3 } } } },
      { ...base, examRecords: { listener: { g1: { bestScore: 0, attempts: 1 } } } },
    );
    expect(merged.examRecords?.listener?.g1).toEqual({ bestScore: 10, attempts: 3 });
  });

  it("survives a transfer code round trip", () => {
    const snapshot: ProgressSnapshot = {
      ...base,
      examRecords: {
        reader: {
          animales: {
            bestScore: EXAM_PASS_MARK,
            attempts: 2,
            history: [
              { at: T, score: 5 },
              { at: T + minute, score: EXAM_PASS_MARK },
            ],
          },
        },
      },
    };
    expect(decodeProgress(encodeProgress(snapshot)).examRecords).toEqual(
      snapshot.examRecords,
    );
  });

  it("drops a record whose history is not a list of sane sittings", () => {
    const raw = {
      ...base,
      examRecords: {
        listener: { g1: { bestScore: 9, attempts: 1, history: [{ at: "now", score: 9 }] } },
      },
    };
    expect(sanitizeSnapshot(raw).examRecords?.listener).toBeUndefined();
  });

  it("drops an absurdly long history rather than letting it inflate the snapshot", () => {
    const raw = {
      ...base,
      examRecords: {
        listener: {
          g1: {
            bestScore: 9,
            attempts: 1,
            history: Array.from({ length: 10_000 }, (_, i) => ({ at: T + i, score: 9 })),
          },
        },
      },
    };
    expect(sanitizeSnapshot(raw).examRecords?.listener).toBeUndefined();
  });

  it("accepts a longer history from a peer that caps higher, then trims it", () => {
    // The guard is deliberately looser than the cap: if a later build raises
    // EXAM_HISTORY_LIMIT, an older device must not discard that peer's whole
    // exam ledger — which would cost a kid real passes. Trimming is the merge's
    // job, not the guard's.
    const longer = Array.from({ length: EXAM_HISTORY_LIMIT + 4 }, (_, i) => ({
      at: T + i * minute,
      score: 9,
    }));
    const raw = {
      ...base,
      examRecords: { listener: { g1: { bestScore: 9, attempts: 12, history: longer } } },
    };
    expect(sanitizeSnapshot(raw).examRecords?.listener?.g1?.history).toHaveLength(
      longer.length,
    );
    expect(
      mergeProgress(base, sanitizeSnapshot(raw)).examRecords?.listener?.g1?.history,
    ).toHaveLength(EXAM_HISTORY_LIMIT);
  });
});

describe("exam history crossing the localStorage boundary", () => {
  it("salvages the counters when the history is rubbish", () => {
    // One bad field must not cost a kid a pass — the same per-entry salvage
    // rule the ledger already applies per shelf.
    const kept = sanitizeExamRecords({ g1: { bestScore: 9, attempts: 2, history: "no" } });
    expect(kept.g1).toEqual({ bestScore: 9, attempts: 2 });
  });

  it("drops only the sittings that are malformed", () => {
    const kept = sanitizeExamRecords({
      g1: {
        bestScore: 9,
        attempts: 3,
        history: [{ at: T, score: 9 }, { at: T + minute }, { score: 4 }],
      },
    });
    expect(examHistory(kept.g1)).toEqual([{ at: T, score: 9 }]);
  });

  it("trims a history that has somehow grown past the cap", () => {
    const kept = sanitizeExamRecords({
      g1: {
        bestScore: 9,
        attempts: 40,
        history: Array.from({ length: 40 }, (_, i) => ({ at: T + i * minute, score: i })),
      },
    });
    expect(examHistory(kept.g1)).toHaveLength(EXAM_HISTORY_LIMIT);
    expect(kept.g1?.attempts).toBe(40);
  });

  it("reads a pre-history stored record unchanged", () => {
    expect(sanitizeExamRecords({ g1: { bestScore: 7, attempts: 1 } }).g1).toEqual({
      bestScore: 7,
      attempts: 1,
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  decodeProgress,
  encodeProgress,
  mergeProgress,
  sanitizeSnapshot,
} from "../src/domain/transfer";
import type { ProgressSnapshot } from "../src/domain/transfer";
import { EXAM_PASS_MARK, examPassed } from "../src/domain/exam";

const base: ProgressSnapshot = { stickers: [], streaks: {}, avatars: {} };

describe("exam records on the wire (ADR 022)", () => {
  it("keeps the higher best score per shelf", () => {
    const merged = mergeProgress(
      { ...base, examRecords: { listener: { g1: { bestScore: 9, attempts: 2 } } } },
      { ...base, examRecords: { listener: { g1: { bestScore: 4, attempts: 5 } } } },
    );
    expect(merged.examRecords?.listener?.g1?.bestScore).toBe(9);
  });

  it("keeps the higher attempt count independently of the score", () => {
    const merged = mergeProgress(
      { ...base, examRecords: { listener: { g1: { bestScore: 9, attempts: 2 } } } },
      { ...base, examRecords: { listener: { g1: { bestScore: 4, attempts: 5 } } } },
    );
    expect(merged.examRecords?.listener?.g1?.attempts).toBe(5);
  });

  it("carries a pass from one device to the other", () => {
    const tablet = {
      ...base,
      examRecords: { listener: { g1: { bestScore: EXAM_PASS_MARK, attempts: 1 } } },
    };
    const phone = { ...base };
    expect(examPassed(mergeProgress(phone, tablet).examRecords?.listener?.g1)).toBe(
      true,
    );
  });

  it("can never let a stale peer take a pass away", () => {
    const passedSnapshot = {
      ...base,
      examRecords: { listener: { g1: { bestScore: 10, attempts: 3 } } },
    };
    const stale = {
      ...base,
      examRecords: { listener: { g1: { bestScore: 0, attempts: 1 } } },
    };
    expect(mergeProgress(passedSnapshot, stale).examRecords?.listener?.g1).toEqual({
      bestScore: 10,
      attempts: 3,
    });
    // Order-independent, the property that makes max-merge safe at all.
    expect(mergeProgress(stale, passedSnapshot).examRecords?.listener?.g1).toEqual({
      bestScore: 10,
      attempts: 3,
    });
  });

  it("unions shelves neither device has seen", () => {
    const merged = mergeProgress(
      { ...base, examRecords: { listener: { g1: { bestScore: 8, attempts: 1 } } } },
      { ...base, examRecords: { listener: { g2: { bestScore: 7, attempts: 1 } } } },
    );
    expect(Object.keys(merged.examRecords?.listener ?? {}).sort()).toEqual(["g1", "g2"]);
  });

  it("keeps each kid's exams separate", () => {
    const merged = mergeProgress(
      { ...base, examRecords: { listener: { g1: { bestScore: 8, attempts: 1 } } } },
      { ...base, examRecords: { reader: { g1: { bestScore: 10, attempts: 1 } } } },
    );
    expect(merged.examRecords?.listener?.g1?.bestScore).toBe(8);
    expect(merged.examRecords?.reader?.g1?.bestScore).toBe(10);
  });

  it("survives a round trip through a transfer code", () => {
    const snapshot: ProgressSnapshot = {
      ...base,
      examRecords: { reader: { animales: { bestScore: 10, attempts: 4 } } },
    };
    expect(decodeProgress(encodeProgress(snapshot)).examRecords).toEqual(
      snapshot.examRecords,
    );
  });

  it("leaves pre-exam snapshots untouched", () => {
    expect(sanitizeSnapshot({ stickers: [], streaks: {}, avatars: {} }).examRecords)
      .toBeUndefined();
  });
});

describe("exam records crossing a trust boundary", () => {
  it("drops a record that is not a pair of sane counters", () => {
    const raw = {
      stickers: [],
      streaks: {},
      avatars: {},
      examRecords: { listener: { g1: { bestScore: "lots", attempts: 1 } } },
    };
    expect(sanitizeSnapshot(raw).examRecords?.listener).toBeUndefined();
  });

  it("drops an infinite score rather than letting it stick under max-merge", () => {
    const raw = {
      stickers: [],
      streaks: {},
      avatars: {},
      examRecords: { listener: { g1: { bestScore: Infinity, attempts: 1 } } },
    };
    expect(sanitizeSnapshot(raw).examRecords?.listener).toBeUndefined();
  });

  it("drops a negative score", () => {
    const raw = {
      stickers: [],
      streaks: {},
      avatars: {},
      examRecords: { listener: { g1: { bestScore: -5, attempts: 1 } } },
    };
    expect(sanitizeSnapshot(raw).examRecords?.listener).toBeUndefined();
  });

  it("ignores a kid id it has never heard of", () => {
    const raw = {
      stickers: [],
      streaks: {},
      avatars: {},
      examRecords: { hacker: { g1: { bestScore: 10, attempts: 1 } } },
    };
    expect(sanitizeSnapshot(raw).examRecords).toBeUndefined();
  });
});

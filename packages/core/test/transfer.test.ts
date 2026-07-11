import { describe, expect, it } from "vitest";
import {
  decodeProgress,
  encodeProgress,
  InvalidTransferCodeError,
  mergeProgress,
} from "../src/domain/transfer";
import type { ProgressSnapshot } from "../src/domain/transfer";

const snapshot: ProgressSnapshot = {
  stickers: ["listener:animals:learn", "reader:zoo:quiz-read"],
  streaks: { listener: { day: "2026-07-11", count: 3 } },
  avatars: { listener: "🦖", reader: "🐼" },
};

describe("encode/decode round trip", () => {
  it("survives a round trip, emoji included", () => {
    const code = encodeProgress(snapshot);
    expect(decodeProgress(code)).toEqual(snapshot);
  });

  it("produces a versioned, paste-safe code", () => {
    const code = encodeProgress(snapshot);
    expect(code.startsWith("PALABRAS1.")).toBe(true);
    expect(code).toMatch(/^PALABRAS1\.[A-Za-z0-9_-]+$/);
  });

  it("tolerates surrounding whitespace on import", () => {
    const code = `  ${encodeProgress(snapshot)}\n`;
    expect(decodeProgress(code)).toEqual(snapshot);
  });
});

describe("decodeProgress validation", () => {
  it("rejects garbage with a typed error", () => {
    expect(() => decodeProgress("not a code")).toThrow(
      InvalidTransferCodeError,
    );
    expect(() => decodeProgress("PALABRAS1.%%%")).toThrow(
      InvalidTransferCodeError,
    );
    expect(() => decodeProgress("PALABRAS9.abc")).toThrow(
      InvalidTransferCodeError,
    );
  });

  it("drops malformed sticker ids and unknown kid keys instead of importing them", () => {
    const dirty: ProgressSnapshot = {
      stickers: ["listener:animals:learn", "garbage", "a:b:c:d"],
      streaks: { listener: { day: "2026-07-11", count: 1 } },
      avatars: { listener: "🦖" },
    };
    const decoded = decodeProgress(encodeProgress(dirty));
    expect(decoded.stickers).toEqual(["listener:animals:learn"]);
  });
});

describe("mergeProgress", () => {
  it("unions stickers without duplicates", () => {
    const merged = mergeProgress(
      { stickers: ["a:b:c", "x:y:z"], streaks: {}, avatars: {} },
      { stickers: ["x:y:z", "n:e:w"], streaks: {}, avatars: {} },
    );
    expect(merged.stickers).toEqual(["a:b:c", "x:y:z", "n:e:w"]);
  });

  it("keeps the streak with the later day", () => {
    const merged = mergeProgress(
      { stickers: [], streaks: { listener: { day: "2026-07-10", count: 9 } }, avatars: {} },
      { stickers: [], streaks: { listener: { day: "2026-07-11", count: 2 } }, avatars: {} },
    );
    expect(merged.streaks.listener).toEqual({ day: "2026-07-11", count: 2 });
  });

  it("keeps the higher count when days tie", () => {
    const merged = mergeProgress(
      { stickers: [], streaks: { reader: { day: "2026-07-11", count: 2 } }, avatars: {} },
      { stickers: [], streaks: { reader: { day: "2026-07-11", count: 5 } }, avatars: {} },
    );
    expect(merged.streaks.reader).toEqual({ day: "2026-07-11", count: 5 });
  });

  it("lets incoming avatars win, but keeps current ones it does not mention", () => {
    const merged = mergeProgress(
      { stickers: [], streaks: {}, avatars: { listener: "🦖", reader: "🦄" } },
      { stickers: [], streaks: {}, avatars: { reader: "🐼" } },
    );
    expect(merged.avatars).toEqual({ listener: "🦖", reader: "🐼" });
  });
});

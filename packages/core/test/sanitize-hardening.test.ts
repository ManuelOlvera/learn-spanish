import { describe, expect, it } from "vitest";
import {
  decodeProgress,
  encodeProgress,
  InvalidTransferCodeError,
  sanitizeSnapshot,
} from "../src/domain/transfer";

/**
 * Magnitude hardening at the trust boundary: a snapshot from a pasted code or
 * a cloud row must not be able to smuggle in absurd numbers (Infinity sticks
 * forever under max-merge and stringifies to null in storage) or megabyte
 * payloads (localStorage is ~5 MB per origin).
 */
describe("sanitizeSnapshot magnitude caps", () => {
  it("drops non-finite, non-integer, and negative counts", () => {
    const cleaned = sanitizeSnapshot({
      stickers: [],
      streaks: {},
      avatars: {},
      stars: {
        listener: Infinity,
        reader: 3.5,
      },
      freezes: { listener: NaN, reader: -2 },
    });
    expect(cleaned.stars).toBeUndefined();
    expect(cleaned.freezes).toBeUndefined();
  });

  it("drops counts beyond the sane ceiling but keeps big-but-real ones", () => {
    const cleaned = sanitizeSnapshot({
      stickers: [],
      streaks: {},
      avatars: {},
      stars: { listener: 1_000_001, reader: 1_000_000 },
    });
    expect(cleaned.stars).toEqual({ reader: 1_000_000 });
  });

  it("drops sticker counts with unsafe values", () => {
    const cleaned = sanitizeSnapshot({
      stickers: [],
      streaks: {},
      avatars: {},
      stickerCounts: {
        "listener:animals:learn": Infinity,
        "listener:animals:quiz": 2.5,
        "listener:colors:learn": 3,
      },
    });
    expect(cleaned.stickerCounts).toEqual({ "listener:colors:learn": 3 });
  });

  it("drops word stats with unsafe tallies", () => {
    const cleaned = sanitizeSnapshot({
      stickers: [],
      streaks: {},
      avatars: {},
      stats: {
        listener: {
          perro: { right: Infinity, wrong: 0 },
        },
        reader: {
          gato: { right: 2, wrong: 1 },
        },
      },
    });
    expect(cleaned.stats).toEqual({ reader: { gato: { right: 2, wrong: 1 } } });
  });

  it("drops streaks and missions with oversized text fields", () => {
    const cleaned = sanitizeSnapshot({
      stickers: [],
      streaks: { listener: { day: "x".repeat(1000), count: 3 } },
      avatars: { listener: "🦖".repeat(200) },
      missions: {
        listener: { day: "2026-07-13", done: ["quiz".repeat(100)], claimed: false },
      },
    });
    expect(cleaned.streaks).toEqual({});
    expect(cleaned.avatars).toEqual({});
    expect(cleaned.missions).toBeUndefined();
  });

  it("caps runaway list sizes instead of importing megabytes", () => {
    const cleaned = sanitizeSnapshot({
      stickers: Array.from({ length: 6_000 }, (_, i) => `listener:deck${i}:learn`),
      streaks: {},
      avatars: {},
      ownedAvatars: { listener: Array.from({ length: 6_000 }, () => "🦖") },
    });
    expect(cleaned.stickers.length).toBeLessThanOrEqual(5_000);
    expect(cleaned.ownedAvatars).toBeUndefined();
  });

  it("drops pets with unsafe meals or oversized accessory lists", () => {
    const cleaned = sanitizeSnapshot({
      stickers: [],
      streaks: {},
      avatars: {},
      pets: {
        listener: { meals: Infinity, lastFed: null },
        reader: {
          meals: 2,
          lastFed: null,
          accessories: Array.from({ length: 6_000 }, () => "hat"),
        },
      },
    });
    expect(cleaned.pets).toBeUndefined();
  });

  it("still accepts a realistic snapshot untouched", () => {
    const real = {
      stickers: ["listener:animals:learn"],
      streaks: { listener: { day: "2026-07-13", count: 4 } },
      avatars: { listener: "🦖" },
      stars: { listener: 120 },
      freezes: { listener: 3 },
      stickerCounts: { "listener:animals:learn": 7 },
    };
    expect(sanitizeSnapshot(real)).toEqual(real);
  });
});

describe("decodeProgress size cap", () => {
  it("rejects an absurdly long code before parsing it", () => {
    const bomb = `PALABRAS1.${"A".repeat(300 * 1024)}`;
    expect(() => decodeProgress(bomb)).toThrow(InvalidTransferCodeError);
  });

  it("still round-trips a real snapshot", () => {
    const snapshot = {
      stickers: ["listener:animals:learn"],
      streaks: {},
      avatars: { listener: "🦖" },
    };
    expect(decodeProgress(encodeProgress(snapshot))).toEqual(snapshot);
  });
});

import { describe, expect, it } from "vitest";
import { salvageStickerIds } from "../src/domain/album";
import { sanitizeStickerCounts } from "../src/domain/transfer";
import {
  isTimeoutError,
  PairingNotStoredError,
  SyncTimeoutError,
} from "../src/domain/errors";

/**
 * Regression tests for the 2026-08-28 quality review: a corrupted local
 * document used to cost a child every sticker, and a stalled sync request
 * used to wedge the queue with no way to tell it apart from a dead network.
 */
describe("salvageStickerIds", () => {
  it("keeps the good entries when one is corrupt", () => {
    // The bug: `every(isString)` made a single bad entry discard the album.
    const raw = ["reader:animales:quiz", 42, "listener:casa:memory"];
    expect(salvageStickerIds(raw)).toEqual([
      "reader:animales:quiz",
      "listener:casa:memory",
    ]);
  });

  it("salvages nothing from a non-array", () => {
    expect(salvageStickerIds({ stickers: "gone" })).toEqual([]);
    expect(salvageStickerIds(null)).toEqual([]);
    expect(salvageStickerIds(undefined)).toEqual([]);
  });

  it("returns every entry of an intact album unchanged", () => {
    const raw = ["reader:animales:quiz", "listener:casa:memory"];
    expect(salvageStickerIds(raw)).toEqual(raw);
  });

  it("drops entries too long to be a sticker id", () => {
    expect(salvageStickerIds(["a".repeat(500), "reader:casa:quiz"])).toEqual([
      "reader:casa:quiz",
    ]);
  });

  it("caps a storage-filling array", () => {
    const raw = Array.from({ length: 9_000 }, (_, i) => `reader:d${i}:quiz`);
    expect(salvageStickerIds(raw)).toHaveLength(5_000);
  });

  it("keeps legacy two-part ids for the upgrader to expand", () => {
    // Salvage runs *before* upgradeLegacyStickers, so it must not judge shape.
    expect(salvageStickerIds(["animales:quiz"])).toEqual(["animales:quiz"]);
  });
});

describe("isTimeoutError", () => {
  it("recognises the abort a bounded fetch raises", () => {
    const err = new Error("timed out");
    err.name = "TimeoutError";
    expect(isTimeoutError(err)).toBe(true);
  });

  it("does not mistake an ordinary network failure for a timeout", () => {
    expect(isTimeoutError(new TypeError("Failed to fetch"))).toBe(false);
    expect(isTimeoutError("TimeoutError")).toBe(false);
    expect(isTimeoutError(null)).toBe(false);
  });

  it("carries the operation and budget it gave up on", () => {
    const err = new SyncTimeoutError("put_progress", 10_000);
    expect(err.name).toBe("SyncTimeoutError");
    expect(err.fn).toBe("put_progress");
    expect(err.timeoutMs).toBe(10_000);
    expect(err.message).toContain("put_progress");
  });

  it("tells a refused pairing write apart from a network failure", () => {
    // The panel branches on this to avoid blaming the internet for a
    // localStorage refusal, which retrying on better wifi will never fix.
    const quota = new DOMException("quota", "QuotaExceededError");
    const err = new PairingNotStoredError(quota);
    expect(err).toBeInstanceOf(PairingNotStoredError);
    expect(err.name).toBe("PairingNotStoredError");
    expect(err.cause).toBe(quota);
    expect(new SyncTimeoutError("get_progress", 10_000)).not.toBeInstanceOf(
      PairingNotStoredError,
    );
  });
});

/**
 * Regression tests for the 2026-08-31 quality review finding 2: the local
 * sticker-counts document was the one storage read in `economy-store` that
 * skipped its guard, and `AwardStickerUseCase` adds 1 to whatever it finds.
 */
describe("sanitizeStickerCounts", () => {
  it("drops a count that is not a number, so the award can't concatenate", () => {
    // The bug this prevents: `previous + 1` on the string "3" yields "31",
    // which compares as gold and then grows to "311" on the next play.
    const counts = sanitizeStickerCounts({
      "reader:animales:quiz": "3",
      "listener:casa:memory": 2,
    });
    expect(counts).toEqual({ "listener:casa:memory": 2 });
  });

  it("keeps an intact document unchanged", () => {
    const raw = { "reader:animales:quiz": 4, "listener:casa:memory": 1 };
    expect(sanitizeStickerCounts(raw)).toEqual(raw);
  });

  it("drops ids the album could never contain", () => {
    expect(
      sanitizeStickerCounts({
        "reader:animales:quiz": 2,
        "animales:quiz": 5, // shared-era shape; never written to this key
        "nobody:casa:quiz": 5, // not a kid
        "": 5,
      }),
    ).toEqual({ "reader:animales:quiz": 2 });
  });

  it("drops counts outside the sane range", () => {
    expect(
      sanitizeStickerCounts({
        "reader:a:quiz": 0, // a count of zero is an absent sticker
        "reader:b:quiz": -3,
        "reader:c:quiz": 1.5,
        "reader:d:quiz": Number.MAX_SAFE_INTEGER,
        "reader:e:quiz": 2,
      }),
    ).toEqual({ "reader:e:quiz": 2 });
  });

  it("salvages nothing from a non-object", () => {
    expect(sanitizeStickerCounts(null)).toEqual({});
    expect(sanitizeStickerCounts(undefined)).toEqual({});
    expect(sanitizeStickerCounts("gold")).toEqual({});
    expect(sanitizeStickerCounts(7)).toEqual({});
  });

  it("caps a storage-filling document", () => {
    const raw = Object.fromEntries(
      Array.from({ length: 9_000 }, (_, i) => [`reader:d${i}:quiz`, 1]),
    );
    expect(Object.keys(sanitizeStickerCounts(raw))).toHaveLength(5_000);
  });
});

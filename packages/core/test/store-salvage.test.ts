import { describe, expect, it } from "vitest";
import { salvageStickerIds } from "../src/domain/album";
import { isTimeoutError, SyncTimeoutError } from "../src/domain/errors";

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
});

import { describe, expect, it } from "vitest";
import { AwardStickerUseCase } from "../src/application/award-sticker";
import { GetAlbumUseCase } from "../src/application/get-album";
import { stickerId } from "../src/domain/album";
import type { AlbumStore } from "../src/domain/album";

class FakeAlbumStore implements AlbumStore {
  constructor(public stickers: readonly string[] = []) {}
  load(): Promise<readonly string[]> {
    return Promise.resolve(this.stickers);
  }
  save(stickers: readonly string[]): Promise<void> {
    this.stickers = stickers;
    return Promise.resolve();
  }
}

describe("stickerId", () => {
  it("derives a stable id from deck and activity", () => {
    expect(stickerId("animals", "quiz-listen")).toBe("animals:quiz-listen");
  });
});

describe("AwardStickerUseCase", () => {
  it("awards a sticker the first time and persists it", async () => {
    const store = new FakeAlbumStore();
    const award = new AwardStickerUseCase(store);
    const result = await award.execute("animals", "learn");
    expect(result).toEqual({ stickerId: "animals:learn", isNew: true });
    expect(store.stickers).toContain("animals:learn");
  });

  it("reports a repeat award as not new and does not duplicate it", async () => {
    const store = new FakeAlbumStore(["animals:learn"]);
    const award = new AwardStickerUseCase(store);
    const result = await award.execute("animals", "learn");
    expect(result.isNew).toBe(false);
    expect(store.stickers).toEqual(["animals:learn"]);
  });

  it("keeps previously earned stickers when awarding a new one", async () => {
    const store = new FakeAlbumStore(["animals:learn"]);
    const award = new AwardStickerUseCase(store);
    await award.execute("food", "quiz-read");
    expect(store.stickers).toEqual(["animals:learn", "food:quiz-read"]);
  });
});

describe("GetAlbumUseCase", () => {
  it("returns everything the store holds", async () => {
    const store = new FakeAlbumStore(["animals:learn", "colors:quiz-listen"]);
    const getAlbum = new GetAlbumUseCase(store);
    await expect(getAlbum.execute()).resolves.toEqual([
      "animals:learn",
      "colors:quiz-listen",
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { AwardStickerUseCase } from "../src/application/award-sticker";
import { GetAlbumUseCase } from "../src/application/get-album";
import { stickerId, upgradeLegacyStickers } from "../src/domain/album";
import type { AlbumStore, StickerCountsStore } from "../src/domain/album";

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

class FakeCountsStore implements StickerCountsStore {
  public counts: Record<string, number> = {};
  load(): Promise<Readonly<Record<string, number>>> {
    return Promise.resolve({ ...this.counts });
  }
  save(counts: Readonly<Record<string, number>>): Promise<void> {
    this.counts = { ...counts };
    return Promise.resolve();
  }
}

describe("stickerId", () => {
  it("derives a stable per-kid id", () => {
    expect(stickerId("listener", "animals", "quiz-listen")).toBe(
      "listener:animals:quiz-listen",
    );
  });
});

describe("upgradeLegacyStickers", () => {
  it("grants shared-era stickers to both kids", () => {
    expect(upgradeLegacyStickers(["animals:learn"])).toEqual([
      "listener:animals:learn",
      "reader:animals:learn",
    ]);
  });

  it("keeps per-kid stickers as they are", () => {
    const modern = ["reader:food:quiz-read"];
    expect(upgradeLegacyStickers(modern)).toEqual(modern);
  });

  it("drops entries that fit no format", () => {
    expect(upgradeLegacyStickers(["garbage", "a:b:c:d"])).toEqual([]);
  });

  it("never duplicates when legacy and per-kid entries overlap", () => {
    expect(
      upgradeLegacyStickers(["animals:learn", "listener:animals:learn"]),
    ).toEqual(["listener:animals:learn", "reader:animals:learn"]);
  });
});

describe("AwardStickerUseCase", () => {
  it("awards a sticker to one kid and persists it", async () => {
    const store = new FakeAlbumStore();
    const award = new AwardStickerUseCase(store, new FakeCountsStore());
    const result = await award.execute("listener", "animals", "learn");
    expect(result).toMatchObject({
      stickerId: "listener:animals:learn",
      isNew: true,
    });
    expect(store.stickers).toContain("listener:animals:learn");
  });

  it("reports a repeat award as not new and does not duplicate it", async () => {
    const store = new FakeAlbumStore(["listener:animals:learn"]);
    const award = new AwardStickerUseCase(store, new FakeCountsStore());
    const result = await award.execute("listener", "animals", "learn");
    expect(result.isNew).toBe(false);
    expect(store.stickers).toEqual(["listener:animals:learn"]);
  });

  it("keeps the other kid's stickers intact", async () => {
    const store = new FakeAlbumStore(["reader:animals:learn"]);
    const award = new AwardStickerUseCase(store, new FakeCountsStore());
    await award.execute("listener", "animals", "learn");
    expect(store.stickers).toEqual([
      "reader:animals:learn",
      "listener:animals:learn",
    ]);
  });
});

describe("GetAlbumUseCase", () => {
  it("returns only the asked kid's stickers", async () => {
    const store = new FakeAlbumStore([
      "listener:animals:learn",
      "reader:colors:quiz-read",
      "listener:food:match-pictures",
    ]);
    const getAlbum = new GetAlbumUseCase(store);
    await expect(getAlbum.execute("listener")).resolves.toEqual([
      "listener:animals:learn",
      "listener:food:match-pictures",
    ]);
  });
});

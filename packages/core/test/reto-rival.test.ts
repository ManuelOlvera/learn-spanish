import { describe, expect, it } from "vitest";
import { mergeProgress } from "../src/domain/transfer";
import type { ProgressSnapshot } from "../src/domain/transfer";
import { rivalFor } from "../src/domain/duel";

const base: ProgressSnapshot = { stickers: [], streaks: {}, avatars: {} };

describe("rivalFor", () => {
  it("is the other kid", () => {
    expect(rivalFor("listener")).toBe("reader");
    expect(rivalFor("reader")).toBe("listener");
  });
});

describe("merging reto records", () => {
  it("keeps the higher score per kid per deck", () => {
    const merged = mergeProgress(
      { ...base, retoBests: { listener: { animals: 14, colors: 3 } } },
      { ...base, retoBests: { listener: { animals: 9, colors: 8 } } },
    );
    expect(merged.retoBests?.listener).toEqual({ animals: 14, colors: 8 });
  });

  it("keeps each kid's records apart", () => {
    const merged = mergeProgress(
      { ...base, retoBests: { listener: { animals: 14 } } },
      { ...base, retoBests: { reader: { animals: 20 } } },
    );
    expect(merged.retoBests).toEqual({
      listener: { animals: 14 },
      reader: { animals: 20 },
    });
  });

  it("takes a record from a device that has one when the other doesn't", () => {
    const merged = mergeProgress(base, {
      ...base,
      retoBests: { reader: { zoo: 11 } },
    });
    expect(merged.retoBests?.reader).toEqual({ zoo: 11 });
  });

  it("never lowers a record — the merge is monotonic, so it fits ADR 004", () => {
    const merged = mergeProgress(
      { ...base, retoBests: { reader: { zoo: 30 } } },
      { ...base, retoBests: { reader: { zoo: 1 } } },
    );
    expect(merged.retoBests?.reader?.zoo).toBe(30);
  });

  it("omits the field entirely when nobody has a record", () => {
    expect(mergeProgress(base, base).retoBests).toBeUndefined();
  });
});

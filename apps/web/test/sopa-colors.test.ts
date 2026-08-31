import { describe, expect, it } from "vitest";
import {
  mixSopaColors,
  SOPA_WORD_COLORS,
  sopaWordColor,
} from "@/lib/sopa-colors";
import { SOPA_BOARDS } from "@learn-spanish/core";

/** Roughly where a colour sits on the wheel, in degrees. */
function hue(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(
    (at) => Number.parseInt(hex.slice(at, at + 2), 16) / 255,
  ) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) {
    return 0;
  }
  const span = max - min;
  const raw =
    max === r
      ? (g - b) / span
      : max === g
        ? 2 + (b - r) / span
        : 4 + (r - g) / span;
  return ((raw * 60) % 360 + 360) % 360;
}

describe("sopaWordColor", () => {
  it("gives every word on the biggest board a colour of its own", () => {
    const board = SOPA_BOARDS.hard;
    const colors = Array.from({ length: board.words }, (_, i) =>
      sopaWordColor(i),
    );
    expect(new Set(colors).size).toBe(board.words);
  });

  it("has a palette at least as big as any board it must colour", () => {
    expect(SOPA_WORD_COLORS.length).toBeGreaterThanOrEqual(
      SOPA_BOARDS.hard.words,
    );
  });
});

describe("mixSopaColors", () => {
  it("leaves a cell with one owner in that word's own colour", () => {
    expect(mixSopaColors(["#ef4444"])).toBe("#ef4444");
  });

  it("mixes red and yellow into an orange", () => {
    const orange = mixSopaColors(["#ef4444", "#facc15"]);
    expect(orange).not.toBeNull();
    // Orange is the wedge between red (0°) and yellow (~50°).
    expect(hue(orange!)).toBeGreaterThan(5);
    expect(hue(orange!)).toBeLessThan(45);
  });

  it("mixes red and blue into a purple", () => {
    const purple = mixSopaColors(["#ef4444", "#3b82f6"]);
    expect(hue(purple!)).toBeGreaterThan(240);
    expect(hue(purple!)).toBeLessThan(320);
  });

  /** The property the board depends on: an unfound cell is white, so no mix
   *  may come out white or a shared letter would read as never found. */
  it("never mixes to white, for any pair or triple in the palette", () => {
    for (const a of SOPA_WORD_COLORS) {
      for (const b of SOPA_WORD_COLORS) {
        for (const c of SOPA_WORD_COLORS) {
          const mixed = mixSopaColors([a, b, c])!;
          const channels = [1, 3, 5].map((at) =>
            Number.parseInt(mixed.slice(at, at + 2), 16),
          );
          expect(Math.min(...channels), `${a}+${b}+${c}`).toBeLessThan(0xe0);
        }
      }
    }
  });

  it("returns a six-digit hex whatever the rounding", () => {
    for (const a of SOPA_WORD_COLORS) {
      for (const b of SOPA_WORD_COLORS) {
        expect(mixSopaColors([a, b])).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  it("has no colour to give for a cell nobody owns", () => {
    expect(mixSopaColors([])).toBeNull();
  });
});

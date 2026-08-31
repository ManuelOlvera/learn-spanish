/**
 * La sopa de letras' word colors — presentation, so they live in the app and
 * not in `@learn-spanish/core` (which never carries styling).
 *
 * One color per hidden word, so a found word reads as a *shape* on the board
 * instead of merging into one lime blanket with the four beside it. The kid's
 * word list above the grid carries the same colors, which is what makes the
 * board answer "which one did I just find?" without reading anything.
 *
 * Shared letters are the interesting case: ARAÑA and RANA can legally cross on
 * a Ñ, and one cell cannot be two colors. It is painted with the two words
 * **mixed** — red and yellow give orange — so the crossing reads as "both",
 * which is what it is, rather than as whichever word happened to be found
 * second. A shared cell is the one place on the board a color appears that is
 * in nobody's word list, and that is the point: it looks like an overlap.
 */

/**
 * Five colors for the five words a hard board can hide, in paint-box order:
 * mixing any two of them lands somewhere a 5-year-old would predict, and no
 * two are close enough to confuse at a glance. Deliberately saturated — these
 * sit under bold ink letters and behind a 2px ink border.
 */
export const SOPA_WORD_COLORS: readonly string[] = [
  "#ef4444", // red
  "#facc15", // yellow
  "#3b82f6", // blue
  "#22c55e", // green
  "#a855f7", // purple
];

/** The color of the nth hidden word. Wraps, though no board hides more than
 *  the palette holds (`SOPA_BOARDS.hard.words` is 5). */
export function sopaWordColor(index: number): string {
  return SOPA_WORD_COLORS[index % SOPA_WORD_COLORS.length]!;
}

function channels(hex: string): readonly [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function toHex(channel: number): string {
  return Math.round(channel).toString(16).padStart(2, "0");
}

/**
 * Mix colors the way paint mixes: the average of the channels. Red + yellow
 * comes out orange, red + blue comes out purple, and — the property that
 * matters most here — a mix is never white, so a shared cell can never be
 * mistaken for a cell nobody has found.
 *
 * Empty input has no color to give and returns null; the caller then leaves
 * the cell in its unfound state rather than painting it black.
 */
export function mixSopaColors(colors: readonly string[]): string | null {
  if (colors.length === 0) {
    return null;
  }
  if (colors.length === 1) {
    return colors[0]!;
  }
  const parsed = colors.map(channels);
  const mixed = [0, 1, 2].map(
    (channel) =>
      parsed.reduce((sum, rgb) => sum + rgb[channel]!, 0) / parsed.length,
  );
  return `#${mixed.map(toHex).join("")}`;
}

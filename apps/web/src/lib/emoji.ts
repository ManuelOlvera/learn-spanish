"use client";

/**
 * Card-emoji sizing (bugs.md #3). Most cards draw one emoji glyph, but the
 * big-number decks use keycap sequences ("2️⃣0️⃣") that paint roughly twice as
 * wide — at a font size chosen for one glyph they burst out of the fixed
 * squares the games draw them in (worst on tablets, where the sm: sizes
 * apply). Every player that renders a card emoji inside a fixed box picks
 * its size through here.
 */

/** True when the emoji is a multi-glyph sequence that renders ~2× wide. */
export function isWideEmoji(emoji: string): boolean {
  // Grapheme-accurate segmentation: a single keycap ("1️⃣") is one grapheme
  // but three code points, so code-point length alone would misfire.
  if (typeof Intl === "undefined" || typeof Intl.Segmenter === "undefined") {
    return false; // ancient browser: keep the old (single-size) behavior
  }
  const graphemes = new Intl.Segmenter().segment(emoji.trim())[Symbol.iterator]();
  graphemes.next();
  return graphemes.next().done !== true;
}

/** The text-size class for a card emoji in a fixed box: `single` for normal
 *  one-glyph art, `wide` (roughly 60% the size) for keycap sequences. */
export function emojiSizeClass(
  emoji: string,
  single: string,
  wide: string,
): string {
  return isWideEmoji(emoji) ? wide : single;
}

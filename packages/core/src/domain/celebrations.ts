import type { RandomSource } from "./random";

/** A win cheer: a short spoken/shown Spanish exclamation and the burst emoji
 *  that rides with it. The kids *hear* the phrase — it is exposure, never text
 *  they must read to proceed. */
export interface Celebration {
  readonly phrase: string;
  readonly emoji: string;
}

/** The rotating pool. Every phrase is upbeat and **gender-neutral** — both
 *  kids play, so praise never gets a masculine/feminine ending (no "campeón/-a").
 *  Rotating the ending keeps the finish from feeling like the same screen twice. */
export const CELEBRATIONS: readonly Celebration[] = [
  { phrase: "¡Muy bien!", emoji: "🎉" },
  { phrase: "¡Bravo!", emoji: "👏" },
  { phrase: "¡Olé!", emoji: "💃" },
  { phrase: "¡Genial!", emoji: "🌟" },
  { phrase: "¡Increíble!", emoji: "🤩" },
  { phrase: "¡Fantástico!", emoji: "✨" },
  { phrase: "¡Qué bien!", emoji: "🥳" },
  { phrase: "¡Excelente!", emoji: "🌈" },
];

/** Pick one cheer. Injected randomness keeps it testable and lets the UI vary
 *  it once per finish (a fixed pick per mount, never mid-screen). */
export function pickCelebration(random: RandomSource): Celebration {
  return CELEBRATIONS[Math.floor(random() * CELEBRATIONS.length)] ?? CELEBRATIONS[0]!;
}

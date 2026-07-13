import type { Deck } from "./deck";

/**
 * Letter-card case display. The letter decks store both cases in the card
 * face ("Bb") — the full form. A kid just starting out learns one case at a
 * time, so play screens may show only the upper or lower half; the spoken
 * name ("la be") never changes. Which case a kid sees is a per-kid
 * preference the app stores; these are the pure rules.
 */
export const LETTER_CASES = ["upper", "lower", "both"] as const;
export type LetterCase = (typeof LETTER_CASES)[number];

/** True for a two-character upper+lower pair ("Bb", "Ññ", "Áá") — and only
 *  that: real emoji are surrogate pairs or sequences, digit faces ("100")
 *  and same-case runs don't pair up. */
export function isCasePairGlyph(face: string): boolean {
  if (face.length !== 2) {
    return false;
  }
  const [upper, lower] = [face[0]!, face[1]!];
  return (
    upper !== lower &&
    upper === upper.toUpperCase() &&
    lower === upper.toLowerCase() &&
    lower !== lower.toUpperCase() // rules out digits/symbols ("11", "--")
  );
}

/** The face to draw for a chosen case; non-letter faces pass through. */
export function applyLetterCase(face: string, letterCase: LetterCase): string {
  if (!isCasePairGlyph(face) || letterCase === "both") {
    return face;
  }
  return letterCase === "upper" ? face[0]! : face[1]!;
}

export function isLetterCase(value: unknown): value is LetterCase {
  return LETTER_CASES.includes(value as LetterCase);
}

/** The deck ids that hold the alphabet, in shelf order. */
export const LETTER_DECK_IDS = ["vocales", "letras-b-m", "letras-n-z"] as const;

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

/**
 * El abecedario completo: one virtual run of all 27 letters in alphabet
 * order (ñ after n), built from the letter decks. Accented vowels stay out —
 * they are spellings, not alphabet members, and the recital is the point.
 * The result is presentation-only (played straight through, no album deck of
 * its own), which is why it is assembled rather than shipped in the pack.
 */
export function buildAlphabetDeck(decks: readonly Deck[]): Deck {
  const cards = decks
    .filter((deck) =>
      (LETTER_DECK_IDS as readonly string[]).includes(deck.id),
    )
    .flatMap((deck) => deck.cards)
    .filter((card) => ALPHABET.includes(card.emoji[0] ?? ""))
    .sort(
      (a, b) => ALPHABET.indexOf(a.emoji[0]!) - ALPHABET.indexOf(b.emoji[0]!),
    );
  return {
    id: "abecedario",
    nameSpanish: "El abecedario",
    nameEnglish: "The whole alphabet",
    emoji: "🔠",
    cards,
  };
}

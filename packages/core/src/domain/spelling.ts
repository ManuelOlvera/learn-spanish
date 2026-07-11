import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import { QuizDeckTooSmallError } from "./errors";
import { shuffled } from "./random";
import type { RandomSource } from "./random";

/** Deletrea: spell the pictured word from shuffled letter tiles.
 *  Reader-level only — the menu hides it from the pre-reader. */
export interface SpellingRound {
  readonly card: VocabularyCard;
  /** The bare word to spell (article stripped). */
  readonly word: string;
  /** Its letters, shuffled, never dealt already in order. */
  readonly tiles: readonly string[];
}

export interface SpellingGame {
  readonly deckId: string;
  readonly rounds: readonly SpellingRound[];
}

export const SPELLING_ROUNDS = 6;
const MIN_LETTERS = 3;
const MAX_LETTERS = 8;

/** The spellable form of a card, or null when it isn't kid-spellable
 *  (multi-word after stripping the article, or too short/long). */
export function spellingWord(card: VocabularyCard): string | null {
  const bare = card.spanish.replace(/^(el|la|los|las) /, "");
  if (bare.includes(" ")) {
    return null;
  }
  return bare.length >= MIN_LETTERS && bare.length <= MAX_LETTERS ? bare : null;
}

function dealTiles(word: string, random: RandomSource): readonly string[] {
  const letters = [...word];
  for (let attempt = 0; attempt < 10; attempt++) {
    const tiles = shuffled(letters, random);
    if (tiles.join("") !== word) {
      return tiles;
    }
  }
  return [...letters.slice(1), letters[0]!];
}

export function createSpellingGame(
  deck: Deck,
  random: RandomSource = Math.random,
): SpellingGame {
  const spellable = deck.cards.flatMap((card) => {
    const word = spellingWord(card);
    return word === null ? [] : [{ card, word }];
  });
  if (spellable.length < 2) {
    throw new QuizDeckTooSmallError(deck.id, spellable.length, 2);
  }

  const rounds = shuffled(spellable, random)
    .slice(0, SPELLING_ROUNDS)
    .map(({ card, word }): SpellingRound => {
      return { card, word, tiles: dealTiles(word, random) };
    });

  return { deckId: deck.id, rounds };
}

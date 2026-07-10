import { shuffled } from "./random";
import type { RandomSource } from "./random";

/** A short spoken/buildable sentence. Tokens are the builder tiles —
 *  articles stay glued to their noun ("el perro"), matching the flashcards. */
export interface Sentence {
  readonly id: string;
  readonly tokens: readonly string[];
  readonly english: string;
  /** Picture for the subject — pre-readers navigate by this alone. */
  readonly emoji: string;
}

export function sentenceText(sentence: Sentence): string {
  return sentence.tokens.join(" ");
}

export interface SentenceRepository {
  listSentences(): Promise<readonly Sentence[]>;
}

export interface SentenceRound {
  readonly sentence: Sentence;
  /** The tokens dealt out of order, never matching the correct order. */
  readonly tiles: readonly string[];
}

export interface SentenceGame {
  readonly rounds: readonly SentenceRound[];
}

/** Kid-sized session. */
export const SENTENCE_ROUNDS = 6;

function dealTiles(
  sentence: Sentence,
  random: RandomSource,
): readonly string[] {
  const correct = sentenceText(sentence);
  for (let attempt = 0; attempt < 10; attempt++) {
    const tiles = shuffled(sentence.tokens, random);
    if (tiles.join(" ") !== correct) {
      return tiles;
    }
  }
  // All-identical tokens (or astronomically unlucky): rotate instead.
  return [...sentence.tokens.slice(1), sentence.tokens[0]!];
}

export function createSentenceGame(
  sentences: readonly Sentence[],
  random: RandomSource = Math.random,
): SentenceGame {
  const rounds = shuffled(sentences, random)
    .slice(0, SENTENCE_ROUNDS)
    .map((sentence): SentenceRound => {
      return { sentence, tiles: dealTiles(sentence, random) };
    });
  return { rounds };
}

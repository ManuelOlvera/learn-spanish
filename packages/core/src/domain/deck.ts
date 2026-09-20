import type { ActivityId } from "./album";
import type { VocabularyCard } from "./card";

export interface Deck {
  readonly id: string;
  readonly nameSpanish: string;
  readonly nameEnglish: string;
  readonly emoji: string;
  readonly cards: readonly VocabularyCard[];
  /** A star-gated bonus deck: kept off the home shelves and hidden from the
   *  album/daily/review pools until a kid unlocks it (see unlockCost). */
  readonly secret?: boolean;
  /** Stars to unlock a secret deck. */
  readonly unlockCost?: number;
  /** Flashcards-only: the deck is never used to generate quiz-style game
   *  content. Verbs need this because the games build noun-shaped questions
   *  ("¿Es un…?") that don't fit an action word. The deck's game menu then
   *  offers Las tarjetas alone. */
  readonly learnOnly?: boolean;
  /**
   * Games this deck opts out of, by activity id — the finer-grained cousin of
   * `learnOnly`, for a deck that fits most games but not the ones that build a
   * *claim* about the picture.
   *
   * El infinitivo and el imperativo use it: "¿Está comiendo?" is natural
   * Spanish about a picture, "¿Dice «come»?" is not, so those two skip sí-o-no
   * and the scene hunt while playing everything else. Prefer this over
   * `learnOnly` — shutting a deck out of every game is almost never what the
   * content actually needs.
   */
  readonly skipActivities?: readonly ActivityId[];
}

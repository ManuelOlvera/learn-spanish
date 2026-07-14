import type { Deck } from "./deck";
import type { VocabularyCard } from "./card";
import type { QuizMode } from "./quiz";
import { QuizDeckTooSmallError } from "./errors";
import { shuffled } from "./random";
import type { RandomSource } from "./random";

/** Busca y toca: a busy board of scattered pictures; the app asks for one
 *  and the kid hunts it down. */
export interface SceneItem {
  readonly card: VocabularyCard;
  /** Board position, percentages of width/height. */
  readonly x: number;
  readonly y: number;
}

export interface SceneGame {
  readonly deckId: string;
  readonly mode: QuizMode;
  readonly items: readonly SceneItem[];
  readonly rounds: readonly VocabularyCard[];
}

export const SCENE_ITEMS = 12;
export const SCENE_ROUNDS = 8;

/** 4×4 grid cells with jitter: busy-looking but never overlapping. */
const GRID = 4;

export function createSceneGame(
  deck: Deck,
  mode: QuizMode,
  random: RandomSource = Math.random,
): SceneGame {
  if (deck.cards.length < SCENE_ROUNDS) {
    throw new QuizDeckTooSmallError(deck.id, deck.cards.length, SCENE_ROUNDS);
  }

  const cards = shuffled(deck.cards, random).slice(0, SCENE_ITEMS);
  const cells = shuffled(
    Array.from({ length: GRID * GRID }, (_, i) => i),
    random,
  ).slice(0, cards.length);
  const cellSize = 100 / GRID;
  const items = cards.map((card, i): SceneItem => {
    const col = cells[i]! % GRID;
    const row = Math.floor(cells[i]! / GRID);
    // Jitter within the middle of the cell so neighbors never collide.
    const jitter = () => (random() - 0.5) * cellSize * 0.4;
    return {
      card,
      x: (col + 0.5) * cellSize + jitter(),
      y: (row + 0.5) * cellSize + jitter(),
    };
  });

  return {
    deckId: deck.id,
    mode,
    items,
    rounds: shuffled(cards, random).slice(0, SCENE_ROUNDS),
  };
}

/** The hunt question, as a native would ask it: ¿Dónde está el gato?,
 *  ¿Dónde están los calcetines?, ¿Dónde está el rojo? (bare words get an
 *  article), and ¿Quién está triste? for feelings. Cards whose `spanish` is
 *  deliberately bare (letter names — "be", not "la be") carry their own
 *  `article`, so the question still reads native: ¿Dónde está la be? */
export function sceneQuestion(card: VocabularyCard): string {
  if (card.usesEstar) {
    return `¿Quién está ${card.spanish}?`;
  }
  if (card.article !== undefined) {
    const verb = card.article === "los" || card.article === "las" ? "están" : "está";
    return `¿Dónde ${verb} ${card.article} ${card.spanish}?`;
  }
  if (card.spanish.startsWith("los ") || card.spanish.startsWith("las ")) {
    return `¿Dónde están ${card.spanish}?`;
  }
  if (card.spanish.startsWith("el ") || card.spanish.startsWith("la ")) {
    return `¿Dónde está ${card.spanish}?`;
  }
  return `¿Dónde está el ${card.spanish}?`;
}

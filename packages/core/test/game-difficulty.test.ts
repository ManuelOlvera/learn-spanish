import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../src/domain/difficulty";
import { createQuiz, QUIZ_CHOICES, QUIZ_CHOICE_COUNT } from "../src/domain/quiz";
import { createQuizRound } from "../src/domain/quiz";
import {
  createSiNoGame,
  siNoDifficulties,
  SI_NO_ROUND_COUNT,
} from "../src/domain/si-no";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";
import type { Deck } from "../src/domain/deck";
import type { VocabularyCard } from "../src/domain/card";

const repo = new StaticDeckRepository();

function card(id: string): VocabularyCard {
  return { id, spanish: id, english: id, emoji: id };
}
function deckOf(n: number): Deck {
  return {
    id: "d",
    nameSpanish: "d",
    nameEnglish: "d",
    emoji: "🧪",
    cards: Array.from({ length: n }, (_, i) => card(`c${i}`)),
  };
}

describe("the difficulty axis", () => {
  it("is the same three rungs everywhere", () => {
    expect(DIFFICULTIES).toEqual(["easy", "medium", "hard"]);
  });

  it("gets harder, never flat", () => {
    expect(QUIZ_CHOICES.easy).toBeLessThan(QUIZ_CHOICES.medium);
    expect(QUIZ_CHOICES.medium).toBeLessThan(QUIZ_CHOICES.hard);
    expect(SI_NO_ROUND_COUNT.easy).toBeLessThan(SI_NO_ROUND_COUNT.medium);
    expect(SI_NO_ROUND_COUNT.medium).toBeLessThan(SI_NO_ROUND_COUNT.hard);
  });
});

describe("¿Dónde está? scales by choice count", () => {
  it("deals the picked number of choices", () => {
    for (const level of DIFFICULTIES) {
      const quiz = createQuiz(deckOf(12), "listen", () => 0.5, undefined, level);
      for (const round of quiz.rounds) {
        expect(round.choices).toHaveLength(QUIZ_CHOICES[level]);
      }
    }
  });

  it("still puts the answer on the board at every level", () => {
    for (const level of DIFFICULTIES) {
      const quiz = createQuiz(deckOf(12), "read", () => 0.3, undefined, level);
      for (const round of quiz.rounds) {
        expect(round.choices.map((c) => c.id)).toContain(round.answer.id);
      }
    }
  });

  it("gives the pre-reader four choices when they ask for hard", () => {
    // Four *pictures* need no more reading than two do (ADR 021 made the same
    // call for the exam), so the harder board costs the listener nothing.
    const quiz = createQuiz(deckOf(12), "listen", () => 0.5, undefined, "hard");
    expect(quiz.rounds[0]!.choices).toHaveLength(4);
  });

  it("defaults to the level's own count when nothing is picked", () => {
    // Every caller that has no difficulty to hand — el reto — keeps exactly
    // the board it had before.
    for (const mode of ["listen", "read"] as const) {
      const quiz = createQuiz(deckOf(12), mode, () => 0.5);
      expect(quiz.rounds[0]!.choices).toHaveLength(QUIZ_CHOICE_COUNT[mode]);
    }
  });

  it("leaves el reto's round untouched", () => {
    // El reto is deliberately out of this slice: its best score is a single
    // max-merged number per deck, so a board that changes size would make
    // records incomparable and inflate one permanently.
    for (const mode of ["listen", "read"] as const) {
      expect(createQuizRound(deckOf(12), mode, () => 0.5).choices).toHaveLength(
        QUIZ_CHOICE_COUNT[mode],
      );
    }
  });
});

describe("¿Sí o no? scales by round count", () => {
  it("deals the picked number of rounds", () => {
    for (const level of DIFFICULTIES) {
      const game = createSiNoGame(deckOf(17), "listen", () => 0.5, level);
      expect(game.rounds).toHaveLength(SI_NO_ROUND_COUNT[level]);
    }
  });

  it("keeps its old length when nothing is picked", () => {
    expect(createSiNoGame(deckOf(17), "listen", () => 0.5).rounds).toHaveLength(
      SI_NO_ROUND_COUNT.medium,
    );
  });

  it("never asks about the same card twice in one game", () => {
    const game = createSiNoGame(deckOf(17), "listen", () => 0.5, "hard");
    const ids = game.rounds.map((r) => r.card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("offers only the levels a deck can actually fill", () => {
    // A round asks about a distinct card, so a 10-card deck cannot deal 12.
    // The sopa/globo pattern: offer what fits rather than silently dealing a
    // short game that says "hard" and is not.
    expect(siNoDifficulties(deckOf(17))).toEqual(["easy", "medium", "hard"]);
    expect(siNoDifficulties(deckOf(10))).toEqual(["easy", "medium"]);
    expect(siNoDifficulties(deckOf(6))).toEqual(["easy"]);
  });

  it("offers every level on every real deck it should", () => {
    // The pack holds decks at 10-17 cards, so easy and medium must always be
    // available — a deck that can offer no difficulty at all would be a game
    // with no way in.
    return repo.listDecks().then((decks) => {
      for (const deck of decks) {
        const levels = siNoDifficulties(deck);
        expect(levels.length).toBeGreaterThan(0);
        expect(levels).toContain("easy");
      }
    });
  });
});

describe("difficulty never fragments the album", () => {
  it("is not part of any sticker", async () => {
    // Las parejas set this precedent: the sticker is `match-pictures`
    // whatever the board size. A difficulty-specific sticker would make a
    // deck's category impossible to complete without playing every level.
    const decks = await repo.listDecks();
    const deck = decks.find((d) => d.id === "animals")!;
    const easy = createSiNoGame(deck, "listen", () => 0.5, "easy");
    const hard = createSiNoGame(deck, "listen", () => 0.5, "hard");
    expect(easy.deckId).toBe(hard.deckId);
    expect(easy.mode).toBe(hard.mode);
  });
});

import { describe, expect, it } from "vitest";
import {
  createSentenceGame,
  SENTENCE_ROUNDS,
} from "../src/domain/sentence";
import type { Sentence } from "../src/domain/sentence";
import { StaticSentenceRepository } from "../src/infrastructure/static-sentence-repository";
import { ListSentencesUseCase } from "../src/application/list-sentences";
import { seededRandom } from "./helpers";

function sentence(n: number): Sentence {
  return {
    id: `frase-${n}`,
    tokens: [`sujeto${n}`, "es", `cosa${n}`],
    english: `subject ${n} is thing ${n}`,
    emoji: String.fromCodePoint(0x1f400 + n),
  };
}

const pack = Array.from({ length: 10 }, (_, i) => sentence(i));

describe("createSentenceGame", () => {
  it("plays 6 rounds with no repeated sentence", () => {
    const game = createSentenceGame(pack, seededRandom(1));
    expect(game.rounds).toHaveLength(SENTENCE_ROUNDS);
    const ids = game.rounds.map((r) => r.sentence.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("plays every sentence when the pack is smaller than a full game", () => {
    const game = createSentenceGame(pack.slice(0, 3), seededRandom(2));
    expect(game.rounds).toHaveLength(3);
  });

  it("gives each round tiles that are a permutation of the tokens", () => {
    const game = createSentenceGame(pack, seededRandom(3));
    for (const round of game.rounds) {
      expect([...round.tiles].sort()).toEqual([...round.sentence.tokens].sort());
    }
  });

  it("never deals tiles already in the correct order", () => {
    for (let seed = 0; seed < 20; seed++) {
      const game = createSentenceGame(pack, seededRandom(seed));
      for (const round of game.rounds) {
        expect(round.tiles.join(" ")).not.toBe(round.sentence.tokens.join(" "));
      }
    }
  });

  it("shuffles differently for different random sources", () => {
    const a = createSentenceGame(pack, seededRandom(4));
    const b = createSentenceGame(pack, seededRandom(5));
    expect(a.rounds.map((r) => r.sentence.id)).not.toEqual(
      b.rounds.map((r) => r.sentence.id),
    );
  });
});

describe("sentence pack content", () => {
  const repo = new StaticSentenceRepository();

  it("lists a healthy variety pool of 60-84 sentences (a game plays 6)", async () => {
    const sentences = await repo.listSentences();
    expect(sentences.length).toBeGreaterThanOrEqual(60);
    expect(sentences.length).toBeLessThanOrEqual(84);
  });

  it("keeps every sentence short: 2-4 tiles of real words", async () => {
    const sentences = await repo.listSentences();
    for (const s of sentences) {
      expect(s.tokens.length).toBeGreaterThanOrEqual(2);
      expect(s.tokens.length).toBeLessThanOrEqual(4);
      for (const token of s.tokens) {
        expect(token).not.toBe("");
      }
      expect(s.id).not.toBe("");
      expect(s.english).not.toBe("");
      // Pre-readers navigate by picture alone.
      expect(s.emoji).not.toBe("");
    }
  });

  it("never repeats a sentence id", async () => {
    const sentences = await repo.listSentences();
    const ids = sentences.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("ListSentencesUseCase", () => {
  it("returns every sentence from the repository", async () => {
    const repo = new StaticSentenceRepository();
    const useCase = new ListSentencesUseCase(repo);
    await expect(useCase.execute()).resolves.toEqual(
      await repo.listSentences(),
    );
  });
});

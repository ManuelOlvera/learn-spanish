import { describe, expect, it } from "vitest";
import {
  createConversation,
  petPrefers,
  CONVERSATION_TURNS,
} from "../src/domain/conversation";
import { ConversationDeckTooSmallError } from "../src/domain/errors";
import type { Deck } from "../src/domain/deck";
import { card, deckOf, seededRandom } from "./helpers";
import {
  CONVERSATION_DECKS,
  hasConversation,
} from "../src/infrastructure/deck-groups";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";

const deck: Deck = {
  ...deckOf(12),
  id: "animals",
  cards: Array.from({ length: 12 }, (_, i) => ({
    ...card(i),
    // Non-prefixing names: "el bicho 1" would be a substring of "el bicho 10",
    // which would make the no-repeat assertion below lie.
    spanish: `el bicho ${"ABCDEFGHIJKL"[i]!}`,
  })),
};

function build(seed = 1, pet = "Pip") {
  return createConversation(deck, pet, seededRandom(seed));
}

describe("createConversation", () => {
  it("opens with a greeting and closes with a goodbye", () => {
    const talk = build();
    expect(talk.turns).toHaveLength(CONVERSATION_TURNS);
    expect(talk.turns[0]!.kind).toBe("greeting");
    expect(talk.turns.at(-1)!.kind).toBe("farewell");
  });

  it("greets the kid by the pet's name", () => {
    expect(build(1, "Pip").turns[0]!.prompt).toContain("Pip");
  });

  it("gives every turn at least two things the kid could say", () => {
    for (const turn of build().turns) {
      expect(turn.choices.length).toBeGreaterThanOrEqual(2);
      for (const choice of turn.choices) {
        expect(choice.spanish).not.toBe("");
        expect(choice.emoji).not.toBe("");
        // Every choice is answered — the pet never leaves a turn hanging.
        expect(choice.reply).not.toBe("");
      }
    }
  });

  it("never marks a choice right or wrong — there is no correct answer", () => {
    const turn = build().turns[1]!;
    // The shape itself carries no notion of correctness; assert it stays that
    // way, because the moment a `correct` field appears this is just the quiz.
    for (const choice of turn.choices) {
      expect(choice).not.toHaveProperty("correct");
    }
  });

  it("talks about a word at most once in a session", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const talk = createConversation(deck, "Pip", seededRandom(seed));
      const said = talk.turns.flatMap((t) =>
        deck.cards.filter((c) => t.prompt.includes(c.spanish)).map((c) => c.id),
      );
      expect(new Set(said).size, `seed ${seed} repeated a word`).toBe(said.length);
    }
  });

  it("puts the deck's own words, article and all, in the kid's mouth", () => {
    // Which frames a seed deals is random, so scan a few for a ¿te gusta?
    const spoken: string[] = [];
    for (let seed = 1; seed <= 20; seed++) {
      for (const turn of createConversation(deck, "Pip", seededRandom(seed)).turns) {
        if (turn.kind === "gusta") {
          spoken.push(...turn.choices.map((c) => c.spanish));
        }
      }
    }
    expect(spoken.length).toBeGreaterThan(0);
    // "Sí, me gusta el bicho C" — never a bare "me gusta bicho C".
    expect(spoken.every((line) => /me gusta el bicho [A-L]$/.test(line))).toBe(true);
  });

  it("varies the phrasing across sessions, not just the words", () => {
    const prompts = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      prompts.add(createConversation(deck, "Pip", seededRandom(seed)).turns[0]!.prompt);
    }
    expect(prompts.size).toBeGreaterThan(1);
  });

  it("refuses a deck too small to talk about without repeating itself", () => {
    expect(() =>
      createConversation({ ...deck, cards: deck.cards.slice(0, 3) }, "Pip", seededRandom(1)),
    ).toThrow(ConversationDeckTooSmallError);
  });
});

describe("the mascota's own taste", () => {
  it("is stable for one pet and word, so it has a personality", () => {
    expect(petPrefers("Pip", "word-1")).toBe(petPrefers("Pip", "word-1"));
  });

  it("differs between pets, so a new pet is a new companion", () => {
    const ids = Array.from({ length: 30 }, (_, i) => `word-${i}`);
    const pip = ids.map((id) => petPrefers("Pip", id));
    const bo = ids.map((id) => petPrefers("Bo", id));
    expect(pip).not.toEqual(bo);
  });

  it("is not all one way — the pet likes some things and not others", () => {
    const ids = Array.from({ length: 40 }, (_, i) => `word-${i}`);
    const likes = ids.filter((id) => petPrefers("Pip", id) > 0.5).length;
    expect(likes).toBeGreaterThan(5);
    expect(likes).toBeLessThan(35);
  });

  it("answers agreement and disagreement differently", () => {
    // Across many sessions both kinds of reply must appear, or the pet is a
    // yes-machine and the conversation has no opinion in it.
    const replies = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const talk = createConversation(deck, "Pip", seededRandom(seed));
      for (const turn of talk.turns) {
        if (turn.kind === "gusta") {
          for (const choice of turn.choices) {
            replies.add(choice.reply);
          }
        }
      }
    }
    expect(replies.size).toBeGreaterThanOrEqual(4);
  });
});

describe("which decks can hold a conversation", () => {
  it("only offers decks whose words carry an article", async () => {
    // "¿Te gusta rojo?" is why Los colores is not on the list. Any deck that
    // loses its articles must leave the list, and this is what catches it.
    for (const deckId of CONVERSATION_DECKS) {
      const deck = (await new StaticDeckRepository().listDecks()).find(
        (d) => d.id === deckId,
      );
      expect(deck, `${deckId} is not in the pack`).toBeDefined();
      for (const c of deck!.cards) {
        expect(
          /^(el|la|los|las) /.test(c.spanish),
          `${deckId}: "${c.spanish}" has no article`,
        ).toBe(true);
      }
    }
  });

  it("only offers decks big enough to talk about", async () => {
    const decks = await new StaticDeckRepository().listDecks();
    for (const deckId of CONVERSATION_DECKS) {
      const deck = decks.find((d) => d.id === deckId)!;
      expect(deck.cards.length, deckId).toBeGreaterThanOrEqual(6);
      expect(deck.learnOnly ?? false, `${deckId} is flashcards-only`).toBe(false);
      expect(deck.secret ?? false, `${deckId} is a secret deck`).toBe(false);
    }
  });

  it("keeps the tile away from decks the frames would mangle", () => {
    for (const deckId of ["body", "cara", "vocales", "numbers", "posiciones", "meses"]) {
      expect(hasConversation(deckId), deckId).toBe(false);
    }
    expect(hasConversation("animals")).toBe(true);
  });
});

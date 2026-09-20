import { describe, expect, it } from "vitest";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";
import { StaticDeckGroupRepository } from "../src/infrastructure/static-deck-group-repository";
import { deckSkipsGame, earnableActivities } from "../src/domain/category";
import { buildExam } from "../src/domain/exam";
import { groupsInTrailOrder } from "../src/infrastructure/deck-groups";
import { cardPicture } from "../src/domain/card";
import { siNoQuestion } from "../src/domain/si-no";
import { sceneQuestion } from "../src/domain/scene";

const repo = new StaticDeckRepository();
const groupRepo = new StaticDeckGroupRepository();

const VERB_DECKS = ["verbs-infinitive", "verbs-gerund", "verbs-imperative"];

describe("los verbos join the games (roadmap 11)", () => {
  it("leaves no deck learn-only", async () => {
    // The flag stays a supported deck shape; nothing uses it any more.
    const decks = await repo.listDecks();
    expect(decks.filter((d) => d.learnOnly === true)).toEqual([]);
  });

  it("gives el gerundio every activity its kid can earn", async () => {
    const decks = await repo.listDecks();
    const gerund = decks.find((d) => d.id === "verbs-gerund")!;
    const other = decks.find((d) => d.id === "animals")!;
    for (const kid of ["listener", "reader"] as const) {
      expect(earnableActivities(gerund, kid)).toEqual(earnableActivities(other, kid));
    }
  });

  it("keeps the claim games off the forms that have no natural claim", async () => {
    // "¿Dice «come»?" is not how anyone asks about a picture, so el
    // infinitivo and el imperativo skip sí-o-no and the scene hunt rather
    // than shipping stilted Spanish to a child.
    const decks = await repo.listDecks();
    for (const id of ["verbs-infinitive", "verbs-imperative"]) {
      const deck = decks.find((d) => d.id === id)!;
      for (const kid of ["listener", "reader"] as const) {
        const earnable = earnableActivities(deck, kid);
        expect(earnable.some((a) => a.startsWith("si-no"))).toBe(false);
        expect(earnable.some((a) => a.startsWith("scene"))).toBe(false);
        // ...but everything else is on.
        expect(earnable).toContain("learn");
        expect(earnable.some((a) => a.startsWith("quiz"))).toBe(true);
        expect(earnable.some((a) => a.startsWith("match"))).toBe(true);
        expect(earnable.some((a) => a.startsWith("connect"))).toBe(true);
      }
    }
  });

  it("phrases el gerundio's claims the way Mi día proved", async () => {
    const decks = await repo.listDecks();
    const gerund = decks.find((d) => d.id === "verbs-gerund")!;
    for (const card of gerund.cards) {
      expect(siNoQuestion(card)).toMatch(/^¿(Está|Se está) .+\?$/);
      expect(sceneQuestion(card)).toMatch(/^¿Quién (está|se está) .+\?$/);
    }
  });

  it("asks about the action, never '¿Es un comiendo?'", async () => {
    const decks = await repo.listDecks();
    const gerund = decks.find((d) => d.id === "verbs-gerund")!;
    for (const card of gerund.cards) {
      expect(siNoQuestion(card)).not.toMatch(/¿Es un/);
    }
  });

  it("refuses a skipped game at every entrance, not just the menu", async () => {
    // ADR 021's rule, applied to a game rather than a shelf: one open door is
    // none. /deck/<id>/si-no is reachable by URL and by the back stack, so
    // hiding the tile is not enough on its own.
    const decks = await repo.listDecks();
    const inf = decks.find((d) => d.id === "verbs-infinitive")!;
    const ger = decks.find((d) => d.id === "verbs-gerund")!;
    expect(deckSkipsGame(inf, "si-no")).toBe(true);
    expect(deckSkipsGame(inf, "scene")).toBe(true);
    expect(deckSkipsGame(inf, "quiz")).toBe(false);
    expect(deckSkipsGame(inf, "match")).toBe(false);
    expect(deckSkipsGame(ger, "si-no")).toBe(false);
    expect(deckSkipsGame(ger, "scene")).toBe(false);
  });

  it("still shuts a learn-only deck out of everything but flashcards", async () => {
    // The old flag keeps working for content that genuinely cannot host a
    // question, even though nothing in the pack sets it today.
    const learnOnly = { id: "x", nameSpanish: "x", nameEnglish: "x", emoji: "🧪", cards: [], learnOnly: true };
    expect(deckSkipsGame(learnOnly, "quiz")).toBe(true);
    expect(deckSkipsGame(learnOnly, "si-no")).toBe(true);
    expect(deckSkipsGame(learnOnly, "learn")).toBe(false);
  });

  it("still deals a unique picture within each verb deck", async () => {
    const decks = await repo.listDecks();
    for (const id of VERB_DECKS) {
      const deck = decks.find((d) => d.id === id)!;
      const pictures = deck.cards.map(cardPicture);
      expect(new Set(pictures).size).toBe(pictures.length);
    }
  });
});

describe("an exam never deals the same picture twice", () => {
  it("holds on the verbs shelf, whose three decks share every picture", async () => {
    // The reason this test exists: el infinitivo, el gerundio and el
    // imperativo teach the same fifteen verbs, so `comer` and `comiendo`
    // carry the same 🍽️. An exam draws across a whole shelf, so picking
    // distractors by card id alone would deal one picture as both the answer
    // and a wrong choice — unanswerable, and marked wrong either way.
    const decks = await repo.listDecks();
    const groups = groupsInTrailOrder(await groupRepo.listGroups());
    for (let seed = 0; seed < 40; seed += 1) {
      let n = seed;
      const random = () => {
        n = (n * 1103515245 + 12345) % 2147483648;
        return n / 2147483648;
      };
      const exam = buildExam({
        groupId: "verbos",
        groups,
        decks,
        kid: "reader",
        random,
      });
      for (const round of exam.rounds) {
        const pictures = round.choices.map(cardPicture);
        expect(new Set(pictures).size).toBe(pictures.length);
      }
    }
  });

  it("still fills every round with the full choice count", async () => {
    const decks = await repo.listDecks();
    const groups = groupsInTrailOrder(await groupRepo.listGroups());
    const exam = buildExam({
      groupId: "verbos",
      groups,
      decks,
      kid: "reader",
      random: () => 0.5,
    });
    for (const round of exam.rounds) {
      expect(round.choices).toHaveLength(4);
      expect(round.choices.map((c) => c.id)).toContain(round.answer.id);
    }
  });

  it("holds on an ordinary shelf too", async () => {
    const decks = await repo.listDecks();
    const groups = groupsInTrailOrder(await groupRepo.listGroups());
    const exam = buildExam({
      groupId: "casa",
      groups,
      decks,
      kid: "listener",
      random: () => 0.31,
    });
    for (const round of exam.rounds) {
      const pictures = round.choices.map(cardPicture);
      expect(new Set(pictures).size).toBe(pictures.length);
    }
  });
});

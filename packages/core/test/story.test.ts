import { describe, expect, it } from "vitest";
import {
  createStoryQuiz,
  STORY_MAX_PAGE_CHARS,
  STORY_MAX_PAGES,
  STORY_MAX_QUESTIONS,
  STORY_MIN_PAGES,
  STORY_MIN_QUESTIONS,
  STORY_QUESTION_CHOICES,
  storyCast,
} from "../src/domain/story";
import type { Story } from "../src/domain/story";
import {
  QuizDeckTooSmallError,
  StoryCastCardNotFoundError,
} from "../src/domain/errors";
import { StaticStoryRepository } from "../src/infrastructure/static-story-repository";
import { StaticDeckRepository } from "../src/infrastructure/static-deck-repository";
import { ListStoriesUseCase } from "../src/application/list-stories";
import { card, seededRandom } from "./helpers";

const pool = Array.from({ length: 8 }, (_, i) => card(i));

function story(cast: readonly string[], questionCount = 4): Story {
  return {
    id: "cuento-prueba",
    titleSpanish: "El cuento de prueba",
    titleEnglish: "The test story",
    emoji: "🧪",
    cast,
    pages: Array.from({ length: 5 }, (_, i) => ({
      text: `Página ${i}.`,
      english: `page ${i}`,
      scene: { hero: "🐸", props: ["🌳"] },
    })),
    questions: Array.from({ length: questionCount }, (_, i) => ({
      id: `p${i}`,
      ask: `¿Pregunta ${i}?`,
      english: `question ${i}`,
      answerId: cast[i % cast.length]!,
    })),
  };
}

describe("createStoryQuiz", () => {
  const cast = pool.slice(0, 6).map((c) => c.id);

  it("asks every authored question, in the story's own order", () => {
    const quiz = createStoryQuiz(story(cast), pool, "read", seededRandom(1));
    expect(quiz.rounds.map((r) => r.question.id)).toEqual(["p0", "p1", "p2", "p3"]);
  });

  it.each([
    ["listen" as const, 2],
    ["read" as const, 4],
  ])("deals %s mode %i picture choices", (mode, expected) => {
    expect(STORY_QUESTION_CHOICES[mode]).toBe(expected);
    const quiz = createStoryQuiz(story(cast), pool, mode, seededRandom(2));
    for (const round of quiz.rounds) {
      expect(round.choices).toHaveLength(expected);
    }
  });

  it("always includes the answer among the choices, exactly once", () => {
    const quiz = createStoryQuiz(story(cast), pool, "read", seededRandom(3));
    for (const round of quiz.rounds) {
      const hits = round.choices.filter((c) => c.id === round.answer.id);
      expect(hits).toHaveLength(1);
    }
  });

  it("draws every distractor from the story's own cast", () => {
    // A wrong choice must be something the kid just met in the story —
    // never a random word from the far side of the pack.
    const quiz = createStoryQuiz(story(cast), pool, "read", seededRandom(4));
    for (const round of quiz.rounds) {
      for (const choice of round.choices) {
        expect(cast).toContain(choice.id);
      }
    }
  });

  it("never repeats a card within one round's choices", () => {
    for (let seed = 0; seed < 25; seed++) {
      const quiz = createStoryQuiz(story(cast), pool, "read", seededRandom(seed));
      for (const round of quiz.rounds) {
        const ids = round.choices.map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it("resolves each answer to its real pack card", () => {
    const quiz = createStoryQuiz(story(cast), pool, "read", seededRandom(5));
    for (const round of quiz.rounds) {
      expect(round.answer.id).toBe(round.question.answerId);
      expect(round.answer.emoji).not.toBe("");
    }
  });

  it("is deterministic for a given random source", () => {
    const a = createStoryQuiz(story(cast), pool, "read", seededRandom(6));
    const b = createStoryQuiz(story(cast), pool, "read", seededRandom(6));
    expect(a).toEqual(b);
  });

  it("varies the distractors between plays, so a replay is not the same board", () => {
    const boards = new Set<string>();
    for (let seed = 0; seed < 8; seed++) {
      const quiz = createStoryQuiz(story(cast), pool, "read", seededRandom(seed));
      boards.add(quiz.rounds.map((r) => r.choices.map((c) => c.id).join("|")).join("/"));
    }
    expect(boards.size).toBeGreaterThan(1);
  });

  it("throws when the cast cannot fill the mode's choices", () => {
    // Three cast members can't make a 4-choice board.
    expect(() =>
      createStoryQuiz(story(cast.slice(0, 3)), pool, "read", seededRandom(7)),
    ).toThrow(QuizDeckTooSmallError);
    // …but the same story is fine at the listener's two choices.
    expect(() =>
      createStoryQuiz(story(cast.slice(0, 3)), pool, "listen", seededRandom(7)),
    ).not.toThrow();
  });

  it("throws when a question is answered by someone outside the cast", () => {
    // A real card, but not in this story — the distractors would then be
    // drawn from a cast that can't contain the answer.
    const off = { ...story(cast) };
    const broken: Story = {
      ...off,
      questions: [{ ...off.questions[0]!, answerId: "word-7" }],
    };
    expect(() => createStoryQuiz(broken, pool, "read", seededRandom(9))).toThrow(
      StoryCastCardNotFoundError,
    );
  });

  it("throws a typed error when a cast id is not a real card", () => {
    expect(() =>
      createStoryQuiz(story([...cast, "no-such-card"]), pool, "read", seededRandom(8)),
    ).toThrow(StoryCastCardNotFoundError);
  });
});

describe("storyCast", () => {
  it("resolves cast ids to cards in cast order", () => {
    const ids = ["word-3", "word-1"];
    expect(storyCast({ ...story(ids) }, pool).map((c) => c.id)).toEqual(ids);
  });
});

describe("story pack content", () => {
  const repo = new StaticStoryRepository();
  const decks = new StaticDeckRepository();

  async function packCards() {
    return (await decks.listDecks()).flatMap((d) => d.cards);
  }

  it("ships ten stories", async () => {
    await expect(repo.listStories()).resolves.toHaveLength(10);
  });

  it("never repeats a story id", async () => {
    const stories = await repo.listStories();
    const ids = stories.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every story a kid-sized sitting", async () => {
    for (const s of await repo.listStories()) {
      expect(s.pages.length).toBeGreaterThanOrEqual(STORY_MIN_PAGES);
      expect(s.pages.length).toBeLessThanOrEqual(STORY_MAX_PAGES);
      expect(s.questions.length).toBeGreaterThanOrEqual(STORY_MIN_QUESTIONS);
      expect(s.questions.length).toBeLessThanOrEqual(STORY_MAX_QUESTIONS);
    }
  });

  it("gives every page a picture and a short spoken sentence", async () => {
    for (const s of await repo.listStories()) {
      expect(s.emoji).not.toBe("");
      expect(s.titleSpanish).not.toBe("");
      expect(s.titleEnglish).not.toBe("");
      for (const page of s.pages) {
        // Pre-readers navigate by picture alone.
        expect(page.scene.hero).not.toBe("");
        expect(page.scene.props.length).toBeLessThanOrEqual(3);
        expect(page.text).not.toBe("");
        expect(page.english).not.toBe("");
        // Still one breath per page — speech synthesis reads long clauses
        // flatly — but roomy enough for the reader-level stories to carry a
        // sentence with a clause in it.
        expect(page.text.length).toBeLessThanOrEqual(STORY_MAX_PAGE_CHARS);
      }
    }
  });

  it("casts only real pack cards, enough of them for the reader's board", async () => {
    const cards = await packCards();
    const ids = new Set(cards.map((c) => c.id));
    for (const s of await repo.listStories()) {
      expect(new Set(s.cast).size).toBe(s.cast.length);
      expect(s.cast.length).toBeGreaterThanOrEqual(STORY_QUESTION_CHOICES.read);
      for (const id of s.cast) {
        expect(ids).toContain(id);
      }
    }
  });

  it("answers every question with a member of that story's cast", async () => {
    for (const s of await repo.listStories()) {
      const qids = s.questions.map((q) => q.id);
      expect(new Set(qids).size).toBe(qids.length);
      for (const q of s.questions) {
        expect(s.cast).toContain(q.answerId);
        expect(q.ask).not.toBe("");
        expect(q.english).not.toBe("");
      }
    }
  });

  it("names any page art by the <storyId>-<pageNumber> convention", async () => {
    // The key is resolved to a real asset in the app (story-art.ts). Core
    // can't see files, so what it *can* guarantee is that the key is
    // well-formed and points at the page it sits on — the mismatch that
    // would otherwise show up as a silently un-illustrated page.
    for (const s of await repo.listStories()) {
      s.pages.forEach((page, i) => {
        if (page.image !== undefined) {
          expect(page.image).toBe(`${s.id}-${i + 1}`);
        }
      });
    }
  });

  it("asks about more than one thing per story", async () => {
    // A story whose questions all share an answer teaches "tap the frog",
    // not comprehension.
    for (const s of await repo.listStories()) {
      const answers = new Set(s.questions.map((q) => q.answerId));
      expect(answers.size).toBeGreaterThan(1);
    }
  });

  it("builds a playable quiz for both kids from every shipped story", async () => {
    const cards = await packCards();
    for (const s of await repo.listStories()) {
      for (const mode of ["listen", "read"] as const) {
        const quiz = createStoryQuiz(s, cards, mode, seededRandom(11));
        expect(quiz.rounds).toHaveLength(s.questions.length);
        expect(quiz.storyId).toBe(s.id);
      }
    }
  });

  it("puts the verbs shelf to work — it has no game of its own", async () => {
    // Los verbos is learnOnly, so a story is the only place those words are
    // ever seen doing something. Keep at least one in the casts.
    const decksById = await decks.listDecks();
    const verbIds = new Set(
      decksById
        .filter((d) => d.id.startsWith("verbs-"))
        .flatMap((d) => d.cards)
        .map((c) => c.id),
    );
    const cast = (await repo.listStories()).flatMap((s) => s.cast);
    expect(cast.some((id) => verbIds.has(id))).toBe(true);
  });
});

describe("ListStoriesUseCase", () => {
  it("returns every story from the repository", async () => {
    const repo = new StaticStoryRepository();
    const useCase = new ListStoriesUseCase(repo);
    await expect(useCase.execute()).resolves.toEqual(await repo.listStories());
  });
});

import type { VocabularyCard } from "./card";
import { QuizDeckTooSmallError, StoryCastCardNotFoundError } from "./errors";
import type { QuizMode } from "./quiz";
import { shuffled } from "./random";
import type { RandomSource } from "./random";

/**
 * El cuento: connected prose, the rung above Las frases. The pack teaches
 * words, then three-token sentences, then stops — a story is where a kid
 * finally meets those words doing something to each other, and the only
 * surface where the learnOnly verbs shelf can be seen in action.
 *
 * A story is read (or heard) straight through, then asks its comprehension
 * questions at the end. Questions live at the end and not between pages on
 * purpose: a quiz mid-narrative breaks the spell, and the chest only needs
 * *some* answerable moment to stay honest (a story with no questions would be
 * the cheapest stars in the app).
 */

/** The picture on a page. Emoji, composed rather than scattered: one hero at
 *  story size with a couple of props around it. */
export interface StoryScene {
  /** The star of this page, drawn biggest. */
  readonly hero: string;
  /** Up to three supporting emoji set around the hero. */
  readonly props: readonly string[];
}

export interface StoryPage {
  /** One short sentence — a single breath, spoken on tap. */
  readonly text: string;
  /** For the parent reading over the shoulder; never shown to the kid. */
  readonly english: string;
  readonly scene: StoryScene;
  /**
   * A picture for this page, as a presentation *key* — never a path or a
   * file. The app maps it to a real asset (`apps/web/src/lib/story-art.ts`,
   * the same trick `deck-theme.ts` uses for colours), so core stays ignorant
   * of files and formats. Unregistered keys fall back to `scene`, which is
   * what lets a story be half-illustrated while art is still being drawn.
   * By convention the key is `<storyId>-<pageNumber>`; a test pins that.
   */
  readonly image?: string;
}

/** One comprehension question, asked after the last page. */
export interface StoryQuestion {
  readonly id: string;
  /** Spoken to both kids; also shown written to the reader. */
  readonly ask: string;
  readonly english: string;
  /** The card that answers it — must be one of the story's cast. */
  readonly answerId: string;
}

export interface Story {
  readonly id: string;
  readonly titleSpanish: string;
  readonly titleEnglish: string;
  readonly emoji: string;
  readonly pages: readonly StoryPage[];
  /** Pack card ids that appear in the story. Answers *and* distractors are
   *  drawn from here, so a wrong choice is always something the kid just met
   *  — the question tests whether they followed the story, not whether they
   *  can rule out a word from the far side of the pack. */
  readonly cast: readonly string[];
  readonly questions: readonly StoryQuestion[];
}

export interface StoryRepository {
  listStories(): Promise<readonly Story[]>;
}

/** Kid-sized bounds, enforced by the content tests. */
export const STORY_MIN_PAGES = 4;
export const STORY_MAX_PAGES = 8;
export const STORY_MIN_QUESTIONS = 3;
export const STORY_MAX_QUESTIONS = 5;

/** Picture choices per question — the app's usual listen/read difficulty. */
export const STORY_QUESTION_CHOICES: Record<QuizMode, number> = {
  listen: 2,
  read: 4,
};

export interface StoryRound {
  readonly question: StoryQuestion;
  readonly answer: VocabularyCard;
  /** Includes the answer, in presentation order. */
  readonly choices: readonly VocabularyCard[];
}

export interface StoryQuiz {
  readonly storyId: string;
  readonly mode: QuizMode;
  readonly rounds: readonly StoryRound[];
}

/** The story's cast as real cards, in cast order. */
export function storyCast(
  story: Story,
  cards: readonly VocabularyCard[],
): readonly VocabularyCard[] {
  return story.cast.map((id) => {
    const found = cards.find((c) => c.id === id);
    if (found === undefined) {
      throw new StoryCastCardNotFoundError(story.id, id);
    }
    return found;
  });
}

/**
 * The end-of-story comprehension round.
 *
 * Question order is the story's own, not shuffled: a small child recalls a
 * narrative forwards, so walking back through it in order is the kindest way
 * to ask. Replay variety comes from the distractors and the choice order
 * instead, which is where it belongs.
 */
export function createStoryQuiz(
  story: Story,
  cards: readonly VocabularyCard[],
  mode: QuizMode,
  random: RandomSource = Math.random,
): StoryQuiz {
  const cast = storyCast(story, cards);
  const choiceCount = STORY_QUESTION_CHOICES[mode];
  if (cast.length < choiceCount) {
    throw new QuizDeckTooSmallError(story.id, cast.length, choiceCount);
  }

  const rounds = story.questions.map((question): StoryRound => {
    const answer = cast.find((c) => c.id === question.answerId);
    if (answer === undefined) {
      throw new StoryCastCardNotFoundError(story.id, question.answerId);
    }
    const distractors = shuffled(
      cast.filter((c) => c.id !== answer.id),
      random,
    ).slice(0, choiceCount - 1);
    return {
      question,
      answer,
      choices: shuffled([answer, ...distractors], random),
    };
  });

  return { storyId: story.id, mode, rounds };
}

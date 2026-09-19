import {
  GetDeckUseCase,
  ListDeckGroupsUseCase,
  ListDecksUseCase,
  ListSentencesUseCase,
  ListStoriesUseCase,
  StaticDeckGroupRepository,
  StaticDeckRepository,
  StaticSentenceRepository,
  StaticStoryRepository,
} from "@learn-spanish/core";

/**
 * Composition root: the only place concrete adapters meet use cases.
 * Components receive use cases from here and never construct their own.
 * (Ports backed by browser storage are wired in album.ts, the client-side
 * counterpart — this module is imported by server components too.)
 */
/** Exported for client-container.ts, which wires the browser-storage use cases
 *  that also need the pack (los exámenes draw across whole shelves). Exported
 *  rather than re-constructed there so the pack still has exactly one
 *  composition site. */
export const deckRepository = new StaticDeckRepository();
const sentenceRepository = new StaticSentenceRepository();
export const deckGroupRepository = new StaticDeckGroupRepository();
const storyRepository = new StaticStoryRepository();

export const listDecks = new ListDecksUseCase(deckRepository);
export const getDeck = new GetDeckUseCase(deckRepository);
export const listSentences = new ListSentencesUseCase(sentenceRepository);
export const listStories = new ListStoriesUseCase(storyRepository);
export const listDeckGroups = new ListDeckGroupsUseCase(deckGroupRepository);

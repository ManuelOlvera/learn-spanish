import {
  GetDeckUseCase,
  ListDeckGroupsUseCase,
  ListDecksUseCase,
  ListSentencesUseCase,
  StaticDeckGroupRepository,
  StaticDeckRepository,
  StaticSentenceRepository,
} from "@learn-spanish/core";

/**
 * Composition root: the only place concrete adapters meet use cases.
 * Components receive use cases from here and never construct their own.
 * (Ports backed by browser storage are wired in album.ts, the client-side
 * counterpart — this module is imported by server components too.)
 */
const deckRepository = new StaticDeckRepository();
const sentenceRepository = new StaticSentenceRepository();
const deckGroupRepository = new StaticDeckGroupRepository();

export const listDecks = new ListDecksUseCase(deckRepository);
export const getDeck = new GetDeckUseCase(deckRepository);
export const listSentences = new ListSentencesUseCase(sentenceRepository);
export const listDeckGroups = new ListDeckGroupsUseCase(deckGroupRepository);

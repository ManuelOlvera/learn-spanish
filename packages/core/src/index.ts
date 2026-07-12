export type { VocabularyCard } from "./domain/card";
export type { Deck } from "./domain/deck";
export type { DeckRepository } from "./domain/deck-repository";
export { DeckNotFoundError, QuizDeckTooSmallError } from "./domain/errors";
export type { RandomSource } from "./domain/random";
export type { Quiz, QuizMode, QuizRound } from "./domain/quiz";
export { createQuiz, createQuizRound, MAX_QUIZ_ROUNDS, QUIZ_CHOICE_COUNT } from "./domain/quiz";
export type { SiNoGame, SiNoRound } from "./domain/si-no";
export { createSiNoGame, SI_NO_ROUNDS, siNoQuestion } from "./domain/si-no";
export type { StarStore, StarReward } from "./domain/stars";
export {
  computeReward,
  earnedStars,
  FIRST_TIME_BONUS,
  MEAL_COST,
  MISSION_BONUS,
  PERFECT_BONUS,
  STREAK_DOUBLE_DAYS,
} from "./domain/stars";
export type { MissionKind, MissionState, MissionStore } from "./domain/mission";
export {
  activityKind,
  dailyMission,
  markMissionDone,
  MISSION_SIZE,
  missionComplete,
} from "./domain/mission";
export type { StickerTier } from "./domain/sticker-tiers";
export { stickerTier, TIER_THRESHOLDS } from "./domain/sticker-tiers";
export type { PetState, PetStore, PetSpecies, PetCollection } from "./domain/mascota";
export {
  anyPetHungry,
  defaultCollection,
  feedPet,
  isPetHungry,
  petEmoji,
  petFormEmoji,
  petMaxForm,
  PET_SPECIES,
  PET_STAGE_MEALS,
  petStage,
  speciesStages,
  STARTER_SPECIES,
} from "./domain/mascota";
export type { Accessory } from "./domain/wardrobe";
export {
  ACCESSORIES,
  buyAccessory,
  ownsAccessory,
  toggleWorn,
  wear,
  wornAccessories,
} from "./domain/wardrobe";
export type { SurpriseResult } from "./domain/surprise";
export { drawSurprise, SURPRISE_COST } from "./domain/surprise";
export type { AvatarChoice } from "./domain/avatars";
export {
  AVATAR_CATALOG,
  AVATAR_COSTS,
  avatarCost,
  isAvatarOwned,
  STARTER_AVATARS,
} from "./domain/avatars";
export type { CountingGame, CountingRound } from "./domain/counting";
export { COUNTING_ROUNDS, createCountingGame } from "./domain/counting";
export type { SpellingGame, SpellingRound } from "./domain/spelling";
export { createSpellingGame, SPELLING_ROUNDS, spellingWord } from "./domain/spelling";
export type { StickerCountsStore } from "./domain/album";
export { COMBO_MILESTONES, isComboMilestone } from "./domain/combo";
export type { SceneGame, SceneItem } from "./domain/scene";
export { createSceneGame, SCENE_ITEMS, SCENE_ROUNDS, sceneQuestion } from "./domain/scene";
export type { DuelGame, DuelRound } from "./domain/duel";
export { createDuel, DUEL_ROUNDS } from "./domain/duel";
export type { WordStat, WordStats, WordStatsStore } from "./domain/word-stats";
export {
  pickReviewCards,
  recordAnswer,
  REVIEW_MIN,
  weakScore,
} from "./domain/word-stats";
export { RecordAnswerUseCase } from "./application/record-answer";
export { GetWordStatsUseCase } from "./application/get-word-stats";
export type { ConnectBoard, ConnectGame } from "./domain/connect";
export { CONNECT_BOARDS, CONNECT_PAIRS, createConnectGame } from "./domain/connect";
export type { MemoryGame, MemoryMode, MemoryTile } from "./domain/memory";
export { createMemoryGame, MEMORY_PAIR_COUNT, tilesMatch } from "./domain/memory";
export type { ActivityId, AlbumStore } from "./domain/album";
export {
  ALL_ACTIVITIES,
  SENTENCE_ACTIVITIES,
  SENTENCES_ID,
  stickerId,
  upgradeLegacyStickers,
} from "./domain/album";
export type {
  Sentence,
  SentenceGame,
  SentenceRepository,
  SentenceRound,
} from "./domain/sentence";
export { createSentenceGame, SENTENCE_ROUNDS, sentenceText } from "./domain/sentence";
export { ListSentencesUseCase } from "./application/list-sentences";
export { StaticSentenceRepository } from "./infrastructure/static-sentence-repository";
export type { KidId } from "./domain/kid";
export { ALL_KIDS, isKidId, KID_GAME_MODES, kidForActivity } from "./domain/kid";
export type { Streak, StreakStore } from "./domain/daily";
export { advanceStreak, dailyCard, dayKey } from "./domain/daily";
export type { ProgressSnapshot } from "./domain/transfer";
export {
  decodeProgress,
  encodeProgress,
  InvalidTransferCodeError,
  mergeProgress,
} from "./domain/transfer";
export { FeedStreakUseCase } from "./application/feed-streak";
export { GetStreakUseCase } from "./application/get-streak";
export { AwardStickerUseCase } from "./application/award-sticker";
export type { AwardResult } from "./application/award-sticker";
export { GetAlbumUseCase } from "./application/get-album";
export { ListDecksUseCase } from "./application/list-decks";
export type { DeckGroup, DeckGroupRepository } from "./domain/deck-group";
export { ListDeckGroupsUseCase } from "./application/list-deck-groups";
export { StaticDeckGroupRepository } from "./infrastructure/static-deck-group-repository";
export { GetDeckUseCase } from "./application/get-deck";
export { StaticDeckRepository } from "./infrastructure/static-deck-repository";

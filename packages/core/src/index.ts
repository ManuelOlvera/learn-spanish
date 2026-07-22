export type { VocabularyCard } from "./domain/card";
export type { Deck } from "./domain/deck";
export type { DeckRepository } from "./domain/deck-repository";
export { DeckNotFoundError, QuizDeckTooSmallError } from "./domain/errors";
export type { RandomSource } from "./domain/random";
export type { Quiz, QuizMode, QuizRound } from "./domain/quiz";
export { createQuiz, createQuizRound, MAX_QUIZ_ROUNDS, QUIZ_CHOICE_COUNT } from "./domain/quiz";
export type { SiNoGame, SiNoRound } from "./domain/si-no";
export { createSiNoGame, SI_NO_ROUNDS, siNoQuestion } from "./domain/si-no";
export type { StarReward, Wallet } from "./domain/stars";
export {
  computeReward,
  earnedStars,
  EMPTY_WALLET,
  FIRST_TIME_BONUS,
  MEAL_COST,
  MISSION_BONUS,
  PERFECT_BONUS,
  STREAK_DOUBLE_DAYS,
  WALLET_EPOCH,
  WALLET_SEED_BY_AVATAR,
  walletBalance,
} from "./domain/stars";
export type { MissionKind, MissionState } from "./domain/mission";
export {
  activityKind,
  dailyMission,
  markMissionDone,
  MISSION_SIZE,
  missionComplete,
} from "./domain/mission";
export type { StickerTier } from "./domain/sticker-tiers";
export { stickerTier, TIER_THRESHOLDS } from "./domain/sticker-tiers";
export type { PetState, PetSpecies, PetCollection } from "./domain/mascota";
export {
  anyPetHungry,
  defaultCollection,
  feedPet,
  isPetHungry,
  MAX_PET_NAME,
  namePet,
  petEmoji,
  petFormEmoji,
  petMaxForm,
  PET_SPECIES,
  PET_STAGE_MEALS,
  petStage,
  speciesStages,
  STARTER_SPECIES,
} from "./domain/mascota";
export type { Celebration } from "./domain/celebrations";
export { CELEBRATIONS, pickCelebration } from "./domain/celebrations";
export type { DailyGift } from "./domain/daily-gift";
export {
  canClaimDailyGift,
  DAILY_GIFT_FREEZE_CHANCE,
  drawDailyGift,
} from "./domain/daily-gift";
export type { Accessory, AccessoryPlacement } from "./domain/wardrobe";
export {
  ACCESSORIES,
  accessoryPlacement,
  buyAccessory,
  ownsAccessory,
  placeAccessory,
  toggleWorn,
  wear,
  wornAccessories,
} from "./domain/wardrobe";
export type { SurpriseResult } from "./domain/surprise";
export { drawSurprise, SURPRISE_COST, SURPRISE_FREEZE_CHANCE } from "./domain/surprise";
export type {
  WeekProgress,
  WeeklyStreak,
  RolloverOutcome,
  RolloverResult,
} from "./domain/weekly";
export {
  ACTIVE_WEEK_DAYS,
  FREEZE_COST,
  freezesOrStarting,
  markActiveDay,
  rollWeek,
  STARTING_FREEZES,
  weekActiveDayCount,
  weekIsActive,
  weekKey,
} from "./domain/weekly";
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
  recordReviewAnswer,
  REVIEW_MIN,
  weakScore,
} from "./domain/word-stats";
export { RecordAnswerUseCase } from "./application/record-answer";
export { GetWordStatsUseCase } from "./application/get-word-stats";
export type { ConnectBoard, ConnectGame } from "./domain/connect";
export { CONNECT_BOARDS, CONNECT_PAIRS, createConnectGame } from "./domain/connect";
export type {
  MemoryGame,
  MemoryMode,
  MemoryDifficulty,
  MemoryTile,
} from "./domain/memory";
export {
  createMemoryGame,
  MEMORY_MODES,
  MEMORY_DIFFICULTIES,
  MEMORY_PAIR_COUNT,
  tilesMatch,
} from "./domain/memory";
export type { ActivityId, AlbumStore } from "./domain/album";
export {
  ALL_ACTIVITIES,
  SENTENCE_ACTIVITIES,
  SENTENCES_ID,
  stickerId,
  upgradeLegacyStickers,
} from "./domain/album";
export {
  activitiesForKid,
  categoryReward,
  categoryTier,
  categoryTierFromAlbum,
  CATEGORY_BONUS,
  pendingCategoryTier,
  tierRank,
} from "./domain/category";
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
  isCategoryAwards,
  isMissionState,
  isPetCollection,
  isWeekProgress,
  isWeeklyStreak,
  mergeProgress,
  sanitizeSnapshot,
} from "./domain/transfer";
export type { ByteSource, RemoteProgressStore } from "./domain/sync";
export {
  generatePairingCode,
  isPairingCode,
  normalizePairingCode,
} from "./domain/sync";
export { PullProgressUseCase } from "./application/pull-progress";
export { PushProgressUseCase } from "./application/push-progress";
export { DeleteProgressUseCase } from "./application/delete-progress";
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
export type { EconomyStore } from "./domain/economy";
export { EarnStarsUseCase } from "./application/earn-stars";
export { SpendStarsUseCase } from "./application/spend-stars";
export { GetMissionUseCase } from "./application/get-mission";
export type { MissionView } from "./application/get-mission";
export { MarkActivityDoneUseCase } from "./application/mark-activity-done";
export { ClaimMissionBonusUseCase } from "./application/claim-mission-bonus";
export { RolloverWeeklyUseCase } from "./application/rollover-weekly";
export type { WeeklyView } from "./application/rollover-weekly";
export { BuyFreezeUseCase } from "./application/buy-freeze";
export { FeedPetUseCase } from "./application/feed-pet";
export { NamePetUseCase } from "./application/name-pet";
export { ClaimDailyGiftUseCase } from "./application/claim-daily-gift";
export { AdoptSpeciesUseCase } from "./application/adopt-species";
export { SetActiveSpeciesUseCase } from "./application/set-active-species";
export { BuyAccessoryUseCase } from "./application/buy-accessory";
export { ToggleAccessoryUseCase } from "./application/toggle-accessory";
export { PlaceAccessoryUseCase } from "./application/place-accessory";
export { OpenSurpriseUseCase } from "./application/open-surprise";
export { BuyAvatarUseCase } from "./application/buy-avatar";
export { UnlockDeckUseCase } from "./application/unlock-deck";
export { ClaimCategoryRewardUseCase } from "./application/claim-category-reward";
export { SaveRetoBestUseCase } from "./application/save-reto-best";
export type { TrendHistory, TrendSample, TrendStore } from "./domain/trend";
export {
  isLearnedStat,
  learnedCount,
  learnedThisWeek,
  recordSample,
  TREND_WEEKS_CAP,
} from "./domain/trend";
export { SampleTrendUseCase } from "./application/sample-trend";
export type { SopaDifficulty, SopaGame, SopaWord } from "./domain/sopa";
export {
  createSopaGame,
  findSopaWord,
  gridWord,
  lineBetween,
  SOPA_BOARDS,
  SOPA_DIFFICULTIES,
  sopaDifficulties,
} from "./domain/sopa";
export type { LetterCase } from "./domain/letters";
export {
  applyLetterCase,
  buildAlphabetDeck,
  isCasePairGlyph,
  isLetterCase,
  LETTER_CASES,
  LETTER_DECK_IDS,
} from "./domain/letters";

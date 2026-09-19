import type { Boost } from "../src/domain/boost";
import type { ParentChallenge } from "../src/domain/challenge";
import type { EconomyStore } from "../src/domain/economy";
import type { ExamPractice, ExamRecords } from "../src/domain/exam";
import type { KidId } from "../src/domain/kid";
import type { PetCollection } from "../src/domain/mascota";
import type { MissionState } from "../src/domain/mission";
import { EMPTY_WALLET, walletBalance, type Wallet } from "../src/domain/stars";
import type { StickerTier } from "../src/domain/sticker-tiers";
import type { WeekProgress, WeeklyStreak } from "../src/domain/weekly";

/** In-memory EconomyStore for the use-case tests — one fake for one port, so
 *  a new field on the port fails to compile here rather than in six places. */
export class FakeEconomyStore implements EconomyStore {
  walletsByKid: Partial<Record<KidId, Wallet>> = {};
  freezesByKid: Partial<Record<KidId, number>> = {};
  missions: Partial<Record<KidId, MissionState>> = {};
  weeklyByKid: Partial<Record<KidId, WeeklyStreak>> = {};
  progressByKid: Partial<Record<KidId, WeekProgress>> = {};
  collections: Partial<Record<KidId, PetCollection>> = {};
  accessoriesByKid: Partial<Record<KidId, readonly string[]>> = {};
  avatarsByKid: Partial<Record<KidId, readonly string[]>> = {};
  decksByKid: Partial<Record<KidId, readonly string[]>> = {};
  counts: Readonly<Record<string, number>> = {};
  awardsByKid: Partial<Record<KidId, Readonly<Record<string, StickerTier>>>> = {};
  retoByKid: Partial<Record<KidId, Readonly<Record<string, number>>>> = {};

  loadWallet(kid: KidId) { return this.walletsByKid[kid] ?? EMPTY_WALLET; }
  saveWallet(kid: KidId, wallet: Wallet) { this.walletsByKid[kid] = wallet; }
  // Test conveniences over the counter wallet (the port speaks Wallet only).
  loadStars(kid: KidId) { return walletBalance(this.loadWallet(kid)); }
  saveStars(kid: KidId, stars: number) { this.saveWallet(kid, { earned: stars, spent: 0 }); }
  loadFreezes(kid: KidId) { return this.freezesByKid[kid] ?? null; }
  saveFreezes(kid: KidId, count: number) { this.freezesByKid[kid] = count; }
  loadMission(kid: KidId) { return this.missions[kid] ?? null; }
  saveMission(kid: KidId, state: MissionState) { this.missions[kid] = state; }
  loadWeekly(kid: KidId) { return this.weeklyByKid[kid] ?? null; }
  saveWeekly(kid: KidId, streak: WeeklyStreak) { this.weeklyByKid[kid] = streak; }
  loadWeekProgress(kid: KidId) { return this.progressByKid[kid] ?? null; }
  saveWeekProgress(kid: KidId, progress: WeekProgress) { this.progressByKid[kid] = progress; }
  loadPetCollection(kid: KidId) { return this.collections[kid] ?? null; }
  savePetCollection(kid: KidId, collection: PetCollection) { this.collections[kid] = collection; }
  loadOwnedAccessories(kid: KidId) { return this.accessoriesByKid[kid] ?? []; }
  saveOwnedAccessories(kid: KidId, owned: readonly string[]) { this.accessoriesByKid[kid] = owned; }
  loadOwnedAvatars(kid: KidId) { return this.avatarsByKid[kid] ?? []; }
  saveOwnedAvatars(kid: KidId, owned: readonly string[]) { this.avatarsByKid[kid] = owned; }
  loadUnlockedDecks(kid: KidId) { return this.decksByKid[kid] ?? []; }
  saveUnlockedDecks(kid: KidId, decks: readonly string[]) { this.decksByKid[kid] = decks; }
  loadStickerCounts() { return this.counts; }
  saveStickerCounts(counts: Readonly<Record<string, number>>) { this.counts = counts; }
  loadCategoryAwards(kid: KidId) { return this.awardsByKid[kid] ?? {}; }
  saveCategoryAwards(kid: KidId, awards: Readonly<Record<string, StickerTier>>) { this.awardsByKid[kid] = awards; }
  challengeByKid: Partial<Record<KidId, ParentChallenge | null>> = {};
  loadChallenge(kid: KidId) { return this.challengeByKid[kid] ?? null; }
  saveChallenge(kid: KidId, challenge: ParentChallenge | null) { this.challengeByKid[kid] = challenge; }
  loadRetoBest(kid: KidId) { return this.retoByKid[kid] ?? {}; }
  saveRetoBest(kid: KidId, best: Readonly<Record<string, number>>) { this.retoByKid[kid] = best; }
  dailyGiftByKid: Partial<Record<KidId, string>> = {};
  loadDailyGiftDay(kid: KidId) { return this.dailyGiftByKid[kid] ?? null; }
  saveDailyGiftDay(kid: KidId, day: string) { this.dailyGiftByKid[kid] = day; }
  examsByKid: Partial<Record<KidId, ExamRecords>> = {};
  loadExamRecords(kid: KidId) { return this.examsByKid[kid] ?? {}; }
  saveExamRecords(kid: KidId, records: ExamRecords) { this.examsByKid[kid] = records; }
  unlockedShelvesByKid: Partial<Record<KidId, readonly string[]>> = {};
  loadUnlockedShelves(kid: KidId) { return this.unlockedShelvesByKid[kid] ?? []; }
  saveUnlockedShelves(kid: KidId, shelves: readonly string[]) { this.unlockedShelvesByKid[kid] = shelves; }
  practiceByKid: Partial<Record<KidId, ExamPractice | null>> = {};
  loadExamPractice(kid: KidId) { return this.practiceByKid[kid] ?? null; }
  saveExamPractice(kid: KidId, practice: ExamPractice | null) { this.practiceByKid[kid] = practice; }
  boostByKid: Partial<Record<KidId, Boost>> = {};
  loadBoost(kid: KidId) { return this.boostByKid[kid] ?? null; }
  saveBoost(kid: KidId, boost: Boost) { this.boostByKid[kid] = boost; }
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  activityKind,
  boostedReward,
  computeReward,
  earnableActivities,
  kidForActivity,
  petFormEmoji,
  petMaxForm,
  pickCelebration,
  SENTENCE_ACTIVITIES,
  SENTENCES_ID,
  STORIES_ID,
  STORY_ACTIVITIES,
  type ActivityId,
  type AwardResult,
  type BoostTier,
  type Deck,
  type StarReward,
  type StickerTier,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import {
  awardSticker,
  getAlbum,
  getStreak,
  sampleTrend,
} from "@/lib/client-container";
import { getSelectedKid } from "@/lib/kid";
import {
  addStars,
  claimCategoryReward,
  noteChallengeActivity,
  getActiveBoost,
  getActivePet,
  getCategoryTier,
  getPetCollection,
  markActivityDone,
} from "@/lib/economy";
import { speakSpanish } from "@/lib/speech";
import { syncPush } from "@/lib/sync";
import { ACTIVITY_META } from "@/lib/activity-theme";
import { feedbackFanfare, feedbackSticker } from "@/lib/feedback";
import { Confetti } from "@/components/Confetti";
import { CategoryBurst } from "@/components/CategoryBurst";
import { StarChest, type ChestBonus } from "@/components/StarChest";
import { useKidLevels } from "@/lib/use-kid-levels";

interface Props {
  /** Which album section the sticker files under (a deck id, or "frases"). */
  stickerDeckId: string;
  /** The deck itself, when the section is one — only its earnable-activity set
   *  is wanted. A learn-only deck's category is a single sticker deep, and
   *  without the deck the chest measured it against six slots it could never
   *  fill, so finishing the verbs' flashcards paid nothing. Absent for the
   *  pack-wide sections (las frases, los cuentos), which branch below. */
  deck?: Deck;
  activity: ActivityId;
  onReplay: () => void;
  /** Where "more games" lives for this activity. */
  back: { href: string; emoji: string; label: string };
  /** Repaso sessions celebrate without touching the album. */
  noAward?: boolean;
  /** First-try correct answers this run — becomes the chest's stars. */
  firstTryCount?: number;
  /** Wrong taps this run — each docks a star, so guessing can't farm stars. */
  mistakeCount?: number;
  /** Round count for round-based games — enables the "perfect" bonus. */
  totalRounds?: number;
}

/**
 * The shared 🎉 ¡Muy bien! ending. Finishing any activity awards its sticker
 * here — the one call site for the award use case in the UI.
 */
export function DoneScreen({
  stickerDeckId,
  deck,
  activity,
  onReplay,
  back,
  noAward = false,
  firstTryCount = 0,
  mistakeCount = 0,
  totalRounds,
}: Props) {
  const [award, setAward] = useState<AwardResult | null>(null);
  const [streakDays, setStreakDays] = useState<number | null>(null);
  // ⚡ La hora doble, read once on mount and then held: undefined while still
  // reading, null for no window. Holding it is the point — the multiplier is
  // decided when the chest is computed, so a window that closes while the kid
  // admires the chest still pays what they were shown.
  const [boostTier, setBoostTier] = useState<BoostTier | null | undefined>(
    undefined,
  );
  // The win cheer — one draw per mount, so it varies finish to finish but never
  // changes mid-screen (see domain/celebrations.ts).
  const celebration = useMemo(() => pickCelebration(Math.random), []);
  // The kid's active pet, shown cheering alongside the celebration.
  const [pet, setPet] = useState<{ emoji: string; name?: string } | null>(null);
  // How hard la mascota celebrates: set when the chest is opened, from the size
  // of the haul. The pet is what the stars are FOR, so it reacting to the chest
  // is what ties the reward to the thing being saved for. 0 = not opened yet.
  const [petHops, setPetHops] = useState(0);
  // Set when this finish also completed (or levelled up) the whole category.
  const [categoryPrize, setCategoryPrize] = useState<{
    tier: Exclude<StickerTier, "none">;
    bonus: number;
  } | null>(null);
  const meta = ACTIVITY_META[activity];

  // The chest waits until the streak (and, for sticker games, the award) have
  // loaded, so its amount includes every bonus and never changes after render.
  const ready =
    streakDays !== null && boostTier !== undefined && (noAward || award !== null);
  // Memoised because the chest holds it: StarChest stages its reveal on timers
  // keyed to this object, and a fresh reward on every unrelated re-render would
  // restart the count-up mid-animation. The inputs are all settled by the time
  // `ready` flips, so this computes once and then holds — which is also what
  // ADR 014 requires of the multiplier.
  // The chest measures completion against the level she plays at now.
  const levels = useKidLevels();

  const isNew = award?.isNew ?? false;
  const reward: StarReward | null = useMemo(
    () =>
      ready
        ? boostedReward(
            computeReward({
              firstTryCorrect: firstTryCount,
              mistakes: mistakeCount,
              totalRounds,
              streakDays: streakDays ?? 0,
              firstTime: isNew,
            }),
            boostTier ?? null,
          )
        : null,
    [ready, firstTryCount, mistakeCount, totalRounds, streakDays, isNew, boostTier],
  );

  useEffect(() => {
    feedbackFanfare();
    // Completing the activity feeds today's mission either way.
    const kid = getSelectedKid() ?? kidForActivity(activity) ?? "listener";
    markActivityDone(kid, activityKind(activity));
    // El reto de papá completes on *any* activity for its deck, so it folds in
    // here beside the misión rather than in each player.
    noteChallengeActivity(kid, stickerDeckId);
    setBoostTier(getActiveBoost(kid)?.tier ?? null);
    getStreak
      .execute(kid)
      .then((s) => setStreakDays(s?.count ?? 0))
      .catch(() => setStreakDays(0));
    // Take this week's trend sample here rather than only when a parent opens
    // the informe: sampling on the report meant weeks nobody looked simply had
    // no bar, and the gap between two distant samples was then labelled "esta
    // semana". Idempotent within a week, so finishing ten games costs one write.
    void sampleTrend.execute(kid, new Date());
    // Push the completion itself — the sticker and misión mark are banked the
    // moment this screen mounts, and a kid may leave without ever opening the
    // chest (which pushes again with the stars when it is opened).
    void syncPush();
  }, [activity, noAward, stickerDeckId]);

  useEffect(() => {
    if (award?.isNew) {
      feedbackSticker();
    }
  }, [award]);

  // The pet cheers with the kid: load its current face and speak the cheer.
  // Speech is allowed here — the taps that finished the game count as the user
  // gesture browsers require — and is non-critical if a browser still blocks it.
  useEffect(() => {
    const kid = getSelectedKid() ?? kidForActivity(activity) ?? "listener";
    const collection = getPetCollection(kid);
    const active = getActivePet(kid);
    const maxForm = petMaxForm(collection.active, active.meals);
    setPet({
      emoji: petFormEmoji(
        collection.active,
        Math.min(active.form ?? Infinity, maxForm),
      ),
      name: active.name,
    });
    speakSpanish(celebration.phrase);
  }, [activity, celebration]);

  useEffect(() => {
    if (noAward) {
      return;
    }
    let cancelled = false;
    // Award the selected kid; on a mode-specific deep link with no kid ever
    // picked, the activity's own difficulty names the right album.
    const kid = getSelectedKid() ?? kidForActivity(activity) ?? "listener";
    awardSticker
      .execute(kid, stickerDeckId, activity)
      .then(async (result) => {
        if (cancelled) {
          return;
        }
        setAward(result);
        // Did this finish complete — or level up — the whole category? The
        // just-earned sticker is now in the album and its count is saved, so
        // recompute the category's tier and open its chest if it advanced.
        // Pack-wide sections own a short activity list of their own; a deck
        // owns the full one. Getting this wrong makes a category that can
        // never complete, so it is keyed off the same ids the album renders.
        const activities =
          stickerDeckId === SENTENCES_ID
            ? SENTENCE_ACTIVITIES
            : stickerDeckId === STORIES_ID
              ? STORY_ACTIVITIES
              : earnableActivities(deck, kid, levels);
        const earned = new Set(await getAlbum.execute(kid));
        const tier = getCategoryTier(kid, stickerDeckId, activities, earned);
        if (tier === "none") {
          return;
        }
        const bonus = claimCategoryReward(kid, stickerDeckId, tier);
        if (!cancelled && bonus !== null) {
          setCategoryPrize({ tier, bonus });
          // Bank the completion chest + award ledger up to the cloud now.
          void syncPush();
        }
      })
      .catch((err: unknown) => {
        log.error("album", "failed to award sticker", { err });
      });
    return () => {
      cancelled = true;
    };
    // `levels` is read here but deliberately *not* a dependency: the award
    // runs once when the screen mounts, and a level read landing a frame later
    // must not re-run it and re-award the sticker. The value it needs is
    // settled before the kid can ever reach this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stickerDeckId, deck, activity, noAward]);

  // The chest's breakdown, memoised so StarChest's reveal timers aren't
  // restarted by an unrelated re-render mid-animation.
  const bonuses = useMemo<readonly ChestBonus[]>(() => {
    if (reward === null) {
      return [];
    }
    const chips: ChestBonus[] = [];
    if (reward.perfect > 0) {
      chips.push({ key: "perfect", emoji: "✨", label: "¡Perfecto!", amount: reward.perfect });
    }
    if (reward.streak > 0) {
      chips.push({ key: "streak", emoji: "🔥", label: "Racha", amount: reward.streak });
    }
    if (reward.firstTime > 0) {
      chips.push({ key: "firstTime", emoji: "🆕", label: "Nuevo", amount: reward.firstTime });
    }
    return chips;
  }, [reward]);

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
      {categoryPrize !== null && (
        <CategoryBurst
          tier={categoryPrize.tier}
          bonus={categoryPrize.bonus}
          categoryEmoji={back.emoji}
          onDone={() => setCategoryPrize(null)}
        />
      )}
      <Confetti />
      <div className="flex items-center justify-center gap-3">
        <div aria-hidden className="pop-in text-8xl">
          {celebration.emoji}
        </div>
        {pet !== null && (
          <div
            aria-label={
              pet.name ? `${pet.name} is cheering` : "Your pet is cheering"
            }
            // Idles with the same wiggle as before until the chest is opened,
            // then hops — more hops for a fatter chest.
            className={petHops > 0 ? "pet-cheer text-7xl" : "chest-tease text-7xl"}
            style={
              petHops > 0
                ? ({ "--cheer-hops": petHops } as React.CSSProperties)
                : undefined
            }
          >
            {pet.emoji}
          </div>
        )}
      </div>
      <h1 className="text-5xl font-extrabold">{celebration.phrase}</h1>
      {pet?.name && (
        <p aria-hidden className="-mt-6 text-xl font-extrabold text-ink/50">
          {pet.name} 🎉
        </p>
      )}

      {award !== null && (award.isNew || award.tierUp) && (
        <div
          className="sticker pop-in relative flex items-center gap-3 px-6 py-3"
          aria-label={
            award.isNew
              ? `New sticker earned: ${meta.english}`
              : `Sticker upgraded to ${award.tier}: ${meta.english}`
          }
          style={
            award.tier === "gold"
              ? ({ "--sticker-face": "#fde68a" } as React.CSSProperties)
              : award.tier === "silver"
                ? ({ "--sticker-face": "#e5e7eb" } as React.CSSProperties)
                : undefined
          }
        >
          <span aria-hidden className="sticker-peel" />
          <span aria-hidden className="text-4xl">
            {meta.game}
            {meta.mode}
          </span>
          <span className="text-2xl font-extrabold">
            {award.isNew
              ? "¡Nueva pegatina!"
              : award.tier === "gold"
                ? "¡Pegatina de oro! 🥇"
                : "¡Pegatina de plata! 🥈"}
          </span>
        </div>
      )}

      {reward !== null && (
        <div className="flex flex-col items-center gap-2">
          {boostTier != null && (
            // Why this chest is fat. Sits above it, in the same yellow as the
            // home badge, so the two read as the same thing happening.
            <div
              aria-label={`La hora doble: this chest is worth ${boostTier} times as much`}
              className="pop-in flex items-center gap-2 rounded-full border-4 border-ink px-5 py-1 text-2xl font-extrabold"
              style={{ background: "#facc15" }}
            >
              {/* No wiggle here: the closed chest below already has the one
                  attention-seeking animation this screen is allowed. */}
              <span aria-hidden>⚡</span>
              <span aria-hidden>x{boostTier}</span>
            </div>
          )}
          {/* The chips used to sit here, visible before the chest was even
              opened — which gave the reward away and left the tap with nothing
              to reveal. They now belong to the chest and land one at a time on
              top of the counting total. */}
          <StarChest
            amount={reward.total}
            bonuses={bonuses}
            onOpen={() => {
              const kid = getSelectedKid() ?? kidForActivity(activity) ?? "listener";
              addStars(kid, reward.total);
              // Game complete + rewards banked: push the new state up (no-op
              // when unpaired). A failed push retries on the next app open.
              void syncPush();
            }}
            onOpened={(total) => {
              // 2 hops for a floor chest, up to 5 for a big one.
              setPetHops(Math.min(5, 2 + Math.floor(total / 20)));
            }}
          />
        </div>
      )}

      <div data-chest-exit className="flex gap-6">
        <button
          type="button"
          onClick={onReplay}
          aria-label="Play again"
          className="sticker flex h-24 w-24 items-center justify-center text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🔁
        </button>
        <Link
          href={back.href}
          aria-label={back.label}
          className="sticker flex h-24 w-24 items-center justify-center text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          {back.emoji}
        </Link>
        <Link
          href="/album"
          aria-label="Open the sticker album"
          className="sticker flex h-24 w-24 items-center justify-center text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          📔
        </Link>
      </div>
    </section>
  );
}

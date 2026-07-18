"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  activityKind,
  ALL_ACTIVITIES,
  computeReward,
  kidForActivity,
  petFormEmoji,
  petMaxForm,
  pickCelebration,
  SENTENCE_ACTIVITIES,
  SENTENCES_ID,
  type ActivityId,
  type AwardResult,
  type StarReward,
  type StickerTier,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { awardSticker, getAlbum, getStreak } from "@/lib/client-container";
import { getSelectedKid } from "@/lib/kid";
import {
  addStars,
  claimCategoryReward,
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
import { StarChest } from "@/components/StarChest";

interface Props {
  /** Which album section the sticker files under (a deck id, or "frases"). */
  stickerDeckId: string;
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
  // The win cheer — one draw per mount, so it varies finish to finish but never
  // changes mid-screen (see domain/celebrations.ts).
  const celebration = useMemo(() => pickCelebration(Math.random), []);
  // The kid's active pet, shown cheering alongside the celebration.
  const [pet, setPet] = useState<{ emoji: string; name?: string } | null>(null);
  // Set when this finish also completed (or levelled up) the whole category.
  const [categoryPrize, setCategoryPrize] = useState<{
    tier: Exclude<StickerTier, "none">;
    bonus: number;
  } | null>(null);
  const meta = ACTIVITY_META[activity];

  // The chest waits until the streak (and, for sticker games, the award) have
  // loaded, so its amount includes every bonus and never changes after render.
  const ready = streakDays !== null && (noAward || award !== null);
  const reward: StarReward | null = ready
    ? computeReward({
        firstTryCorrect: firstTryCount,
        mistakes: mistakeCount,
        totalRounds,
        streakDays: streakDays ?? 0,
        firstTime: award?.isNew ?? false,
      })
    : null;

  useEffect(() => {
    feedbackFanfare();
    // Completing the activity feeds today's mission either way.
    const kid = getSelectedKid() ?? kidForActivity(activity) ?? "listener";
    markActivityDone(kid, activityKind(activity));
    getStreak
      .execute(kid)
      .then((s) => setStreakDays(s?.count ?? 0))
      .catch(() => setStreakDays(0));
    // Push the completion itself — the sticker and misión mark are banked the
    // moment this screen mounts, and a kid may leave without ever opening the
    // chest (which pushes again with the stars when it is opened).
    void syncPush();
  }, [activity, noAward]);

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
        const activities =
          stickerDeckId === SENTENCES_ID ? SENTENCE_ACTIVITIES : ALL_ACTIVITIES;
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
  }, [stickerDeckId, activity, noAward]);

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
            className="chest-tease text-7xl"
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
          <StarChest
            amount={reward.total}
            onOpen={() => {
              const kid = getSelectedKid() ?? kidForActivity(activity) ?? "listener";
              addStars(kid, reward.total);
              // Game complete + rewards banked: push the new state up (no-op
              // when unpaired). A failed push retries on the next app open.
              void syncPush();
            }}
          />
          {(reward.perfect > 0 || reward.streak > 0 || reward.firstTime > 0) && (
            <div className="flex flex-wrap justify-center gap-2 text-sm font-extrabold">
              {reward.perfect > 0 && (
                <span className="rounded-full border-2 border-ink bg-white px-3 py-0.5">
                  ✨ ¡Perfecto! +{reward.perfect}
                </span>
              )}
              {reward.streak > 0 && (
                <span className="rounded-full border-2 border-ink bg-white px-3 py-0.5">
                  🔥 Racha +{reward.streak}
                </span>
              )}
              {reward.firstTime > 0 && (
                <span className="rounded-full border-2 border-ink bg-white px-3 py-0.5">
                  🆕 +{reward.firstTime}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-6">
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

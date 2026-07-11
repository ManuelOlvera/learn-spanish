"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  activityKind,
  earnedStars,
  kidForActivity,
  type ActivityId,
  type AwardResult,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { awardSticker } from "@/lib/album";
import { getSelectedKid } from "@/lib/kid";
import { addStars, markActivityDone } from "@/lib/economy";
import { ACTIVITY_META } from "@/lib/activity-theme";
import { feedbackFanfare, feedbackSticker } from "@/lib/feedback";
import { Confetti } from "@/components/Confetti";
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
}: Props) {
  const [award, setAward] = useState<AwardResult | null>(null);
  const meta = ACTIVITY_META[activity];
  const stars = earnedStars(firstTryCount);

  useEffect(() => {
    feedbackFanfare();
    // Completing the activity feeds today's mission either way.
    const kid = getSelectedKid() ?? kidForActivity(activity) ?? "listener";
    markActivityDone(kid, activityKind(activity));
  }, [activity]);

  useEffect(() => {
    if (award?.isNew) {
      feedbackSticker();
    }
  }, [award]);

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
      .then((result) => {
        if (!cancelled) {
          setAward(result);
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
      <Confetti />
      <div aria-hidden className="pop-in text-8xl">
        🎉
      </div>
      <h1 className="text-5xl font-extrabold">¡Muy bien!</h1>

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

      <StarChest
        amount={stars}
        onOpen={() => {
          const kid = getSelectedKid() ?? kidForActivity(activity) ?? "listener";
          addStars(kid, stars);
        }}
      />

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

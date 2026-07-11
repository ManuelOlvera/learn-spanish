"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  kidForActivity,
  type ActivityId,
  type AwardResult,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { awardSticker } from "@/lib/album";
import { getSelectedKid } from "@/lib/kid";
import { ACTIVITY_META } from "@/lib/activity-theme";
import { feedbackFanfare, feedbackSticker } from "@/lib/feedback";
import { Confetti } from "@/components/Confetti";

interface Props {
  /** Which album section the sticker files under (a deck id, or "frases"). */
  stickerDeckId: string;
  activity: ActivityId;
  onReplay: () => void;
  /** Where "more games" lives for this activity. */
  back: { href: string; emoji: string; label: string };
  /** Repaso sessions celebrate without touching the album. */
  noAward?: boolean;
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
}: Props) {
  const [award, setAward] = useState<AwardResult | null>(null);
  const meta = ACTIVITY_META[activity];

  useEffect(() => {
    feedbackFanfare();
  }, []);

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

      {award?.isNew && (
        <div
          className="sticker pop-in relative flex items-center gap-3 px-6 py-3"
          aria-label={`New sticker earned: ${meta.english}`}
        >
          <span aria-hidden className="sticker-peel" />
          <span aria-hidden className="text-4xl">
            {meta.game}
            {meta.mode}
          </span>
          <span className="text-2xl font-extrabold">¡Nueva pegatina!</span>
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

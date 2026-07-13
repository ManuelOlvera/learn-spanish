"use client";

import {
  ACTIVE_WEEK_DAYS,
  FREEZE_COST,
  type WeeklyView,
} from "@learn-spanish/core";
import { useDeniedWobble } from "@/lib/use-denied-wobble";

interface Props {
  weekly: WeeklyView;
  stars: number;
  /** Try to buy one ❄️; returns false when refused (the card then wobbles). */
  onBuyFreeze: () => boolean;
}

/** The home screen's Semana card: the weekly streak, this week's active-day
 *  dots, and the buy-a-freeze button. */
export function WeeklyCard({ weekly, stars, onBuyFreeze }: Props) {
  const wobble = useDeniedWobble();

  return (
    <div
      className="sticker relative flex w-full max-w-md items-center justify-between gap-3 px-5 py-3"
      aria-label={`Weekly streak: ${weekly.count} weeks, ${weekly.activeDays} of ${ACTIVE_WEEK_DAYS} days this week, ${weekly.freezes} freezes`}
    >
      <span aria-hidden className="sticker-peel" />
      <span className="flex items-center gap-2">
        <span aria-hidden className="text-3xl">
          🔥
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-lg font-extrabold">Semana {weekly.count}</span>
          <span aria-hidden className="mt-1 flex gap-1">
            {Array.from({ length: ACTIVE_WEEK_DAYS }, (_, i) => (
              <span
                key={i}
                className={`h-3 w-3 rounded-full border-2 border-ink ${
                  i < weekly.activeDays ? "bg-[var(--color-lime)]" : "bg-white"
                }`}
              />
            ))}
          </span>
        </span>
      </span>
      <button
        type="button"
        key={`freeze-${wobble.nonce}`}
        onClick={() => {
          if (!onBuyFreeze()) {
            wobble.deny();
          }
        }}
        aria-label={`Buy a freeze for ${FREEZE_COST} stars — you have ${weekly.freezes}`}
        className={`sticker flex items-center gap-1 px-3 py-2 text-lg font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none ${
          stars < FREEZE_COST ? "wobble" : ""
        }`}
        style={{ "--accent": "#7dd3fc" } as React.CSSProperties}
      >
        <span aria-hidden className="text-2xl">
          ❄️
        </span>
        <span>{weekly.freezes}</span>
        <span
          aria-hidden
          className="ml-1 rounded-full border-2 border-ink bg-white px-2 text-sm"
        >
          +{FREEZE_COST}⭐
        </span>
      </button>
    </div>
  );
}

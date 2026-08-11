"use client";

import { useEffect, useState } from "react";
import type { Boost, KidId } from "@learn-spanish/core";
import { getActiveBoost, getBoostRemaining } from "@/lib/economy";

/** How often the bar redraws. A 15-minute window loses ~0.6% per tick, which
 *  is a bar that visibly creeps rather than one that jumps — and five seconds
 *  of stale is invisible to a 4-year-old. */
const TICK_MS = 5_000;

interface Props {
  kid: KidId;
  /** Bumped by the parent when a gift or box may have opened a new window. */
  nonce?: number;
}

/** ⚡ La hora doble, on the home screen: how a kid knows their chests are worth
 *  double right now. Picture-first — lightning bolts for the multiplier and a
 *  bar that drains, because a countdown in minutes is unreadable to a
 *  pre-reader. It is a status, not an action: nothing here is tappable.
 *  Renders nothing at all when no window is running. */
export function BoostBadge({ kid, nonce = 0 }: Props) {
  const [boost, setBoost] = useState<Boost | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const read = () => {
      setBoost(getActiveBoost(kid));
      setRemaining(getBoostRemaining(kid));
    };
    read();
    // The window closes on the clock, so the badge re-reads on a timer rather
    // than waiting for an interaction that may never come.
    const timer = setInterval(read, TICK_MS);
    return () => clearInterval(timer);
  }, [kid, nonce]);

  if (boost === null) {
    return null;
  }

  return (
    <div
      aria-label={`La hora doble: your treasure chests are worth ${boost.tier} times as much right now`}
      className="sticker pop-in relative flex w-full max-w-md flex-col items-center gap-2 px-6 py-3"
      style={{ "--accent": "#facc15" } as React.CSSProperties}
    >
      <span aria-hidden className="sticker-peel" />
      <span aria-hidden className="flex items-center gap-2 text-3xl font-extrabold">
        {/* Still, not wiggling: the 🎁 gift button beside it is the screen's one
            attention-seeking animation, and this is status, not an action. */}
        <span>⚡</span>
        <span>x{boost.tier}</span>
        <span className="text-4xl">⭐</span>
      </span>
      <span className="text-xs font-bold uppercase tracking-wide text-ink/40">
        La hora doble
      </span>
      {/* The clock, drawn as a bar: full when won, empty when it ends. */}
      <span
        aria-hidden
        className="h-4 w-full overflow-hidden rounded-full border-4 border-ink bg-white"
      >
        <span
          className="block h-full rounded-full transition-[width] duration-1000 ease-linear"
          style={{
            width: `${Math.round(remaining * 100)}%`,
            background: "#facc15",
          }}
        />
      </span>
    </div>
  );
}

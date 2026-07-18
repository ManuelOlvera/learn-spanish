"use client";

import { useEffect } from "react";
import type { DailyGift } from "@learn-spanish/core";
import { Confetti } from "@/components/Confetti";

interface Props {
  /** The gift just drawn — shown as its reward (stars or a ❄️). */
  gift: DailyGift;
  onDone: () => void;
}

/** El regalo del día payoff: the present bursts open into its reward with
 *  confetti — a small daily delight, picture-only and tap-to-dismiss. Auto-
 *  dismisses after a beat so a distracted kid is never stuck on it. */
export function GiftReveal({ gift, onDone }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDone, 4500);
    return () => clearTimeout(timer);
  }, [onDone]);

  const spoils =
    gift.type === "freeze" ? "a snowflake shield" : `${gift.amount} stars`;

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={`El regalo del día: you got ${spoils} — tap to continue`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-ink)_45%,transparent)] p-6"
    >
      <Confetti />
      <span className="pop-in flex flex-col items-center gap-4">
        <span className="wobble text-9xl drop-shadow-[4px_4px_0_var(--color-ink)]">
          🎁
        </span>
        <span
          className="rounded-3xl border-4 border-ink px-8 py-3 text-3xl font-extrabold"
          style={{ background: "var(--color-lime)" }}
        >
          ¡El regalo del día!
        </span>
        <span className="flex items-center gap-2 rounded-full border-4 border-ink bg-white px-6 py-1 text-3xl font-extrabold">
          {gift.type === "freeze" ? (
            <span aria-hidden>❄️</span>
          ) : (
            <>
              <span aria-hidden>⭐</span>
              <span>+{gift.amount}</span>
            </>
          )}
        </span>
      </span>
    </button>
  );
}

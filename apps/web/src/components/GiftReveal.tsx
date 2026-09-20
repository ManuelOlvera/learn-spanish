"use client";

import { useEffect, useRef } from "react";
import type { DailyGift } from "@learn-spanish/core";
import { Confetti } from "@/components/Confetti";
import { feedbackPop } from "@/lib/feedback";

interface Props {
  /** The gift just drawn — shown as its reward (stars or a ❄️). */
  gift: DailyGift;
  onDone: () => void;
}

/** El regalo del día payoff: the present bursts open into its reward with
 *  confetti — a small daily delight, picture-only and tap-to-dismiss. Auto-
 *  dismisses after a beat so a distracted kid is never stuck on it. */
export function GiftReveal({ gift, onDone }: Props) {
  // Mount only, and deliberately *not* in the effect below: every call site
  // passes an inline arrow for `onDone`, so that effect re-runs on each parent
  // render. Keying the sound to it would replay it on every re-render.
  useEffect(() => {
    // The gift bursting open — the same pop el globo uses, and for the same reason.
    feedbackPop();
  }, []);

  // The callback is held in a ref rather than named as a dependency: every
  // call site passes an inline arrow, so a dependency on it restarts this
  // timer on each parent render — and a parent that re-renders faster than
  // the delay means it never fires at all. Reproduced 2026-09-21 by firing
  // `visibilitychange` (which `useCamino` listens for) during the ceremony.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const timer = setTimeout(() => onDoneRef.current(), 4500);
    return () => clearTimeout(timer);
  }, []);

  const spoils =
    gift.type === "freeze"
      ? "a snowflake shield"
      : gift.type === "boost"
        ? `la hora doble — chests worth ${gift.tier} times as much for a while`
        : `${gift.amount} stars`;

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
          ) : gift.type === "boost" ? (
            // The prize is a promise, not a payout: the bolt and the multiplier
            // say "your next chests are bigger" with no number to read.
            <>
              <span aria-hidden>⚡</span>
              <span>x{gift.tier}</span>
              <span aria-hidden>⭐</span>
            </>
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

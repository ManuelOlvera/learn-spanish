"use client";

import { useEffect } from "react";
import { Confetti } from "@/components/Confetti";
import { feedbackFanfare } from "@/lib/feedback";

interface Props {
  /** Stars the mission chest just paid out — shown on the prize badge. */
  bonus: number;
  onDone: () => void;
}

/** The daily-mission payoff: a full-screen, tap-to-dismiss trophy moment with
 *  confetti and the star bonus. Bigger than the little chest swap it replaces —
 *  finishing all three of the day's activities is the biggest thing a kid does
 *  here, so it gets the loudest celebration. Auto-dismisses so a distracted kid
 *  is never stuck. */
export function MissionBurst({ bonus, onDone }: Props) {
  // Mount only, and deliberately *not* in the effect below: every call site
  // passes an inline arrow for `onDone`, so that effect re-runs on each parent
  // render. Keying the sound to it would replay it on every re-render.
  useEffect(() => {
    // The day's three tasks done — the fanfare the done screen already uses.
    feedbackFanfare();
  }, []);

  useEffect(() => {
    const timer = setTimeout(onDone, 4500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={`¡Misión cumplida! You earned ${bonus} stars — tap to continue`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-ink)_45%,transparent)] p-6"
    >
      <Confetti />
      <span className="pop-in flex flex-col items-center gap-4">
        <span className="wobble text-9xl drop-shadow-[4px_4px_0_var(--color-ink)]">
          🏆
        </span>
        <span
          className="rounded-3xl border-4 border-ink px-8 py-3 text-4xl font-extrabold"
          style={{ background: "var(--color-lime)" }}
        >
          ¡Misión cumplida!
        </span>
        <span className="flex items-center gap-2 rounded-full border-4 border-ink bg-white px-6 py-1 text-3xl font-extrabold">
          <span aria-hidden>⭐</span>
          <span>+{bonus}</span>
        </span>
      </span>
    </button>
  );
}

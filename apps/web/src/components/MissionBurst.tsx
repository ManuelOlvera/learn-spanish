"use client";

import { useEffect, useRef } from "react";
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

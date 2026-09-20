"use client";

import { useEffect, useRef } from "react";
import type { RolloverOutcome } from "@learn-spanish/core";
import { Confetti } from "@/components/Confetti";
import { feedbackRacha } from "@/lib/feedback";

interface Props {
  /** Only "increased" | "frozen" | "reset" ever reach here; "none" shows nothing. */
  outcome: Exclude<RolloverOutcome, "none">;
  count: number;
  onDone: () => void;
}

const LOOK: Record<
  Props["outcome"],
  { emoji: string; title: (n: number) => string; sub: string; accent: string }
> = {
  increased: {
    emoji: "🔥",
    title: (n) => `¡Semana ${n}!`,
    sub: "¡Tu racha semanal creció!",
    accent: "var(--color-lime)",
  },
  frozen: {
    emoji: "❄️",
    title: () => "¡Escudo!",
    sub: "Un escudo guardó tu racha",
    accent: "#7dd3fc",
  },
  reset: {
    emoji: "🌱",
    title: () => "¡A empezar!",
    sub: "Una semana nueva",
    accent: "#fde68a",
  },
};

/** The once-per-week rollover celebration: one full-screen, tap-to-dismiss
 *  beat with a distinct look per outcome (grew / saved by a freeze / fresh
 *  start — never a scolding). Auto-dismisses so a distracted kid isn't stuck. */
export function WeeklyBurst({ outcome, count, onDone }: Props) {
  const look = LOOK[outcome];

  // Mount only, and deliberately *not* in the effect below: every call site
  // passes an inline arrow for `onDone`, so that effect re-runs on each parent
  // render. Keying the sound to it would replay it on every re-render.
  useEffect(() => {
    // A rising run: a week held together is a streak, and streaks sound like this.
    feedbackRacha();
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
      aria-label={`${look.title(count)} ${look.sub} — tap to continue`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-ink)_45%,transparent)] p-6"
    >
      {outcome === "increased" && <Confetti />}
      <span className="pop-in flex flex-col items-center gap-4">
        <span className="text-9xl drop-shadow-[4px_4px_0_var(--color-ink)]">
          {look.emoji}
        </span>
        <span
          className="rounded-3xl border-4 border-ink px-8 py-3 text-4xl font-extrabold"
          style={{ background: look.accent }}
        >
          {look.title(count)}
        </span>
        <span className="rounded-full border-4 border-ink bg-white px-5 py-1 text-xl font-extrabold">
          {look.sub}
        </span>
      </span>
    </button>
  );
}

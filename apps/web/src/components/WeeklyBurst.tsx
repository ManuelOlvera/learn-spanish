"use client";

import { useEffect } from "react";
import type { RolloverOutcome } from "@learn-spanish/core";
import { Confetti } from "@/components/Confetti";

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

  useEffect(() => {
    const timer = setTimeout(onDone, 4500);
    return () => clearTimeout(timer);
  }, [onDone]);

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

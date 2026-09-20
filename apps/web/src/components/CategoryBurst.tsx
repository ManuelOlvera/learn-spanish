"use client";

import { useEffect, useRef } from "react";
import type { StickerTier } from "@learn-spanish/core";
import { Confetti } from "@/components/Confetti";
import { feedbackMedal } from "@/lib/feedback";

interface Props {
  /** The tier just completed — drives the medal and the copy. */
  tier: Exclude<StickerTier, "none">;
  /** Stars the completion chest paid out. */
  bonus: number;
  /** The category's emoji — picture-first cue for which collection was filled. */
  categoryEmoji: string;
  onDone: () => void;
}

const LOOK: Record<
  Props["tier"],
  { medal: string; title: string; accent: string }
> = {
  earned: { medal: "🥉", title: "¡Colección completa!", accent: "var(--color-lime)" },
  silver: { medal: "🥈", title: "¡Colección de plata!", accent: "#e5e7eb" },
  gold: { medal: "🥇", title: "¡Colección de oro!", accent: "#fde68a" },
};

/** The whole-category payoff: finishing every game a kid can play in one album
 *  section — and again each time she levels the section up to silver, then gold.
 *  Full-screen, confetti, tap or auto-dismiss, with the medal and star chest. */
export function CategoryBurst({ tier, bonus, categoryEmoji, onDone }: Props) {
  const look = LOOK[tier];

  // Mount only, and deliberately *not* in the effect below: every call site
  // passes an inline arrow for `onDone`, so that effect re-runs on each parent
  // render. Keying the sound to it would replay it on every re-render.
  useEffect(() => {
    // A step higher per tier, so levelling a collection up sounds like a promotion.
    feedbackMedal(tier === "gold" ? 2 : tier === "silver" ? 1 : 0);
    // `tier` is fixed for the life of a burst, so this still fires once.
  }, [tier]);

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
      aria-label={`${look.title} — you earned ${bonus} stars — tap to continue`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-ink)_45%,transparent)] p-6"
    >
      <Confetti />
      <span className="pop-in flex flex-col items-center gap-4">
        {/* The filled collection's emoji, medalled in the corner. */}
        <span className="relative">
          <span className="wobble block text-9xl drop-shadow-[4px_4px_0_var(--color-ink)]">
            {categoryEmoji}
          </span>
          <span aria-hidden className="absolute -bottom-2 -right-2 text-6xl">
            {look.medal}
          </span>
        </span>
        <span
          className="rounded-3xl border-4 border-ink px-8 py-3 text-4xl font-extrabold"
          style={{ background: look.accent }}
        >
          {look.title}
        </span>
        <span className="flex items-center gap-2 rounded-full border-4 border-ink bg-white px-6 py-1 text-3xl font-extrabold">
          <span aria-hidden>⭐</span>
          <span>+{bonus}</span>
        </span>
      </span>
    </button>
  );
}

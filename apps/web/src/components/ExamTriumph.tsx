"use client";

import { useEffect, useState } from "react";
import { Confetti } from "@/components/Confetti";

interface Props {
  /** What they scored, out of `total`. */
  score: number;
  total: number;
  /** Stars banked. Zero on a re-sit, which changes the copy, not the ceremony. */
  bonus: number;
  /** The shelf just passed, and the one it opened (null at the end of the route). */
  passedEmoji: string;
  unlockedEmoji: string | null;
  unlockedName: string | null;
  onDone: () => void;
}

/**
 * ¡Aprobado! — the exam pass, and deliberately the most elaborate moment in
 * the app (ADR 021: passing must beat opening any chest).
 *
 * Everything else that celebrates here is a single gesture — one burst, one
 * medal, one number. This is the only **sequenced** one, and that is what makes
 * it read as a bigger occasion rather than another CategoryBurst: the grade
 * stamps down, the trophy drops in on turning rays, the stars count up one by
 * one instead of appearing, and finally the padlock on the next shelf breaks
 * open. That last beat is the real prize and is why it comes last — the stars
 * are a number, but the opened shelf is the thing the exam was *for*.
 *
 * Picture-first throughout: a pre-reader gets trophy → stars → a lock breaking
 * off a shelf they recognise by its emoji. The words are for the parent.
 */
type Phase = "grade" | "trophy" | "stars" | "unlock";

const PHASE_ORDER: readonly Phase[] = ["grade", "trophy", "stars", "unlock"];

/** How long each beat holds before the next begins. */
const PHASE_MS: Record<Phase, number> = {
  grade: 1100,
  trophy: 1400,
  stars: 1800,
  unlock: 3200,
};

export function ExamTriumph({
  score,
  total,
  bonus,
  passedEmoji,
  unlockedEmoji,
  unlockedName,
  onDone,
}: Props) {
  const [phase, setPhase] = useState<Phase>("grade");
  const at = PHASE_ORDER.indexOf(phase);

  // One timer per beat rather than one long timeline: a tap can end the whole
  // thing at any point, and a kid who taps early must not be left mid-sequence.
  useEffect(() => {
    const next = PHASE_ORDER[at + 1];
    const timer = setTimeout(
      () => (next === undefined ? onDone() : setPhase(next)),
      PHASE_MS[phase],
    );
    return () => clearTimeout(timer);
  }, [phase, at, onDone]);

  const showStars = at >= PHASE_ORDER.indexOf("stars");
  const showUnlock = at >= PHASE_ORDER.indexOf("unlock");

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={`¡Aprobado! ${score} de ${total}. Ganaste ${bonus} estrellas. Toca para seguir.`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 overflow-hidden bg-[color-mix(in_srgb,var(--color-ink)_30%,transparent)] p-6"
    >
      <Confetti />

      {/* Rays behind everything — the one piece of slow motion in the app.
          Both bands are gold rather than gold-and-transparent: letting the
          scrim show through between them turned the whole sunburst khaki, and
          a grey sunburst is the opposite of what this moment is for. */}
      <span
        aria-hidden
        className="exam-rays pointer-events-none absolute h-[140vmax] w-[140vmax] opacity-80"
        style={{
          background:
            "repeating-conic-gradient(from 0deg, #fde68a 0deg 12deg, #f5a524 12deg 24deg)",
        }}
      />

      {/* 1. The grade, stamped. */}
      <span
        key="grade"
        className="exam-stamp relative z-10 rounded-3xl border-4 border-ink bg-white px-8 py-2 text-5xl font-extrabold tabular-nums"
      >
        {score}/{total}
      </span>

      {/* 2. The trophy. */}
      {at >= PHASE_ORDER.indexOf("trophy") && (
        <span
          aria-hidden
          className="exam-trophy relative z-10 text-[8rem] leading-none drop-shadow-[6px_6px_0_var(--color-ink)] sm:text-[10rem]"
        >
          🏆
        </span>
      )}

      <span className="pop-in relative z-10 rounded-3xl border-4 border-ink bg-[var(--color-lime)] px-8 py-3 text-4xl font-extrabold">
        ¡Aprobado!
      </span>

      {/* 3. The stars, counting up rather than simply appearing. */}
      {showStars && bonus > 0 && (
        <span className="relative z-10 flex items-center gap-2 rounded-full border-4 border-ink bg-white px-7 py-1 text-4xl font-extrabold">
          <span aria-hidden>⭐</span>
          <CountUp to={bonus} />
        </span>
      )}
      {showStars && bonus === 0 && (
        <span className="relative z-10 rounded-full border-4 border-ink bg-white px-7 py-1 text-2xl font-bold">
          ¡Otra vez!
        </span>
      )}

      {/* 4. The payoff: the next shelf's lock breaking off. */}
      {showUnlock && unlockedEmoji !== null && (
        <span className="pop-in relative z-10 flex flex-col items-center gap-1">
          <span className="relative">
            <span aria-hidden className="block text-8xl drop-shadow-[4px_4px_0_var(--color-ink)]">
              {unlockedEmoji}
            </span>
            <span aria-hidden className="exam-unlock absolute -bottom-2 -right-3 text-6xl">
              🔒
            </span>
          </span>
          {unlockedName !== null && (
            <span className="rounded-full border-4 border-ink bg-white px-5 py-1 text-xl font-bold">
              {unlockedName}
            </span>
          )}
        </span>
      )}

      {/* The route's end has no next shelf — say so with the shelf just cleared. */}
      {showUnlock && unlockedEmoji === null && (
        <span aria-hidden className="pop-in relative z-10 text-8xl">
          {passedEmoji}
        </span>
      )}
    </button>
  );
}

/** Ticks up to `to` over a fixed span, so a big prize visibly *accumulates*
 *  instead of landing as a number. Capped at ~24 ticks so 200⭐ doesn't animate
 *  two hundred times. */
function CountUp({ to }: { to: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const steps = Math.min(to, 24);
    const step = Math.ceil(to / steps);
    const timer = setInterval(() => {
      setShown((n) => {
        if (n + step >= to) {
          clearInterval(timer);
          return to;
        }
        return n + step;
      });
    }, 1200 / steps);
    return () => clearInterval(timer);
  }, [to]);
  return <span className="tabular-nums">+{shown}</span>;
}

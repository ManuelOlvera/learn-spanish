"use client";

import { useEffect, useState } from "react";
import type { ExamKind } from "@learn-spanish/core";
import { Confetti } from "@/components/Confetti";
import {
  feedbackShelfLight,
  feedbackStamp,
  feedbackTick,
  feedbackTriumph,
  feedbackUnlock,
} from "@/lib/feedback";

interface Props {
  /** What they scored, out of `total`. */
  score: number;
  total: number;
  /** A súper examen gets the louder copy and its own glyph — the ceremony
   *  itself is shared until the bespoke one on the roadmap is built. */
  kind: ExamKind;
  /** Stars banked. Zero on a re-sit, which changes the copy, not the ceremony. */
  bonus: number;
  /** The shelf just passed, and the one it opened (null at the end of the route). */
  passedEmoji: string;
  unlockedEmoji: string | null;
  unlockedName: string | null;
  /** Every shelf this súper swept, in route order — what the 20 questions were
   *  actually drawn from. Empty for a regular exam, which sweeps nothing. */
  sweptEmoji?: readonly string[];
  /** The last stop on the route: nothing left to unlock, so the sweep is the
   *  payoff rather than a beat on the way to one. */
  capstone?: boolean;
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
 *
 * **A súper examen earns one more beat: el camino, lighting up.** What makes a
 * súper different is already in the data — it is a cumulative sweep across
 * every shelf finished so far, so the achievement is "you still remember all
 * of it" rather than "you finished this one", and nothing on screen said that.
 * The swept shelves now pop in along the route, left to right, in the same
 * picture language the Tu camino strip already uses.
 *
 * At the **capstone** it is not an extra beat but a replacement: shelf 12 has
 * no next shelf, so the payoff beat used to fall through to re-showing a
 * picture already on screen. The finished route is the thing that moment is
 * actually about.
 */
type Phase = "grade" | "trophy" | "stars" | "sweep" | "unlock";

/** How long each beat holds before the next begins. */
const PHASE_MS: Record<Phase, number> = {
  grade: 1100,
  trophy: 1400,
  stars: 1800,
  sweep: 2200,
  unlock: 3200,
};

/** How long between two shelves lighting up. Twelve of them have to fit
 *  inside the sweep beat with room to land. */
const SHELF_STAGGER_MS = 120;

/**
 * The beats this pass actually plays.
 *
 * A regular exam is unchanged. A súper gains the sweep. The capstone trades
 * the unlock beat for it rather than adding one — there is nothing to unlock,
 * and a fifth beat is exactly the length the roadmap's choreography cut warned
 * about.
 */
function phasesFor(opts: {
  swept: number;
  capstone: boolean;
  hasUnlock: boolean;
}): readonly Phase[] {
  const beats: Phase[] = ["grade", "trophy", "stars"];
  if (opts.swept > 0) {
    beats.push("sweep");
  }
  if (opts.hasUnlock && !opts.capstone) {
    beats.push("unlock");
  }
  return beats;
}

export function ExamTriumph({
  score,
  total,
  bonus,
  kind,
  passedEmoji,
  unlockedEmoji,
  unlockedName,
  sweptEmoji = [],
  capstone = false,
  onDone,
}: Props) {
  const isSuper = kind === "super";
  const order = phasesFor({
    swept: sweptEmoji.length,
    capstone,
    hasUnlock: unlockedEmoji !== null,
  });
  const [phase, setPhase] = useState<Phase>("grade");
  const at = order.indexOf(phase);

  // Each beat's sound fires once, here, rather than inside the markup — a
  // render can happen for any reason, and a trophy fanfare that re-triggers
  // mid-ceremony is worse than silence. Skipping early simply means the later
  // beats never play, which is what a kid tapping past it should get.
  useEffect(() => {
    if (phase === "grade") feedbackStamp();
    if (phase === "trophy") feedbackTriumph();
    if (phase === "unlock") feedbackUnlock();
  }, [phase]);

  // One timer per beat rather than one long timeline: a tap can end the whole
  // thing at any point, and a kid who taps early must not be left mid-sequence.
  useEffect(() => {
    const next = order[at + 1];
    const timer = setTimeout(
      () => (next === undefined ? onDone() : setPhase(next)),
      PHASE_MS[phase],
    );
    return () => clearTimeout(timer);
    // `order` is derived from props that cannot change mid-ceremony.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, at, onDone]);

  // The sweep's run, on the same stagger the shelves pop in on, so each note
  // lands with its own picture.
  useEffect(() => {
    if (phase !== "sweep") {
      return;
    }
    const timers = sweptEmoji.map((_, i) =>
      setTimeout(() => feedbackShelfLight(i, sweptEmoji.length), i * SHELF_STAGGER_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, sweptEmoji]);

  const showStars = at >= order.indexOf("stars");
  const showSweep = order.includes("sweep") && at >= order.indexOf("sweep");
  const showUnlock = order.includes("unlock") && at >= order.indexOf("unlock");

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={`${isSuper ? "¡Súper aprobado!" : "¡Aprobado!"} ${score} de ${total}. Ganaste ${bonus} estrellas. Toca para seguir.`}
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
      {at >= order.indexOf("trophy") && (
        <span
          aria-hidden
          className="exam-trophy relative z-10 text-[8rem] leading-none drop-shadow-[6px_6px_0_var(--color-ink)] sm:text-[10rem]"
        >
          {isSuper ? "🏅" : "🏆"}
        </span>
      )}

      <span className="pop-in relative z-10 rounded-3xl border-4 border-ink bg-[var(--color-lime)] px-8 py-3 text-4xl font-extrabold">
        {isSuper ? "¡SÚPER APROBADO!" : "¡Aprobado!"}
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

      {/* 4. A súper's own beat: the road it just swept, lighting up. */}
      {showSweep && (
        <span className="relative z-10 flex flex-col items-center gap-2">
          <span className="flex max-w-[22rem] flex-wrap justify-center gap-1.5">
            {sweptEmoji.map((emoji, i) => (
              <span
                key={`${emoji}-${i}`}
                aria-hidden
                className="pop-in flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-ink bg-[var(--color-lime)] text-2xl"
                style={{ animationDelay: `${i * SHELF_STAGGER_MS}ms` }}
              >
                {emoji}
              </span>
            ))}
          </span>
          {capstone && (
            <span className="pop-in rounded-3xl border-4 border-ink bg-white px-6 py-2 text-2xl font-extrabold"
              style={{ animationDelay: `${sweptEmoji.length * SHELF_STAGGER_MS}ms` }}
            >
              ¡EL CAMINO COMPLETO!
            </span>
          )}
        </span>
      )}

      {/* 5. The payoff: the next shelf's lock breaking off. */}
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

      {/* The route's end has no next shelf. Before the sweep beat existed this
          fell through to re-showing a picture already on screen; it is now only
          reachable by a shelf with neither an unlock nor a sweep. */}
      {!showSweep && showUnlock && unlockedEmoji === null && (
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
          feedbackTick(1);
          return to;
        }
        feedbackTick((n + step) / to);
        return n + step;
      });
    }, 1200 / steps);
    return () => clearInterval(timer);
  }, [to]);
  return <span className="tabular-nums">+{shown}</span>;
}

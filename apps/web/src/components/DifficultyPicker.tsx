"use client";

import type { ReactNode } from "react";
import type { Difficulty } from "@learn-spanish/core";

/**
 * How a board size is labelled, in one place.
 *
 * It lived in `MemoryPlayer` and again in `SopaPlayer` — two copies that had
 * already drifted (one carried Spanish, one did not). A kid learns 🟢/🟡/🔴
 * once and reads it the same way in every game, so the labels have to be one
 * fact.
 */
export const DIFFICULTY_META: Record<
  Difficulty,
  { readonly emoji: string; readonly spanish: string; readonly english: string }
> = {
  easy: { emoji: "🟢", spanish: "Fácil", english: "Easy" },
  medium: { emoji: "🟡", spanish: "Medio", english: "Medium" },
  hard: { emoji: "🔴", spanish: "Difícil", english: "Hard" },
};

/**
 * The "how big a board?" screen, shared by every game that scales.
 *
 * One action per screen, picture-first: the colour and the dots carry the
 * meaning, the Spanish word is for whoever is reading over the kid's
 * shoulder. Las parejas proved the shape; this is that screen, extracted so
 * the next game to scale does not draw a third version of it.
 *
 * `amount` is what the dots count — pairs, choices, rounds — because the unit
 * differs per game and only the game knows it.
 */
export function DifficultyPicker({
  question,
  levels,
  amount,
  amountLabel,
  onPick,
}: {
  /** The Spanish question at the top — "¿Cuántas parejas?" */
  question: string;
  /** Only the levels this deck can actually fill. */
  levels: readonly Difficulty[];
  amount: (level: Difficulty) => number;
  /** For the screen reader: "pairs", "choices", "rounds". */
  amountLabel: string;
  onPick: (level: Difficulty) => void;
}): ReactNode {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
      <p className="pop-in text-2xl font-extrabold text-ink/70 sm:text-3xl">
        {question}
      </p>
      <div className="flex w-full max-w-md flex-col gap-5">
        {levels.map((level, i) => {
          const meta = DIFFICULTY_META[level];
          const count = amount(level);
          return (
            <button
              key={level}
              type="button"
              onClick={() => onPick(level)}
              aria-label={`${meta.english} — ${count} ${amountLabel}`}
              className="sticker pop-in flex items-center justify-between gap-4 p-4 active:translate-x-1 active:translate-y-1 active:shadow-none"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span className="flex items-center gap-3">
                <span aria-hidden className="text-5xl">
                  {meta.emoji}
                </span>
                <span className="text-2xl font-extrabold sm:text-3xl">
                  {meta.spanish}
                </span>
              </span>
              {/* The size as dots, so it reads without letters. */}
              <span
                aria-hidden
                className="flex max-w-[7rem] flex-wrap justify-end gap-1"
              >
                {Array.from({ length: count }).map((_, d) => (
                  <span key={d} className="h-3 w-3 rounded-full bg-ink/30" />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

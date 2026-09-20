"use client";

import type { PetGoal } from "@learn-spanish/core";

/**
 * How close this kid is to the next mascota they can adopt.
 *
 * The bar exists because ADR 020 fixed the *rate* but not the *visibility*:
 * the stars arrive in a chest and land in a number, and nothing said what they
 * were for. It is a pure view — `nextPetGoal` derives it from the wallet and
 * the pets already owned, so nothing here stores or spends anything.
 *
 * Pre-reader rules apply: the pet's own picture carries the meaning, the bar
 * carries the distance, and the Spanish line is for whoever is reading over
 * the kid's shoulder. Nothing here is tappable — it reports, it never nudges
 * toward spending.
 */
export function PetGoalBar({
  goal,
  compact = false,
}: {
  goal: PetGoal;
  /** Home's form: one line, no card of its own — it is the fifth thing on that
   *  screen and must not claim a row like the misión does. */
  compact?: boolean;
}) {
  const pct = Math.round(goal.progress * 100);
  const ready = goal.remaining === 0;
  // The youngest form: what the kid would actually bring home.
  const face = goal.species.stages[0] ?? "🥚";

  return (
    <div
      className={`flex w-full items-center gap-3 ${compact ? "" : "max-w-md"}`}
      aria-label={
        ready
          ? `You can adopt ${goal.species.nameEnglish} now`
          : `${goal.remaining} more stars for ${goal.species.nameEnglish}`
      }
    >
      <span aria-hidden className={compact ? "text-2xl" : "text-4xl"}>
        {face}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          aria-hidden
          className={`flex overflow-hidden rounded-full border-2 border-ink bg-[color-mix(in_srgb,var(--color-ink)_10%,white)] ${
            compact ? "h-3" : "h-4"
          }`}
        >
          <span
            className="bg-[var(--color-lime-deep)] transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </span>
        <span
          className={`truncate font-bold ${compact ? "text-xs" : "text-sm"} ${
            ready ? "text-[var(--color-lime-deep)]" : "text-ink/60"
          }`}
        >
          {ready ? (
            <>¡Ya puedes adoptar {goal.species.nameSpanish.toLowerCase()}! 🎉</>
          ) : (
            <>
              ⭐ Faltan{" "}
              <strong className="font-extrabold text-ink">{goal.remaining}</strong>{" "}
              para {goal.species.nameSpanish.toLowerCase()}
            </>
          )}
        </span>
      </span>
    </div>
  );
}

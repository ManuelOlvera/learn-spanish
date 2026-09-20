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
 *
 * **It lives on `/mascota` and nowhere else.** It shipped on home and on the
 * done screen too; the kid did not like it on home (2026-09-20), and the
 * screen with the pets and the balance on it is where a bar about saving for a
 * pet belongs. A `compact` variant existed for home and went with it.
 */
export function PetGoalBar({ goal }: { goal: PetGoal }) {
  const pct = Math.round(goal.progress * 100);
  const ready = goal.remaining === 0;
  // The youngest form: what the kid would actually bring home.
  const face = goal.species.stages[0] ?? "🥚";

  return (
    <div
      className="flex w-full max-w-md items-center gap-3"
      aria-label={
        ready
          ? `You can adopt ${goal.species.nameEnglish} now`
          : `${goal.remaining} more stars for ${goal.species.nameEnglish}`
      }
    >
      <span aria-hidden className="text-4xl">
        {face}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          aria-hidden
          className="flex h-4 overflow-hidden rounded-full border-2 border-ink bg-[color-mix(in_srgb,var(--color-ink)_10%,white)]"
        >
          <span
            className="bg-[var(--color-lime-deep)] transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </span>
        <span
          className={`truncate text-sm font-bold ${
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

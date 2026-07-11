"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  dayKey,
  isPetHungry,
  MEAL_COST,
  PET_STAGE_MEALS,
  petStage,
  type KidId,
  type PetState,
} from "@learn-spanish/core";
import { getSelectedKid, getAvatar } from "@/lib/kid";
import { feedPetFor, getPet, getStars } from "@/lib/economy";
import { feedbackFanfare, feedbackMatch, feedbackWrong } from "@/lib/feedback";
import { Confetti } from "@/components/Confetti";

const STAGE_EMOJI = ["🥚", "🐣", "🐥", "🐓"] as const;
const STAGE_NAMES = ["el huevo", "el pollito", "el pollo", "el gallo"] as const;

/** La mascota: fed with the stars won in games; grows in stages, droops
 *  gently when hungry, never worse (kids' app). */
export function MascotaView() {
  const [kid, setKid] = useState<KidId | null>(null);
  const [pet, setPet] = useState<PetState | null>(null);
  const [stars, setStars] = useState(0);
  const [munch, setMunch] = useState(0);
  const [evolved, setEvolved] = useState(false);
  const [cantAfford, setCantAfford] = useState(0);

  useEffect(() => {
    const current = getSelectedKid() ?? "listener";
    setKid(current);
    setPet(getPet(current));
    setStars(getStars(current));
  }, []);

  if (kid === null || pet === null) {
    return <main className="min-h-dvh" aria-hidden />;
  }

  const stage = petStage(pet.meals);
  const hungry = isPetHungry(pet, dayKey(new Date()));
  const nextStageAt = PET_STAGE_MEALS[stage + 1];

  function feed() {
    if (kid === null || pet === null) {
      return;
    }
    const result = feedPetFor(kid);
    if (result === null) {
      feedbackWrong();
      setCantAfford((n) => n + 1);
      return;
    }
    const grewUp = petStage(result.pet.meals) > petStage(pet.meals);
    setPet(result.pet);
    setStars(result.stars);
    setMunch((n) => n + 1);
    if (grewUp) {
      setEvolved(true);
      feedbackFanfare();
    } else {
      feedbackMatch();
    }
  }

  return (
    <main
      style={{ "--accent": "#fbbf24" } as React.CSSProperties}
      className="mx-auto flex min-h-dvh max-w-2xl flex-col p-4 sm:p-6"
    >
      <header className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="Back to all decks"
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
        <span aria-hidden className="text-4xl">
          {getAvatar(kid)}
        </span>
      </header>

      {evolved && <Confetti />}

      <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div
          key={`${stage}-${munch}`}
          className={`text-[9rem] leading-none ${munch > 0 ? "pop-in" : ""} ${
            hungry ? "opacity-70 grayscale-[30%]" : ""
          }`}
          aria-label={`Your pet: ${STAGE_NAMES[stage]}, ${pet.meals} meals`}
        >
          {STAGE_EMOJI[stage]}
        </div>

        <h1 className="text-4xl font-extrabold sm:text-5xl">La mascota</h1>
        {hungry ? (
          <p className="text-xl font-extrabold text-ink/70">
            ¡Tengo hambre! 🥺
          </p>
        ) : (
          <p className="text-lg font-semibold text-ink/60">
            {stage === 0 ? "Feed the egg to hatch it!" : "Growing strong!"}
          </p>
        )}

        <div
          className="flex items-center gap-1.5"
          aria-label={
            nextStageAt !== undefined
              ? `${pet.meals} of ${nextStageAt} meals to the next stage`
              : "Fully grown"
          }
        >
          {nextStageAt !== undefined ? (
            Array.from({ length: nextStageAt }, (_, i) => (
              <span
                key={i}
                aria-hidden
                className={`h-3 w-3 rounded-full border-2 border-ink ${
                  i < pet.meals ? "bg-[var(--accent)]" : "bg-white"
                }`}
              />
            ))
          ) : (
            <span className="text-2xl">🌟 ¡Ya es grande! 🌟</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span
            aria-label={`You have ${stars} stars`}
            className="rounded-full border-4 border-ink bg-white px-4 py-1 text-2xl font-extrabold"
          >
            ⭐ {stars}
          </span>
          <button
            type="button"
            key={cantAfford}
            onClick={feed}
            aria-label={`Feed the pet (costs ${MEAL_COST} stars)`}
            className={`sticker flex items-center gap-2 px-6 py-4 text-2xl font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none ${
              cantAfford > 0 && stars < MEAL_COST ? "wobble" : ""
            } ${stars < MEAL_COST ? "opacity-60" : ""}`}
            style={{ "--sticker-face": "var(--color-lime)" } as React.CSSProperties}
          >
            🍎 ¡A comer! ({MEAL_COST}⭐)
          </button>
        </div>
        {cantAfford > 0 && stars < MEAL_COST && (
          <p className="text-base font-semibold text-ink/60">
            Gana más estrellas jugando — win stars in the games!
          </p>
        )}
      </section>
    </main>
  );
}

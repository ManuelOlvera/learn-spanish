"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ACCESSORIES,
  buyAccessory,
  dayKey,
  isPetHungry,
  MEAL_COST,
  PET_STAGE_MEALS,
  petStage,
  type KidId,
  type PetState,
} from "@learn-spanish/core";
import { getSelectedKid, getAvatar } from "@/lib/kid";
import { feedPetFor, getPet, getStars, savePet, spendStars } from "@/lib/economy";
import {
  feedbackFanfare,
  feedbackMatch,
  feedbackSticker,
  feedbackWrong,
} from "@/lib/feedback";
import { Confetti } from "@/components/Confetti";

/** Where each owned accessory sits on the pet (percent offsets). */
const ACCESSORY_SPOTS: Record<string, { left: string; top: string }> = {
  gorro: { left: "50%", top: "-8%" },
  corona: { left: "24%", top: "-4%" },
  gafas: { left: "50%", top: "34%" },
  lazo: { left: "78%", top: "70%" },
  "globo-fiesta": { left: "6%", top: "30%" },
  varita: { left: "94%", top: "55%" },
};

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
          className={`relative text-[9rem] leading-none ${munch > 0 ? "pop-in" : ""} ${
            hungry ? "opacity-70 grayscale-[30%]" : ""
          }`}
          aria-label={`Your pet: ${STAGE_NAMES[stage]}, ${pet.meals} meals`}
        >
          {STAGE_EMOJI[stage]}
          {(pet.accessories ?? []).map((id) => {
            const item = ACCESSORIES.find((a) => a.id === id);
            const spot = ACCESSORY_SPOTS[id];
            if (!item || !spot) {
              return null;
            }
            return (
              <span
                key={id}
                aria-hidden
                className="absolute -translate-x-1/2 text-5xl"
                style={{ left: spot.left, top: spot.top }}
              >
                {item.emoji}
              </span>
            );
          })}
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

        <div className="w-full max-w-md">
          <h2 className="mb-2 text-xl font-extrabold text-ink/70">
            🛍️ El armario
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {ACCESSORIES.map((item) => {
              const owned = (pet.accessories ?? []).includes(item.id);
              return (
                <button
                  type="button"
                  key={item.id}
                  disabled={owned}
                  onClick={() => {
                    if (kid === null || owned) {
                      return;
                    }
                    const balance = spendStars(kid, item.cost);
                    if (balance === null) {
                      feedbackWrong();
                      setCantAfford((n) => n + 1);
                      return;
                    }
                    const dressed = buyAccessory(pet, item.id);
                    savePet(kid, dressed);
                    setPet(dressed);
                    setStars(balance);
                    feedbackSticker();
                  }}
                  aria-label={
                    owned
                      ? `${item.emoji} owned`
                      : `Buy ${item.emoji} for ${item.cost} stars`
                  }
                  className={`sticker flex flex-col items-center gap-1 p-3 ${
                    owned
                      ? "opacity-60"
                      : "active:translate-x-1 active:translate-y-1 active:shadow-none"
                  }`}
                  style={
                    owned
                      ? ({
                          "--sticker-face": "var(--color-lime)",
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  <span aria-hidden className="text-4xl">
                    {item.emoji}
                  </span>
                  <span className="text-sm font-extrabold">
                    {owned ? "✓" : `${item.cost}⭐`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

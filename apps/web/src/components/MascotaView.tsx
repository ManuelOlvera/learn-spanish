"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ACCESSORIES,
  dayKey,
  isPetHungry,
  MEAL_COST,
  petFormEmoji,
  petMaxForm,
  petStage,
  PET_SPECIES,
  PET_STAGE_MEALS,
  SURPRISE_COST,
  wornAccessories,
  type KidId,
  type PetCollection,
} from "@learn-spanish/core";
import { getSelectedKid, getAvatar } from "@/lib/kid";
import {
  adoptSpecies,
  buyAccessoryForActive,
  feedActivePet,
  getOwnedAccessories,
  getPetCollection,
  getStars,
  openSurprise,
  setActiveSpecies,
  setPetForm,
  toggleAccessoryForActive,
} from "@/lib/economy";
import {
  buyTheme,
  getOwnedThemes,
  getSelectedTheme,
  setSelectedTheme,
  THEMES,
} from "@/lib/theme";
import {
  feedbackFanfare,
  feedbackMatch,
  feedbackRacha,
  feedbackSticker,
  feedbackWrong,
} from "@/lib/feedback";
import { Confetti } from "@/components/Confetti";

/** Where each accessory's *centre* sits on the pet, as a percent of the emoji
 *  box (0% = top/left edge). Both axes are centred (see the -translate below),
 *  so 50%/50% is dead centre. Headwear rides high; held items go to a side. */
const ACCESSORY_SPOTS: Record<string, { left: string; top: string }> = {
  gorro: { left: "50%", top: "8%" }, // 🎩 hat, on top of the head
  gorra: { left: "50%", top: "10%" }, // 🧢 cap, on top of the head
  corona: { left: "50%", top: "6%" }, // 👑 crown, on top of the head
  flor: { left: "74%", top: "18%" }, // 🌸 flower, tucked by one ear
  gafas: { left: "50%", top: "40%" }, // 🕶️ sunglasses, over the eyes
  "gafas-ver": { left: "50%", top: "40%" }, // 👓 glasses, over the eyes
  mariposa: { left: "26%", top: "34%" }, // 🦋 butterfly, perched on one side
  lazo: { left: "68%", top: "72%" }, // 🎀 bow, to one side near the chin
  bufanda: { left: "50%", top: "82%" }, // 🧣 scarf, around the neck
  "globo-fiesta": { left: "12%", top: "18%" }, // 🎈 balloon, floating up-left
  piruli: { left: "16%", top: "60%" }, // 🍭 lollipop, held low-left
  varita: { left: "86%", top: "66%" }, // 🪄 wand, held to the right
};

/** La mascota: a menagerie fed with the stars won in games. Feeding grows
 *  the active pet; stars also adopt new pets, dress them, open surprise
 *  boxes, and buy themes — a renewable star sink. */
export function MascotaView() {
  const [kid, setKid] = useState<KidId | null>(null);
  const [collection, setCollection] = useState<PetCollection | null>(null);
  const [stars, setStars] = useState(0);
  const [munch, setMunch] = useState(0);
  const [evolved, setEvolved] = useState(false);
  const [nope, setNope] = useState(0);
  const [surprise, setSurprise] = useState<string | null>(null);
  const [ownedAccessories, setOwnedAccessories] = useState<readonly string[]>([]);
  const [ownedThemes, setOwnedThemes] = useState<readonly string[]>([]);
  const [theme, setTheme] = useState("crema");

  function refresh(k: KidId) {
    setCollection(getPetCollection(k));
    setStars(getStars(k));
    setOwnedAccessories(getOwnedAccessories(k));
    setOwnedThemes(getOwnedThemes(k));
    setTheme(getSelectedTheme(k));
  }

  useEffect(() => {
    const current = getSelectedKid() ?? "listener";
    setKid(current);
    refresh(current);
  }, []);

  if (kid === null || collection === null) {
    return <main className="min-h-dvh" aria-hidden />;
  }

  const activeId = collection.active;
  const pet = collection.pets[activeId] ?? { meals: 0, lastFed: null };
  const stage = petStage(pet.meals);
  const today = dayKey(new Date());
  const hungry = isPetHungry(pet, today);
  const nextStageAt = PET_STAGE_MEALS[stage + 1];
  const species = PET_SPECIES.find((s) => s.id === activeId) ?? PET_SPECIES[0]!;
  // Which form to show: the kid may pin an earlier one, capped at the newest
  // form the pet has reached (undefined = follow the newest).
  const maxForm = petMaxForm(activeId, pet.meals);
  const chosenForm = Math.max(0, Math.min(pet.form ?? maxForm, maxForm));

  function feed() {
    if (kid === null) return;
    const before = pet.meals;
    const result = feedActivePet(kid);
    if (result === null) {
      feedbackWrong();
      setNope((n) => n + 1);
      return;
    }
    // Celebrate only when a brand-new form unlocks — some species grow through
    // fewer forms than others, so a meal isn't always a visible stage.
    const grewUp =
      petMaxForm(activeId, result.pet.meals) > petMaxForm(activeId, before);
    refresh(kid);
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
      className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 p-4 sm:p-6"
    >
      <header className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="Back to all decks"
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
        <span
          aria-label={`You have ${stars} stars`}
          className="rounded-full border-4 border-ink bg-white px-4 py-1 text-2xl font-extrabold"
        >
          ⭐ {stars}
        </span>
        <span aria-hidden className="text-4xl">
          {getAvatar(kid)}
        </span>
      </header>

      {evolved && <Confetti />}

      <section className="flex flex-col items-center gap-4 text-center">
        <div
          key={`${activeId}-${chosenForm}-${munch}`}
          className={`relative text-[8rem] leading-none ${munch > 0 ? "pop-in" : ""} ${
            hungry ? "opacity-70 grayscale-[30%]" : ""
          }`}
          aria-label={`Your pet: ${species.nameSpanish}, ${pet.meals} meals`}
        >
          {petFormEmoji(activeId, chosenForm)}
          {wornAccessories(pet).map((id) => {
            const item = ACCESSORIES.find((a) => a.id === id);
            const spot = ACCESSORY_SPOTS[id];
            if (!item || !spot) return null;
            return (
              <span
                key={id}
                aria-hidden
                className="absolute -translate-x-1/2 -translate-y-1/2 text-5xl"
                style={{ left: spot.left, top: spot.top }}
              >
                {item.emoji}
              </span>
            );
          })}
        </div>

        <h1 className="text-3xl font-extrabold sm:text-4xl">
          {species.nameSpanish}
        </h1>
        <p className="text-base font-semibold text-ink/60">
          {hungry
            ? "¡Tengo hambre! 🥺"
            : stage === 0
              ? petFormEmoji(activeId, 0) === "🥚"
                ? "Feed the egg to hatch it!"
                : "Feed your baby to grow!"
              : "Growing strong!"}
        </p>

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
            <span className="text-xl">🌟 ¡Ya es grande! 🌟</span>
          )}
        </div>

        <button
          type="button"
          key={nope}
          onClick={feed}
          aria-label={`Feed the pet (costs ${MEAL_COST} stars)`}
          className={`sticker flex items-center gap-2 px-6 py-3 text-2xl font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none ${
            stars < MEAL_COST ? "wobble opacity-60" : ""
          }`}
          style={{ "--sticker-face": "var(--color-lime)" } as React.CSSProperties}
        >
          🍎 ¡A comer! ({MEAL_COST}⭐)
        </button>

        {/* ---- Pick which form to show (only once more than one is unlocked) ---- */}
        {maxForm >= 1 && (
          <div
            className="flex items-center justify-center gap-2"
            aria-label="Choose which form your pet shows"
          >
            {Array.from({ length: maxForm + 1 }, (_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => {
                  if (kid === null) return;
                  setPetForm(kid, i);
                  feedbackSticker();
                  refresh(kid);
                }}
                aria-label={`Show form ${i + 1}`}
                aria-pressed={i === chosenForm}
                className="sticker flex h-14 w-14 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
                style={
                  i === chosenForm
                    ? ({ "--sticker-face": "var(--color-lime)" } as React.CSSProperties)
                    : undefined
                }
              >
                {petFormEmoji(activeId, i)}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ---- Mis mascotas: switch + adopt ---- */}
      <section className="w-full">
        <h2 className="mb-2 text-lg font-extrabold text-ink/70">🐾 Mis mascotas</h2>
        <div className="grid grid-cols-4 gap-3">
          {PET_SPECIES.map((s) => {
            const owned = collection.owned.includes(s.id);
            const isActive = s.id === activeId;
            const p = collection.pets[s.id];
            const petHungry = owned && isPetHungry(p ?? null, today);
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => {
                  if (kid === null) return;
                  if (owned) {
                    setActiveSpecies(kid, s.id);
                    feedbackSticker();
                    refresh(kid);
                    return;
                  }
                  const res = adoptSpecies(kid, s.id, s.cost);
                  if (res === null) {
                    feedbackWrong();
                    setNope((n) => n + 1);
                    return;
                  }
                  feedbackFanfare();
                  refresh(kid);
                }}
                aria-label={
                  owned
                    ? petHungry
                      ? `Play with ${s.nameEnglish} (hungry)`
                      : `Play with ${s.nameEnglish}`
                    : `Adopt ${s.nameEnglish} for ${s.cost} stars`
                }
                className={`sticker relative flex flex-col items-center gap-1 p-3 active:translate-x-1 active:translate-y-1 active:shadow-none ${
                  !owned ? "opacity-80" : ""
                }`}
                style={
                  isActive
                    ? ({ "--sticker-face": "var(--color-lime)" } as React.CSSProperties)
                    : undefined
                }
              >
                {petHungry && (
                  <span
                    aria-hidden
                    className="chest-tease absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-white text-base"
                  >
                    🥺
                  </span>
                )}
                <span
                  aria-hidden
                  className={`text-4xl ${petHungry ? "opacity-70 grayscale-[30%]" : ""}`}
                >
                  {owned
                    ? petFormEmoji(
                        s.id,
                        Math.min(p?.form ?? Infinity, petMaxForm(s.id, p?.meals ?? 0)),
                      )
                    : s.stages[s.stages.length - 1]}
                </span>
                <span className="text-xs font-extrabold">
                  {owned ? (isActive ? "★" : "") : `${s.cost}⭐`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---- Caja sorpresa ---- */}
      <section className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (kid === null) return;
            const res = openSurprise(kid);
            if (res === null) {
              feedbackWrong();
              setNope((n) => n + 1);
              return;
            }
            feedbackRacha();
            refresh(kid);
            const r = res.result;
            setSurprise(
              r.type === "accessory"
                ? `¡${ACCESSORIES.find((a) => a.id === r.id)?.emoji ?? "🎁"} nuevo!`
                : `+${r.amount} ⭐`,
            );
          }}
          aria-label={`Open a surprise box for ${SURPRISE_COST} stars`}
          className="sticker chest-tease flex items-center gap-3 px-6 py-3 text-xl font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🎁 Caja sorpresa ({SURPRISE_COST}⭐)
        </button>
        {surprise && (
          <p role="status" className="pop-in text-2xl font-extrabold">
            {surprise}
          </p>
        )}
      </section>

      {/* ---- El armario ---- */}
      <section className="w-full">
        <h2 className="mb-2 text-lg font-extrabold text-ink/70">🛍️ El armario</h2>
        <div className="grid grid-cols-3 gap-3">
          {ACCESSORIES.map((item) => {
            const owned = ownedAccessories.includes(item.id);
            const worn = wornAccessories(pet).includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  if (kid === null) return;
                  if (owned) {
                    // Free once owned: just put it on or take it off.
                    toggleAccessoryForActive(kid, item.id);
                    feedbackSticker();
                    refresh(kid);
                    return;
                  }
                  const res = buyAccessoryForActive(kid, item.id, item.cost);
                  if (res === null) {
                    feedbackWrong();
                    setNope((n) => n + 1);
                    return;
                  }
                  feedbackSticker();
                  refresh(kid);
                }}
                aria-label={
                  !owned
                    ? `Buy ${item.emoji} for ${item.cost} stars`
                    : worn
                      ? `Take off ${item.emoji}`
                      : `Put on ${item.emoji}`
                }
                aria-pressed={owned ? worn : undefined}
                className={`sticker flex flex-col items-center gap-1 p-3 active:translate-x-1 active:translate-y-1 active:shadow-none ${
                  owned && !worn ? "opacity-60" : ""
                }`}
                style={
                  worn
                    ? ({ "--sticker-face": "var(--color-lime)" } as React.CSSProperties)
                    : undefined
                }
              >
                <span aria-hidden className="text-4xl">
                  {item.emoji}
                </span>
                <span className="text-sm font-extrabold">
                  {!owned ? `${item.cost}⭐` : worn ? "✓" : "＋"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---- Temas ---- */}
      <section className="w-full pb-6">
        <h2 className="mb-2 text-lg font-extrabold text-ink/70">🎨 Temas</h2>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const owned = ownedThemes.includes(t.id) || t.cost === 0;
            const selected = t.id === theme;
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => {
                  if (kid === null) return;
                  if (owned) {
                    setSelectedTheme(kid, t.id);
                    setTheme(t.id);
                    feedbackSticker();
                    return;
                  }
                  const balance = buyTheme(kid, t.id, t.cost);
                  if (balance === null) {
                    feedbackWrong();
                    setNope((n) => n + 1);
                    return;
                  }
                  setStars(balance);
                  setOwnedThemes([...ownedThemes, t.id]);
                  setSelectedTheme(kid, t.id);
                  setTheme(t.id);
                  feedbackSticker();
                }}
                aria-label={
                  owned ? `Use the ${t.nameSpanish} theme` : `Buy ${t.nameSpanish} for ${t.cost} stars`
                }
                className={`sticker flex flex-col items-center gap-1 p-3 active:translate-x-1 active:translate-y-1 active:shadow-none ${
                  selected ? "ring-4 ring-ink" : ""
                }`}
              >
                <span
                  aria-hidden
                  className="h-8 w-8 rounded-full border-4 border-ink"
                  style={{ background: t.paper }}
                />
                <span className="text-xs font-extrabold">
                  {owned ? (selected ? "★" : t.nameSpanish) : `${t.cost}⭐`}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

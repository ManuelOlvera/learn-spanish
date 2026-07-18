"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ACCESSORIES,
  accessoryPlacement,
  dayKey,
  isPetHungry,
  MAX_PET_NAME,
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
  nameActivePet,
  openSurprise,
  placeAccessoryOnActive,
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
} from "@/lib/feedback";
import { useDeniedWobble } from "@/lib/use-denied-wobble";
import { syncPush } from "@/lib/sync";
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
  estrella: { left: "80%", top: "12%" }, // ⭐ star, sparkling up-right
  medalla: { left: "50%", top: "80%" }, // 🏅 medal, on the chest
  birrete: { left: "50%", top: "8%" }, // 🎓 grad cap, on the head
  paraguas: { left: "14%", top: "14%" }, // ☂️ umbrella, held up-left
  reloj: { left: "82%", top: "74%" }, // ⌚ watch, on a wrist to the side
  trebol: { left: "28%", top: "20%" }, // 🍀 clover, tucked by one ear
  pelota: { left: "22%", top: "82%" }, // ⚽ ball, at the feet
  helado: { left: "84%", top: "56%" }, // 🍦 ice cream, held to the right
  osito: { left: "20%", top: "68%" }, // 🧸 teddy, hugged low-left
  guitarra: { left: "78%", top: "66%" }, // 🎸 guitar, held to the right
  arcoiris: { left: "24%", top: "10%" }, // 🌈 rainbow, arcing up-left
  cometa: { left: "88%", top: "20%" }, // 🪁 kite, flying up-right
  cohete: { left: "12%", top: "34%" }, // 🚀 rocket, zooming past the left
  luna: { left: "86%", top: "8%" }, // 🌙 moon, high in the corner
  "bola-magica": { left: "82%", top: "76%" }, // 🔮 crystal ball, held low-right
  diamante: { left: "62%", top: "84%" }, // 💎 gem, worn near the collar
  dona: { left: "16%", top: "62%" }, // 🍩 donut, held low-left
  girasol: { left: "70%", top: "24%" }, // 🌻 sunflower, by the other ear
  tambor: { left: "50%", top: "90%" }, // 🥁 drum, at the feet
  patineta: { left: "76%", top: "90%" }, // 🛹 skateboard, under a foot
  burbujas: { left: "12%", top: "44%" }, // 🫧 bubbles, drifting left
  violin: { left: "86%", top: "44%" }, // 🎻 violin, held to the right
  pinata: { left: "90%", top: "32%" }, // 🪅 piñata, swinging up-right
  disco: { left: "38%", top: "4%" }, // 🪩 disco ball, hanging overhead
  trofeo: { left: "30%", top: "74%" }, // 🏆 trophy, held low-left
  planeta: { left: "4%", top: "8%" }, // 🪐 planet, orbiting the far corner
};

/** The default spot as plain percent numbers — the starting point a kid then
 *  drags from. Falls back to dead centre for any unmapped accessory. */
function defaultSpot(id: string): { x: number; y: number } {
  const spot = ACCESSORY_SPOTS[id];
  return { x: parseFloat(spot?.left ?? "50"), y: parseFloat(spot?.top ?? "50") };
}

/** La mascota: a menagerie fed with the stars won in games. Feeding grows
 *  the active pet; stars also adopt new pets, dress them, open surprise
 *  boxes, and buy themes — a renewable star sink. */
export function MascotaView() {
  const [kid, setKid] = useState<KidId | null>(null);
  const [collection, setCollection] = useState<PetCollection | null>(null);
  const [stars, setStars] = useState(0);
  const [munch, setMunch] = useState(0);
  const [evolved, setEvolved] = useState(false);
  const wobble = useDeniedWobble();
  const [surprise, setSurprise] = useState<string | null>(null);
  // The name editor: null when closed, else the in-progress draft.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [ownedAccessories, setOwnedAccessories] = useState<readonly string[]>([]);
  const [ownedThemes, setOwnedThemes] = useState<readonly string[]>([]);
  const [theme, setTheme] = useState("crema");
  // Live position of the accessory being dragged onto the pet (percent of the
  // pet box); null when nothing is being dragged.
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(
    null,
  );
  // Mirror of `drag` so pointerup reads the final spot without a stale closure.
  const dragRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const petBoxRef = useRef<HTMLDivElement>(null);

  function setDragPos(next: { id: string; x: number; y: number } | null) {
    dragRef.current = next;
    setDrag(next);
  }

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

  // While an accessory is being dragged, track the pointer at the window level
  // so the drag keeps up even when the finger leaves the little emoji, and the
  // release always lands (no reliance on pointer capture). Re-attaches only when
  // a drag begins/ends — `drag.id` — reading the live spot from dragRef.
  const dragId = drag?.id ?? null;
  useEffect(() => {
    if (dragId === null) return;
    const clamp = (n: number) => Math.max(0, Math.min(100, n));
    const move = (e: PointerEvent) => {
      const box = petBoxRef.current;
      if (!box) return;
      const r = box.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      setDragPos({
        id: dragId,
        x: clamp(((e.clientX - r.left) / r.width) * 100),
        y: clamp(((e.clientY - r.top) / r.height) * 100),
      });
    };
    const end = () => {
      const d = dragRef.current;
      const k = getSelectedKid() ?? "listener";
      if (d) {
        placeAccessoryOnActive(k, d.id, d.x, d.y);
        refresh(k);
      }
      setDragPos(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [dragId]);

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
      wobble.deny();
      return;
    }
    // Celebrate only when a brand-new form unlocks — some species grow through
    // fewer forms than others, so a meal isn't always a visible stage.
    const grewUp =
      petMaxForm(activeId, result.pet.meals) > petMaxForm(activeId, before);
    refresh(kid);
    // Purchases are progress: push so the other device sees the meal/stars
    // without waiting for the next game to complete (bugs.md #5).
    void syncPush();
    setMunch((n) => n + 1);
    if (grewUp) {
      setEvolved(true);
      feedbackFanfare();
    } else {
      feedbackMatch();
    }
  }

  /** Save the name draft to the active pet (free), then close the editor. */
  function saveName() {
    if (kid === null || nameDraft === null) return;
    nameActivePet(kid, nameDraft);
    setNameDraft(null);
    feedbackSticker();
    refresh(kid);
    // A name is progress worth syncing (mergePet never clobbers it).
    void syncPush();
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
          ref={petBoxRef}
          key={`${activeId}-${chosenForm}-${munch}`}
          className={`relative text-[8rem] leading-none ${munch > 0 ? "pop-in" : ""} ${
            hungry ? "opacity-70 grayscale-[30%]" : ""
          }`}
          aria-label={`Your pet: ${species.nameSpanish}, ${pet.meals} meals`}
        >
          {petFormEmoji(activeId, chosenForm)}
          {wornAccessories(pet).map((id) => {
            const item = ACCESSORIES.find((a) => a.id === id);
            if (!item) return null;
            // Live drag wins; otherwise the kid's saved spot, else the default.
            const pos =
              drag?.id === id
                ? { x: drag.x, y: drag.y }
                : accessoryPlacement(pet, id) ?? defaultSpot(id);

            return (
              <span
                key={id}
                role="button"
                aria-label={`Move ${item.emoji}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none text-5xl active:cursor-grabbing"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  setDragPos({ id, x: pos.x, y: pos.y });
                }}
              >
                {item.emoji}
              </span>
            );
          })}
        </div>

        {nameDraft === null ? (
          <button
            type="button"
            onClick={() => setNameDraft(pet.name ?? "")}
            aria-label={
              pet.name
                ? `${pet.name} — tap to rename`
                : `${species.nameSpanish} — tap to give a name`
            }
            className="flex items-center gap-2 active:opacity-70"
          >
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              {pet.name ?? species.nameSpanish}
            </h1>
            <span aria-hidden className="text-2xl">
              ✏️
            </span>
          </button>
        ) : (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              saveName();
            }}
          >
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={MAX_PET_NAME}
              placeholder={species.nameSpanish}
              aria-label="Name your pet"
              className="w-48 rounded-2xl border-4 border-ink bg-white px-4 py-2 text-center text-2xl font-extrabold outline-none placeholder:text-ink/30"
            />
            <button
              type="submit"
              aria-label="Save the name"
              className="sticker flex h-14 w-14 items-center justify-center rounded-2xl text-2xl active:translate-x-1 active:translate-y-1 active:shadow-none"
              style={{ "--sticker-face": "var(--color-lime)" } as React.CSSProperties}
            >
              ✅
            </button>
          </form>
        )}
        {pet.name && nameDraft === null && (
          <p aria-hidden className="-mt-2 text-sm font-semibold text-ink/40">
            {species.nameSpanish}
          </p>
        )}
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
          key={wobble.nonce}
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
                  const res = adoptSpecies(kid, s.id);
                  if (res === null) {
                    wobble.deny();
                    return;
                  }
                  feedbackFanfare();
                  refresh(kid);
                  void syncPush();
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
              wobble.deny();
              return;
            }
            feedbackRacha();
            refresh(kid);
            void syncPush();
            const r = res.result;
            setSurprise(
              r.type === "accessory"
                ? `¡${ACCESSORIES.find((a) => a.id === r.id)?.emoji ?? "🎁"} nuevo!`
                : r.type === "freeze"
                  ? "❄️ ¡nuevo!"
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
                  const res = buyAccessoryForActive(kid, item.id);
                  if (res === null) {
                    wobble.deny();
                    return;
                  }
                  feedbackSticker();
                  refresh(kid);
                  void syncPush();
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
                    wobble.deny();
                    return;
                  }
                  // Themes stay per-device, but the stars they cost sync.
                  void syncPush();
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

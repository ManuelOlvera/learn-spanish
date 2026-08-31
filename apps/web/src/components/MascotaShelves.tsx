"use client";

import {
  ACCESSORIES,
  isPetHungry,
  petFormEmoji,
  petMaxForm,
  PET_SPECIES,
  type PetCollection,
  type PetSpecies,
} from "@learn-spanish/core";
import { THEMES, type Theme } from "@/lib/theme";

/**
 * The three shopping shelves under la mascota: the menagerie, the wardrobe and
 * the themes. Pure presentation — every one of them takes what it should show
 * and hands taps back up, because the rules they obey (can this be afforded,
 * does a buy need confirming, what does a purchase cascade into) all belong to
 * `MascotaView` and, below it, to core's use cases.
 *
 * They are three components rather than one generic grid on purpose. The shape
 * rhymes — a titled grid of sticker buttons, each either owned and free to use
 * or buyable for stars — but what a tile *shows* does not: a pet carries a
 * hunger badge and a growth form, an accessory carries a worn state, a theme is
 * a colour swatch. One component covering all three would take a render prop
 * per difference, which is the same code with the seams hidden.
 */

const TILE =
  "sticker flex flex-col items-center gap-1 p-3 active:translate-x-1 active:translate-y-1 active:shadow-none";

/** The lime face that marks the chosen pet, the worn accessory, the live theme. */
const CHOSEN = { "--sticker-face": "var(--color-lime)" } as React.CSSProperties;

function Shelf({
  title,
  columns,
  children,
}: {
  title: string;
  columns: 3 | 4;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full">
      <h2 className="mb-2 text-lg font-extrabold text-ink/70">{title}</h2>
      <div className={`grid gap-3 ${columns === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
        {children}
      </div>
    </section>
  );
}

interface PetShelfProps {
  collection: PetCollection;
  /** Today's day key — a pet is hungry relative to when it was last fed. */
  today: string;
  onPlay: (speciesId: string) => void;
  onAdopt: (species: PetSpecies) => void;
}

/** Mis mascotas: every species, owned ones playable, the rest adoptable. */
export function PetShelf({ collection, today, onPlay, onAdopt }: PetShelfProps) {
  return (
    <Shelf title="🐾 Mis mascotas" columns={4}>
      {PET_SPECIES.map((s) => {
        const owned = collection.owned.includes(s.id);
        const isActive = s.id === collection.active;
        const pet = collection.pets[s.id];
        const hungry = owned && isPetHungry(pet ?? null, today);
        return (
          <button
            type="button"
            key={s.id}
            onClick={() => (owned ? onPlay(s.id) : onAdopt(s))}
            aria-label={
              owned
                ? hungry
                  ? `Play with ${s.nameEnglish} (hungry)`
                  : `Play with ${s.nameEnglish}`
                : `Adopt ${s.nameEnglish} for ${s.cost} stars`
            }
            className={`${TILE} relative ${owned ? "" : "opacity-80"}`}
            style={isActive ? CHOSEN : undefined}
          >
            {hungry && (
              <span
                aria-hidden
                className="chest-tease absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-white text-base"
              >
                🥺
              </span>
            )}
            <span
              aria-hidden
              className={`text-4xl ${hungry ? "opacity-70 grayscale-[30%]" : ""}`}
            >
              {owned
                ? petFormEmoji(
                    s.id,
                    Math.min(pet?.form ?? Infinity, petMaxForm(s.id, pet?.meals ?? 0)),
                  )
                : s.stages[s.stages.length - 1]}
            </span>
            <span className="text-xs font-extrabold">
              {owned ? (isActive ? "★" : "") : `${s.cost}⭐`}
            </span>
          </button>
        );
      })}
    </Shelf>
  );
}

interface WardrobeProps {
  /** Accessory ids this kid owns (kid-level, not per-pet). */
  owned: readonly string[];
  /** Accessory ids the pet is wearing *in the form currently on screen*. */
  worn: readonly string[];
  onToggle: (accessoryId: string) => void;
  onBuy: (accessory: (typeof ACCESSORIES)[number]) => void;
}

/** El armario: buy an accessory once, then wear or remove it for free. */
export function Wardrobe({ owned, worn, onToggle, onBuy }: WardrobeProps) {
  return (
    <Shelf title="🛍️ El armario" columns={3}>
      {ACCESSORIES.map((item) => {
        const isOwned = owned.includes(item.id);
        const isWorn = worn.includes(item.id);
        return (
          <button
            type="button"
            key={item.id}
            onClick={() => (isOwned ? onToggle(item.id) : onBuy(item))}
            aria-label={
              !isOwned
                ? `Buy ${item.emoji} for ${item.cost} stars`
                : isWorn
                  ? `Take off ${item.emoji}`
                  : `Put on ${item.emoji}`
            }
            aria-pressed={isOwned ? isWorn : undefined}
            className={`${TILE} ${isOwned && !isWorn ? "opacity-60" : ""}`}
            style={isWorn ? CHOSEN : undefined}
          >
            <span aria-hidden className="text-4xl">
              {item.emoji}
            </span>
            <span className="text-sm font-extrabold">
              {!isOwned ? `${item.cost}⭐` : isWorn ? "✓" : "＋"}
            </span>
          </button>
        );
      })}
    </Shelf>
  );
}

interface ThemePickerProps {
  /** Theme ids bought; the free theme is owned implicitly. */
  owned: readonly string[];
  current: string;
  onSelect: (themeId: string) => void;
  onBuy: (theme: Theme) => void;
}

/** Temas: the paper colour of the whole app, per kid. */
export function ThemePicker({ owned, current, onSelect, onBuy }: ThemePickerProps) {
  return (
    <Shelf title="🎨 Temas" columns={3}>
      {THEMES.map((t) => {
        const isOwned = owned.includes(t.id) || t.cost === 0;
        const isCurrent = t.id === current;
        return (
          <button
            type="button"
            key={t.id}
            onClick={() => (isOwned ? onSelect(t.id) : onBuy(t))}
            aria-label={
              isOwned
                ? `Use the ${t.nameSpanish} theme`
                : `Buy ${t.nameSpanish} for ${t.cost} stars`
            }
            className={`${TILE} ${isCurrent ? "ring-4 ring-ink" : ""}`}
          >
            <span
              aria-hidden
              className="h-8 w-8 rounded-full border-4 border-ink"
              style={{ background: t.paper }}
            />
            <span className="text-xs font-extrabold">
              {isOwned ? (isCurrent ? "★" : t.nameSpanish) : `${t.cost}⭐`}
            </span>
          </button>
        );
      })}
    </Shelf>
  );
}

"use client";

import Link from "next/link";
import type { Deck } from "@learn-spanish/core";
import { deckAccent } from "@/lib/deck-theme";
import { useDeniedWobble } from "@/lib/use-denied-wobble";

interface Props {
  deck: Deck;
  unlocked: boolean;
  stars: number;
  /** Try to buy the unlock; returns false when refused (the tile wobbles). */
  onUnlock: () => boolean;
}

/** A home-shelf tile for a star-gated bonus deck: a mystery 🔮 with a price
 *  until bought, the real deck tile afterwards. */
export function SecretDeckTile({ deck, unlocked, stars, onUnlock }: Props) {
  const wobble = useDeniedWobble();
  const cost = deck.unlockCost ?? 0;

  if (unlocked) {
    return (
      <Link
        href={`/deck/${deck.id}`}
        aria-label={`${deck.nameEnglish} — unlocked`}
        style={{ "--accent": deckAccent(deck.id) } as React.CSSProperties}
        className="sticker pop-in relative flex min-h-40 flex-col items-center justify-center gap-1.5 p-4 transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none motion-safe:hover:-rotate-1"
      >
        <span aria-hidden className="sticker-peel" />
        <span aria-hidden className="text-5xl sm:text-6xl">
          {deck.emoji}
        </span>
        <span className="text-center text-xl font-extrabold sm:text-2xl">
          {deck.nameSpanish}
        </span>
        <span className="text-xs font-semibold text-ink/50">
          {deck.nameEnglish}
        </span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      key={`${deck.id}-${wobble.nonce}`}
      onClick={() => {
        if (!onUnlock()) {
          wobble.deny();
        }
      }}
      aria-label={`Unlock the mystery deck for ${cost} stars`}
      style={{ "--accent": deckAccent(deck.id) } as React.CSSProperties}
      className={`sticker pop-in relative flex min-h-40 flex-col items-center justify-center gap-1.5 p-4 active:translate-x-1 active:translate-y-1 active:shadow-none ${
        stars < cost ? "wobble" : ""
      }`}
    >
      <span aria-hidden className="sticker-peel" />
      <span aria-hidden className="text-5xl opacity-70 sm:text-6xl">
        🔮
      </span>
      <span className="text-center text-xl font-extrabold sm:text-2xl">
        ??? 🔒
      </span>
      <span
        aria-hidden
        className="rounded-full border-2 border-ink bg-white px-3 text-base font-extrabold"
      >
        {cost}⭐
      </span>
    </button>
  );
}

"use client";

import { useEffect, type ReactNode } from "react";

interface Props {
  /** The thing being bought, shown huge — an emoji, or a colour swatch. */
  preview: ReactNode;
  /** Price in stars, shown as a number a pre-reader can match to their wallet. */
  cost: number;
  /** Parent-facing description for the aria labels, e.g. "the 🐙 pet". */
  label: string;
  /** Confirm the purchase. */
  onYes: () => void;
  /** Back out — also fired by the backdrop tap and the auto-dismiss. */
  onNo: () => void;
}

/** A picture-only "buy this?" gate so a stray tap can't drain the stars.
 *  Pre-readers navigate it by colour and icon alone: green ✅ buys, red ❌
 *  backs out, and tapping the dimmed backdrop also cancels. Auto-cancels after
 *  a beat so a distracted kid is never stuck deciding. Every star spend goes
 *  through this — pets, accessories, themes, surprise boxes, avatars, secret
 *  decks and freezes — except the 5⭐ meal, which is the repeated core loop. */
export function BuyConfirm({ preview, cost, label, onYes, onNo }: Props) {
  useEffect(() => {
    const timer = setTimeout(onNo, 6000);
    return () => clearTimeout(timer);
  }, [onNo]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Dim, tappable backdrop — a sibling of the card so we never nest
          interactive elements inside one another. */}
      <button
        type="button"
        onClick={onNo}
        aria-label="Cancel — keep the stars"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-ink)_65%,transparent)]"
      />
      {/* One card, so the thing being bought reads as a single object even over
          a busy shop grid — the emoji alone got lost among the tiles. */}
      <span className="sticker pop-in relative flex flex-col items-center gap-5 px-10 pb-9 pt-7">
        <span aria-hidden className="sticker-peel" />
        <span
          aria-hidden
          className="flex text-8xl drop-shadow-[4px_4px_0_var(--color-ink)]"
        >
          {preview}
        </span>
        <span className="rounded-full border-4 border-ink bg-white px-6 py-1 text-3xl font-extrabold">
          {cost}⭐
        </span>
        <span className="flex items-center gap-6">
          <button
            type="button"
            onClick={onYes}
            aria-label={`Buy ${label} for ${cost} stars`}
            className="sticker flex h-24 w-24 items-center justify-center rounded-full text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
            style={{ "--accent": "var(--color-lime)" } as React.CSSProperties}
          >
            ✅
          </button>
          <button
            type="button"
            onClick={onNo}
            aria-label="No, keep the stars"
            className="sticker flex h-24 w-24 items-center justify-center rounded-full text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
            style={{ "--accent": "#fca5a5" } as React.CSSProperties}
          >
            ❌
          </button>
        </span>
      </span>
    </div>
  );
}

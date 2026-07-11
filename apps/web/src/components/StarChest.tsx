"use client";

import { useState } from "react";
import { feedbackRacha } from "@/lib/feedback";

interface Props {
  /** Stars inside the chest. */
  amount: number;
  /** Credit the balance etc. — called exactly once, when the chest opens. */
  onOpen: () => void;
}

/** The treasure chest: stars are WON here, visibly. Closed and wiggling
 *  until the kid taps it; then it bursts stars and shows the haul. */
export function StarChest({ amount, onOpen }: Props) {
  const [opened, setOpened] = useState(false);

  function open() {
    if (opened) {
      return;
    }
    setOpened(true);
    feedbackRacha();
    onOpen();
  }

  if (!opened) {
    return (
      <button
        type="button"
        onClick={open}
        aria-label={`Open the treasure chest (${amount} stars inside)`}
        className="sticker relative flex flex-col items-center gap-1 px-8 py-4 active:translate-x-1 active:translate-y-1 active:shadow-none"
      >
        <span aria-hidden className="chest-tease block text-7xl">
          🎁
        </span>
        <span className="text-xl font-extrabold">¡Toca el cofre!</span>
      </button>
    );
  }

  return (
    <div
      aria-label={`You won ${amount} stars`}
      className="sticker pop-in relative flex flex-col items-center gap-1 px-8 py-4"
      style={{ "--sticker-face": "var(--color-lime)" } as React.CSSProperties}
    >
      {Array.from({ length: Math.min(amount, 10) }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="star-fly text-4xl"
          style={
            {
              "--fly-x": `${Math.round(Math.cos((i / Math.min(amount, 10)) * Math.PI * 2) * 120)}px`,
              "--fly-y": `${Math.round(Math.sin((i / Math.min(amount, 10)) * Math.PI * 2) * 90 - 60)}px`,
              animationDelay: `${i * 60}ms`,
            } as React.CSSProperties
          }
        >
          ⭐
        </span>
      ))}
      <span aria-hidden className="block text-7xl">
        ✨
      </span>
      <span className="text-2xl font-extrabold">+{amount} ⭐</span>
    </div>
  );
}

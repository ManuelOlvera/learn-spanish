"use client";

import { useEffect, useRef, useState } from "react";
import { feedbackRacha } from "@/lib/feedback";

interface Props {
  /** Stars inside the chest. */
  amount: number;
  /** Credit the balance etc. — called exactly once per chest: on the tap, or
   *  on the way out if the kid never got to it. */
  onOpen: () => void;
}

/** The treasure chest: stars are WON here, visibly. Closed and wiggling
 *  until the kid taps it; then it bursts stars and shows the haul.
 *
 *  The tap is the celebration, not the paywall: kids (reto players especially,
 *  who slam 🔁 to chase a récord) were leaving the screen with the chest still
 *  shut and silently losing the round's stars. So the haul is banked on unmount
 *  too — `onOpen` fires exactly once either way. The closed chest also marks
 *  itself `data-chest="closed"`, which dims the ways off the screen (globals.css)
 *  so the chest is the only thing that still looks pressable. */
export function StarChest({ amount, onOpen }: Props) {
  const [opened, setOpened] = useState(false);
  // Guards the bank against firing twice (tap then unmount). A ref, not the
  // `opened` state, because the unmount path has to read it synchronously.
  const banked = useRef(false);
  // Always call the newest onOpen — the unmount path runs long after mount.
  const latest = useRef(onOpen);
  useEffect(() => {
    latest.current = onOpen;
  });

  // The safety net. In dev this fires once on mount too (StrictMode remounts
  // every effect), which banks the stars early but renders identically — prod
  // builds run the cleanup only on a real unmount.
  useEffect(
    () => () => {
      if (!banked.current) {
        banked.current = true;
        latest.current();
      }
    },
    [],
  );

  function open() {
    if (banked.current) {
      return;
    }
    banked.current = true;
    setOpened(true);
    feedbackRacha();
    onOpen();
  }

  if (!opened) {
    return (
      <button
        type="button"
        data-chest="closed"
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

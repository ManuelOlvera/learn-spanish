"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { feedbackChestOpen, feedbackChip, feedbackTick } from "@/lib/feedback";

/** One line of the chest's breakdown — a reason the haul got bigger. */
export interface ChestBonus {
  /** Stable key; also the order the chips land in. */
  readonly key: string;
  readonly emoji: string;
  /** Spanish, for the parent reading over the kid's shoulder. */
  readonly label: string;
  readonly amount: number;
}

/** Stable identity for the no-bonus case, so the reveal effects below don't
 *  re-run on every parent render (a fresh `[]` literal would restart the
 *  sequence mid-animation). */
const NO_BONUSES: readonly ChestBonus[] = [];

/** How long the counter takes to chase a new target, roughly — it advances a
 *  ninth of the remaining gap per frame, so it starts fast and eases in. */
const COUNT_DIVISOR = 9;
/** Minimum gap between counter ticks. Below ~45ms the ticks stop reading as
 *  separate sounds and turn into a buzz. */
const TICK_MS = 45;
/** The base total has settled by here, so the first bonus lands on a still
 *  number rather than racing it. */
const FIRST_CHIP_MS = 600;
const CHIP_GAP_MS = 520;

interface Props {
  /** Stars inside the chest. Locked before the chest is drawn and never
   *  recomputed — a kid who is slow to tap is paid the number they were
   *  shown (ADR 014). */
  amount: number;
  /** Credit the balance etc. — called exactly once per chest: on the tap, or
   *  on the way out if the kid never got to it. */
  onOpen: () => void;
  /** Why the haul is what it is. Each chip flies in after the base has counted
   *  up, adding itself to the running total, so the kid watches the number grow
   *  and sees the reason arrive with it. Omit for a chest with no breakdown
   *  (el reto, el duelo) — it then just counts up and stops. */
  bonuses?: readonly ChestBonus[];
  /** Fired on the tap only (never on the unmount safety net), so the screen
   *  around the chest can react to the size of the haul. */
  onOpened?: (amount: number) => void;
}

/** The treasure chest: stars are WON here, visibly. Closed and wiggling
 *  until the kid taps it; then it bursts, and the haul COUNTS UP — base first,
 *  then each bonus flying in on top of it.
 *
 *  The count-up is the point. The old chest resolved in a single frame, which
 *  spent the one genuinely exciting moment in the app on nothing; a number that
 *  climbs turns a reward into an event, and chips that land one at a time
 *  answer the question a flat total can't ("why is it so big?").
 *
 *  The tap is the celebration, not the paywall: kids (reto players especially,
 *  who slam 🔁 to chase a récord) were leaving the screen with the chest still
 *  shut and silently losing the round's stars. So the haul is banked on unmount
 *  too — `onOpen` fires exactly once either way, and it fires on the TAP rather
 *  than at the end of the animation, so leaving mid-count still pays. The closed
 *  chest also marks itself `data-chest="closed"`, which dims the ways off the
 *  screen (globals.css) so the chest is the only thing that still looks
 *  pressable. */
export function StarChest({ amount, onOpen, bonuses = NO_BONUSES, onOpened }: Props) {
  const [opened, setOpened] = useState(false);
  /** How many bonus chips have landed so far. */
  const [revealed, setRevealed] = useState(0);
  /** The counter's displayed value, which chases `target` frame by frame. */
  const [shown, setShown] = useState(0);
  const [reduced, setReduced] = useState(false);

  // Guards the bank against firing twice (tap then unmount). A ref, not the
  // `opened` state, because the unmount path has to read it synchronously.
  const banked = useRef(false);
  // Always call the newest onOpen — the unmount path runs long after mount.
  const latest = useRef(onOpen);
  useEffect(() => {
    latest.current = onOpen;
  });

  // Everything below the bonuses is what the base alone paid. Derived rather
  // than passed so the chips can never disagree with the total the kid is
  // actually credited — the number on screen has to be the number banked.
  const bonusTotal = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
  const base = Math.max(0, amount - bonusTotal);

  // Where the counter is heading right now: the base, plus every chip that has
  // already landed.
  const target = useMemo(
    () =>
      base +
      bonuses.slice(0, revealed).reduce((sum, bonus) => sum + bonus.amount, 0),
    [base, bonuses, revealed],
  );
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    // Honour the OS setting: no count-up, no chip stagger, just the answer.
    // `matchMedia` is missing in some embedded webviews, hence the guard.
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  }, []);

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

  // The counter. A ref mirrors the displayed value so the frame loop never
  // reads state it just set, and so the tick sound stays out of the setState
  // updater (StrictMode double-invokes those, which would double every tick).
  const shownRef = useRef(0);
  useEffect(() => {
    if (!opened) {
      return;
    }
    if (reduced) {
      shownRef.current = amount;
      setShown(amount);
      return;
    }
    let frame = 0;
    let lastTick = 0;
    const step = () => {
      const current = shownRef.current;
      if (current < targetRef.current) {
        const next = Math.min(
          targetRef.current,
          current + Math.max(1, Math.ceil((targetRef.current - current) / COUNT_DIVISOR)),
        );
        shownRef.current = next;
        setShown(next);
        const now = performance.now();
        if (now - lastTick >= TICK_MS) {
          lastTick = now;
          feedbackTick(amount === 0 ? 1 : next / amount);
        }
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [opened, reduced, amount]);

  // The chips, landing one at a time.
  useEffect(() => {
    if (!opened || bonuses.length === 0) {
      return;
    }
    if (reduced) {
      setRevealed(bonuses.length);
      return;
    }
    const timers = bonuses.map((_, index) =>
      setTimeout(
        () => {
          setRevealed(index + 1);
          feedbackChip(index);
        },
        FIRST_CHIP_MS + index * CHIP_GAP_MS,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [opened, reduced, bonuses]);

  function open() {
    if (banked.current) {
      return;
    }
    banked.current = true;
    setOpened(true);
    feedbackChestOpen();
    // Bank first, celebrate after: the stars are credited on the tap, so
    // nothing about the animation can cost a kid their haul.
    onOpen();
    onOpened?.(amount);
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

  // More stars for a bigger haul, so the burst itself scales with the win —
  // bounded at both ends: never a lonely two, never a machine-killing swarm.
  const flyers = Math.min(14, Math.max(6, Math.round(amount / 4)));

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        // The static total, not the ticking one: a screen reader should hear
        // what was won once, not every frame of the count.
        aria-label={`You won ${amount} stars`}
        className={`sticker pop-in relative flex flex-col items-center gap-1 px-8 py-4 ${
          reduced ? "" : "chest-thud"
        }`}
        style={{ "--sticker-face": "var(--color-lime)" } as React.CSSProperties}
      >
        {Array.from({ length: flyers }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className="star-fly text-4xl"
            style={
              {
                "--fly-x": `${Math.round(Math.cos((i / flyers) * Math.PI * 2) * 120)}px`,
                "--fly-y": `${Math.round(Math.sin((i / flyers) * Math.PI * 2) * 90 - 60)}px`,
                animationDelay: `${i * 45}ms`,
              } as React.CSSProperties
            }
          >
            ⭐
          </span>
        ))}
        <span aria-hidden className={`block text-6xl ${reduced ? "" : "chest-burst"}`}>
          ✨
        </span>
        {/* The number is the payoff, so it is the biggest thing in the chest —
            it used to be set smaller than the ✨ above it, which buried the one
            value the whole screen exists to deliver. Re-keyed on each chip so it
            takes a visible hit every time a bonus lands on it. */}
        <span
          key={revealed}
          aria-hidden
          className={`text-5xl font-extrabold leading-none ${reduced ? "" : "count-punch"}`}
        >
          +{shown} ⭐
        </span>
      </div>

      {revealed > 0 && (
        <div className="flex flex-wrap justify-center gap-2 text-sm font-extrabold">
          {bonuses.slice(0, revealed).map((bonus) => (
            <span
              key={bonus.key}
              aria-label={`${bonus.label} bonus: ${bonus.amount} stars`}
              className={`rounded-full border-2 border-ink bg-white px-3 py-0.5 ${
                reduced ? "" : "chip-land"
              }`}
            >
              {bonus.emoji} {bonus.label} +{bonus.amount}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

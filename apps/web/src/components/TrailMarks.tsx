"use client";

import { useState } from "react";
import type { StickerTier } from "@learn-spanish/core";

/**
 * How el camino is drawn on a tile it doesn't own: a row of pips for "how far
 * into this", and a corner badge for "you are here" / "this one is finished".
 *
 * Both are readable by picture alone — nothing here needs a 3-year-old to
 * read. The badge sits top-LEFT because the sticker's peeled corner owns the
 * top-right, and it never animates: home already has a mission burst, a gift
 * and a boost bolt competing for the eye, and the design language allows one
 * attention-seeking animation at a time.
 */

interface PipsProps {
  filled: number;
  total: number;
  /** What the pips are counting, for the parent reading the page aloud. */
  label: string;
}

export function TrailPips({ filled, total, label }: PipsProps) {
  if (total <= 0) {
    return null;
  }
  return (
    <span
      className="flex items-center justify-center gap-1"
      role="img"
      aria-label={`${label}: ${filled} de ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={`h-2.5 w-2.5 rounded-full border-2 border-ink ${
            i < filled ? "bg-ink" : "bg-white"
          }`}
        />
      ))}
    </span>
  );
}

/** A finished thing's medal, off the album's tiers: played, 3×, 5×. */
export const TIER_GLYPH: Record<StickerTier, string> = {
  none: "",
  earned: "⭐",
  silver: "🥈",
  gold: "🥇",
};

export const TIER_LABEL: Record<StickerTier, string> = {
  none: "pendiente",
  earned: "terminado",
  silver: "plata",
  gold: "oro",
};

/** `next` = the one thing to do now; a tier = finished, and how deeply; `exam`
 *  = the checkpoint is waiting; `locked` = not yet reachable (ADR 021). The
 *  medal is the album's, so a deck that shows 🥇 in the album shows 🥇 here. */
export function TrailBadge(
  props:
    | { state: "next" }
    | { state: "exam" }
    | { state: "super" }
    | { state: "locked" }
    | { state: "done"; tier: StickerTier },
) {
  const tier = props.state === "done" ? props.tier : "earned";
  const GLYPH: Record<string, string> = {
    next: "👉",
    exam: "🎓",
    super: "🏅",
    locked: "🔒",
    done: TIER_GLYPH[tier],
  };
  const LABEL: Record<string, string> = {
    next: "Sigue aquí",
    exam: "Examen",
    super: "Súper examen",
    locked: "Todavía no",
    done: TIER_LABEL[tier],
  };
  return (
    <span
      role="img"
      aria-label={LABEL[props.state]}
      className="absolute -left-1.5 -top-1.5 flex h-12 w-12 items-center justify-center rounded-full border-4 border-ink bg-white text-2xl"
    >
      <span aria-hidden>{GLYPH[props.state]}</span>
    </span>
  );
}

/**
 * A shelf the route has not opened yet.
 *
 * It is a **button, not a dead tile**. The audience constraint forbids dead
 * zones: a three-year-old who taps a shelf and gets nothing has been given no
 * information, which is precisely the failure ADR 016 feared about locking. So
 * a tap shakes the tile and the padlock — the answer is "not yet", delivered
 * physically, with no words to read.
 *
 * The tile keeps its emoji and its name at reduced contrast rather than going
 * blank: the kid should be able to see what is *coming*, which is the whole
 * motivational point of a route.
 */
export function LockedTile({
  children,
  label,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  const [shakes, setShakes] = useState(0);
  return (
    <button
      type="button"
      onClick={() => setShakes((n) => n + 1)}
      aria-label={`${label} — todavía no`}
      key={shakes}
      className={`sticker pop-in relative flex flex-col items-center justify-center gap-1.5 p-4 opacity-55 grayscale ${
        shakes > 0 ? "locked-shake" : ""
      } ${className}`}
      style={{ "--accent": "var(--color-ink)" } as React.CSSProperties}
    >
      <span aria-hidden className="sticker-peel" />
      <TrailBadge state="locked" />
      {children}
    </button>
  );
}

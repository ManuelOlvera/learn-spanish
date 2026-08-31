"use client";

import { forwardRef, useEffect, useRef } from "react";
import Link from "next/link";
import type { Camino, DeckGroup, StickerTier } from "@learn-spanish/core";
import { groupsInTrailOrder } from "@learn-spanish/core";
import { TIER_GLYPH, TIER_LABEL } from "@/components/TrailMarks";

interface Props {
  camino: Camino;
  groups: readonly DeckGroup[];
}

/**
 * Tu camino — the whole route on one line, so "where am I?" is answerable at a
 * glance. The home grid keeps its own browsing order (the kids find shelves by
 * position), so the ladder needs somewhere of its own to be *seen*; this is it.
 *
 * Three shades, so "where am I / what's left" is answerable without reading:
 * a finished stop is filled lime and wears its medal (⭐/🥈/🥇), the current one is white,
 * bigger and ringed, and a stop still ahead is pale. That last one is a *muted
 * progress display*, not a locked door — see below.
 *
 * Only the current stop is tappable, because the one thing you want from here
 * is "take me to where I left off"; the other nine would just be a second, less
 * legible copy of the shelf grid. This gates nothing: that grid sits directly
 * below with every shelf on it, one tap, exactly as before el camino existed.
 */
export function CaminoStrip({ camino, groups }: Props) {
  const hereRef = useRef<HTMLAnchorElement>(null);
  const ordered = groupsInTrailOrder(groups);

  // Scroll the current stop into view — with ten shelves the strip overflows on
  // a phone, and the one stop that must never be off-screen is "you are here".
  useEffect(() => {
    hereRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [camino.nextGroupId]);

  return (
    <section
      aria-label="Tu camino"
      className="sticker pop-in relative w-full px-4 py-3"
      style={{ "--accent": "var(--color-lime-deep)" } as React.CSSProperties}
    >
      <p className="mb-1 text-center text-xs font-extrabold uppercase tracking-widest text-ink/40">
        Tu camino
      </p>
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {ordered.map((group, i) => {
          const shelf = camino.shelves.find((s) => s.groupId === group.id);
          const done = shelf?.complete === true;
          const tier: StickerTier = shelf?.tier ?? "none";
          const here = group.id === camino.nextGroupId;
          return (
            <div key={group.id} className="flex shrink-0 items-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className={`h-1 w-4 sm:w-6 ${done ? "bg-[var(--color-lime-deep)]" : "bg-ink/15"}`}
                />
              )}
              <Stop
                ref={here ? hereRef : undefined}
                group={group}
                done={done}
                here={here}
                tier={tier}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface StopProps {
  group: DeckGroup;
  done: boolean;
  here: boolean;
  tier: StickerTier;
}

/**
 * One stop. The current one is a link ("continue where I left off"); the rest
 * are inert marks — a kid reaches those shelves from the grid below, which is
 * where shelf navigation has always lived.
 */
const Stop = forwardRef<HTMLAnchorElement, StopProps>(function Stop(
  { group, done, here, tier },
  ref,
) {
  // The current stop is the only tappable one, so it carries the design
  // language's >=64px floor (h-16); the inert marks are read, never pressed.
  const size = here ? "h-16 w-16 text-3xl" : "h-11 w-11 text-xl";
  // The three shades: filled = behind you, white = you, pale = ahead.
  const shade = done
    ? "border-ink bg-[var(--color-lime)]"
    : here
      ? "border-ink bg-white"
      : "border-ink/25 bg-paper";
  const face = (
    <>
      <span aria-hidden className={here || done ? undefined : "opacity-40"}>
        {group.emoji}
      </span>
      {done && (
        <span aria-hidden className="absolute -right-1 -top-1 text-sm leading-none">
          {TIER_GLYPH[tier]}
        </span>
      )}
      {here && (
        <span
          aria-hidden
          className="absolute -inset-1.5 rounded-full border-4 border-[var(--color-lime-deep)]"
        />
      )}
    </>
  );
  const shared = `relative flex shrink-0 items-center justify-center rounded-full border-4 ${size} ${shade}`;
  const state = done ? TIER_LABEL[tier] : here ? "estás aquí" : "pendiente";

  if (!here) {
    return (
      <span role="img" aria-label={`${group.nameSpanish} — ${state}`} className={shared}>
        {face}
      </span>
    );
  }
  return (
    <Link
      ref={ref}
      href={`/group/${group.id}`}
      aria-label={`${group.nameSpanish} — ${state}`}
      className={`${shared} active:translate-y-0.5`}
    >
      {face}
    </Link>
  );
});

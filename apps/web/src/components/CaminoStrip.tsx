"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Camino, DeckGroup } from "@learn-spanish/core";
import { groupsInTrailOrder } from "@learn-spanish/core";
import { deckAccent } from "@/lib/deck-theme";

interface Props {
  camino: Camino;
  groups: readonly DeckGroup[];
}

/**
 * Tu camino — the whole route on one line, so "where am I?" is answerable at a
 * glance. The home grid keeps its own browsing order (the kids find shelves by
 * position), so the ladder needs somewhere of its own to be *seen*; this is it.
 *
 * Every stop is a live link, finished or not — the strip shows the route, it
 * never gates it. Nothing is dimmed either: a stop the kid hasn't reached looks
 * exactly like one they have, minus the ⭐ and the ring.
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
          const here = group.id === camino.nextGroupId;
          return (
            <div key={group.id} className="flex shrink-0 items-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className={`h-1 w-4 sm:w-6 ${done ? "bg-[var(--color-lime-deep)]" : "bg-ink/15"}`}
                />
              )}
              <Link
                ref={here ? hereRef : undefined}
                href={`/group/${group.id}`}
                aria-label={`${group.nameSpanish}${done ? " — terminado" : here ? " — estás aquí" : ""}`}
                style={{ "--accent": deckAccent(group.id) } as React.CSSProperties}
                className={`relative flex items-center justify-center rounded-full border-4 border-ink bg-white active:translate-y-0.5 ${
                  here ? "h-14 w-14 text-3xl" : "h-11 w-11 text-xl"
                }`}
              >
                <span aria-hidden>{group.emoji}</span>
                {done && (
                  <span
                    aria-hidden
                    className="absolute -right-1 -top-1 text-sm leading-none"
                  >
                    ⭐
                  </span>
                )}
                {here && (
                  <span
                    aria-hidden
                    className="absolute -inset-1.5 rounded-full border-4 border-[var(--color-lime-deep)]"
                  />
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

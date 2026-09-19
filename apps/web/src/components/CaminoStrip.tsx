"use client";

import { forwardRef, useEffect, useRef } from "react";
import Link from "next/link";
import type {
  Camino,
  DeckGroup,
  ExamKind,
  StickerTier,
} from "@learn-spanish/core";
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
 * legible copy of the shelf grid directly below.
 *
 * Since ADR 021 that grid gates too, so the strip is no longer merely a quieter
 * view of it: a 🔒 here and a padlocked tile below say the same thing, and a 🎓
 * marks the shelf whose exam is the next move. When the current stop is an
 * exam, tapping it goes to the exam rather than back into finished decks.
 *
 * **Los súper exámenes get a stop of their own**, drawn on the path between the
 * shelf they belong to and the next one. A regular exam is a badge on its
 * shelf, but a súper is a wall — twenty questions across everything learned so
 * far — and a wall that only appears once you are standing at it is not on the
 * map at all. Before this, shelves 4, 8 and 12 looked exactly like 5, 6 and 7
 * until the moment their exam fell due. Now the three of them are visible from
 * the first day, pale and ahead, so "how far to the next big one" is a thing
 * you can count.
 */
export function CaminoStrip({ camino, groups }: Props) {
  const hereRef = useRef<HTMLAnchorElement>(null);
  const ordered = groupsInTrailOrder(groups);

  // Scroll the current stop into view — with twelve shelves plus three súper
  // stops the strip overflows on a phone, and the one stop that must never be
  // off-screen is "you are here".
  useEffect(() => {
    hereRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [camino.nextGroupId, camino.nextExamGroupId]);

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
          const examPending = shelf?.examPending === true;
          const locked = shelf?.locked === true;
          const isSuper = shelf?.examKind === "super";
          // When a súper is the next move, "you are here" belongs on the exam
          // stop rather than on the shelf it hangs off — the shelf is finished.
          const examHere = isSuper && camino.nextExamGroupId === group.id;
          return (
            <div key={group.id} className="flex shrink-0 items-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className={`h-1 w-4 sm:w-6 ${done ? "bg-[var(--color-lime-deep)]" : "bg-ink/15"}`}
                />
              )}
              <Stop
                ref={here && !examHere ? hereRef : undefined}
                group={group}
                done={done}
                here={here && !examHere}
                tier={tier}
                examPending={examPending && !isSuper}
                locked={locked}
                examKind={shelf?.examKind ?? "regular"}
              />
              {/* A súper examen is a stop, not a badge: it is the wall between
                  this shelf and the next, so it is drawn on the path. */}
              {isSuper && (
                <>
                  <span
                    aria-hidden
                    className={`h-1 w-4 sm:w-6 ${done ? "bg-[var(--color-lime-deep)]" : "bg-ink/15"}`}
                  />
                  <SuperStop
                    ref={examHere ? hereRef : undefined}
                    group={group}
                    passed={shelf?.examPassed === true}
                    here={examHere}
                    due={examPending}
                  />
                </>
              )}
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
  /** Its decks are all finished and the exam is what stands in the way. */
  examPending: boolean;
  /** The route has not opened this shelf yet (ADR 021). */
  locked: boolean;
  /** A súper examen sits at the ladder's thirds and reads differently. */
  examKind: ExamKind;
}

/**
 * One stop. The current one is a link ("continue where I left off"); the rest
 * are inert marks — a kid reaches those shelves from the grid below, which is
 * where shelf navigation has always lived.
 */
const Stop = forwardRef<HTMLAnchorElement, StopProps>(function Stop(
  { group, done, here, tier, examPending, locked, examKind },
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
      {done && !examPending && (
        <span aria-hidden className="absolute -right-1 -top-1 text-sm leading-none">
          {TIER_GLYPH[tier]}
        </span>
      )}
      {/* The checkpoint reads as its own kind of stop, not as a finished one:
          the decks are done but the shelf is not cleared until the exam is. */}
      {examPending && (
        <span aria-hidden className="absolute -right-1 -top-1 text-sm leading-none">
          {examKind === "super" ? "🏅" : "🎓"}
        </span>
      )}
      {locked && (
        <span aria-hidden className="absolute -right-1 -top-1 text-sm leading-none">
          🔒
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
  const state = examPending
    ? examKind === "super"
      ? "súper examen"
      : "examen"
    : locked
      ? "todavía no"
      : done
        ? TIER_LABEL[tier]
        : here
          ? "estás aquí"
          : "pendiente";

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
      href={examPending ? `/examen/${group.id}` : `/group/${group.id}`}
      aria-label={`${group.nameSpanish} — ${state}`}
      className={`${shared} active:translate-y-0.5`}
    >
      {face}
    </Link>
  );
});

interface SuperStopProps {
  group: DeckGroup;
  /** Its exam has been passed at some point. */
  passed: boolean;
  /** It is the next thing to do — the shelf is finished, the exam is not. */
  here: boolean;
  /** The shelf is complete, so the exam can actually be sat right now. */
  due: boolean;
}

/**
 * Un súper examen, drawn as a stop on the path rather than a badge on a tile.
 *
 * Three states, all readable without reading, like every other stop: passed is
 * filled lime and wears its 🏅; due is white, bigger, ringed and the only one
 * that is tappable; ahead is pale. The gold border is what separates it from a
 * shelf at a glance — a kid learns "the gold ones are the big tests" from the
 * shape, never from the word.
 *
 * It hangs off the shelf whose checkpoint it is (comida, transporte, verbos),
 * because that is what it examines *plus* everything before it. Tapping it
 * when it is not due would land on the refusal screen, so it stays inert until
 * the shelf is actually finished — the same rule the shelf stops follow.
 */
const SuperStop = forwardRef<HTMLAnchorElement, SuperStopProps>(function SuperStop(
  { group, passed, here, due },
  ref,
) {
  const size = here ? "h-16 w-16 text-3xl" : "h-11 w-11 text-xl";
  const shade = passed
    ? "border-[#b8860b] bg-[var(--color-lime)]"
    : here
      ? "border-[#b8860b] bg-white"
      : "border-[#b8860b]/30 bg-paper";
  const state = passed
    ? "súper examen aprobado"
    : here
      ? "súper examen — estás aquí"
      : due
        ? "súper examen"
        : "súper examen — todavía no";
  const face = (
    <>
      <span aria-hidden className={passed || here ? undefined : "opacity-40"}>
        🏅
      </span>
      {here && (
        <span
          aria-hidden
          className="absolute -inset-1.5 rounded-full border-4 border-[#b8860b]"
        />
      )}
    </>
  );
  const shared = `relative flex shrink-0 items-center justify-center rounded-full border-4 ${size} ${shade}`;

  if (!here) {
    return (
      <span
        role="img"
        aria-label={`${group.nameSpanish} — ${state}`}
        className={shared}
      >
        {face}
      </span>
    );
  }
  return (
    <Link
      ref={ref}
      href={`/examen/${group.id}`}
      aria-label={`${group.nameSpanish} — ${state}`}
      className={`${shared} active:translate-y-0.5`}
    >
      {face}
    </Link>
  );
});

"use client";

import Link from "next/link";
import {
  examKindFor,
  groupsInTrailOrder,
  type Camino,
  type DeckGroup,
  type TrailShelf,
} from "@learn-spanish/core";
import { TIER_GLYPH, TIER_LABEL } from "@/components/TrailMarks";
import { deckAccent } from "@/lib/deck-theme";

/**
 * El camino, as a map you can look at.
 *
 * The Tu camino strip on home answers *"where am I?"* in one line and
 * deliberately makes only the current stop tappable — the other eleven would
 * be a second, less legible copy of the shelf grid right below it. A whole
 * screen inverts that reasoning: here the map **is** the navigation, so every
 * shelf a kid may open is a door, and the grid is the thing that would be
 * redundant.
 *
 * Same vocabulary as the strip, at map scale, so the two read as one idea:
 * a finished shelf is filled lime and wears its medal, the current one is
 * white and ringed, a shelf still ahead is pale, and a locked one wears 🔒.
 * The súper exámenes keep their own gold stops on the path between shelves.
 *
 * The route snakes — stops alternate left and right — because a straight
 * column of twelve identical cards reads as a list, and the thing a kid likes
 * about a map is that it looks like a journey. The cards are narrower than
 * they need to be for exactly that reason: at full width the alternation is
 * invisible and the snake stops being one.
 */
export function CaminoMap({
  camino,
  groups,
}: {
  camino: Camino;
  groups: readonly DeckGroup[];
}) {
  const ladder = groupsInTrailOrder(groups);
  const byId = new Map(ladder.map((g) => [g.id, g]));

  return (
    <ol className="flex w-full flex-col items-stretch gap-0">
      {camino.shelves.map((shelf, i) => {
        const group = byId.get(shelf.groupId);
        const isNext = camino.nextGroupId === shelf.groupId;
        // A súper's stop is drawn *after* the shelf it examines, on the path
        // to the next one — the same placement the strip uses.
        const superAfter =
          examKindFor(i) === "super" ? shelf : null;
        return (
          <li key={shelf.groupId} className="flex flex-col items-stretch">
            <Stop
              shelf={shelf}
              group={group}
              index={i}
              isNext={isNext}
            />
            {superAfter !== null && (
              <SuperStop shelf={superAfter} last={i === camino.shelves.length - 1} />
            )}
            {i < camino.shelves.length - 1 && <PathDots />}
          </li>
        );
      })}
    </ol>
  );
}

/** The connector. Three dots is the whole of it — the path is implied by the
 *  stops alternating, not drawn as a line that would have to bend. */
function PathDots() {
  return (
    <span aria-hidden className="flex justify-center gap-2 py-2">
      {[0, 1, 2].map((d) => (
        <span key={d} className="h-2 w-2 rounded-full bg-ink/20" />
      ))}
    </span>
  );
}

function Stop({
  shelf,
  group,
  index,
  isNext,
}: {
  shelf: TrailShelf;
  group: DeckGroup | undefined;
  index: number;
  isNext: boolean;
}) {
  const left = index % 2 === 0;
  const done = shelf.complete;
  const name = group?.nameSpanish ?? shelf.groupId;
  // A regular exam that is the next move. ADR 021: "Regular exams stay a badge
  // on their shelf" — not a stop of their own, because a ten-question
  // checkpoint must not carry the same visual weight as a twenty-question
  // sweep. (Its other reason, that stops would overflow the strip, died with
  // the strip; this one did not.) Los súper get `SuperStop` instead.
  const examDue =
    shelf.examKind === "regular" && shelf.examPending && !shelf.examPassed;

  // The face colour must travel as `--sticker-face`: `.sticker` sets
  // `background` in an unlayered rule, which beats Tailwind's `bg-*`
  // utilities, so a `bg-lime` here is silently ignored. Every finished shelf
  // came out white the first time.
  const face = shelf.locked
    ? "color-mix(in srgb, var(--color-ink) 8%, white)"
    : done
      ? "var(--color-lime)"
      : "white";

  const card = (
    <span
      className={`sticker relative flex w-[74%] items-center gap-4 p-4 ${
        isNext ? "ring-4 ring-ink" : ""
      } ${shelf.locked ? "opacity-70" : ""}`}
      style={
        {
          "--accent": deckAccent(shelf.groupId),
          "--sticker-face": face,
        } as React.CSSProperties
      }
    >
      <span
        aria-hidden
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-ink bg-paper text-3xl"
      >
        {shelf.locked ? "🔒" : group?.emoji}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
        <span className="truncate text-lg font-extrabold">{name}</span>
        {shelf.locked ? (
          <span className="text-xs font-semibold text-ink/50">
            Termina la anterior
          </span>
        ) : (
          <>
            {/* How far into this shelf — one pip per deck, the same count the
                home tile shows. */}
            <span aria-hidden className="flex flex-wrap gap-1">
              {shelf.steps.map((step, s) => (
                <span
                  key={s}
                  className={`h-2.5 w-2.5 rounded-full border-2 border-ink ${
                    step.complete ? "bg-[var(--color-lime-deep)]" : "bg-transparent"
                  }`}
                />
              ))}
            </span>
            <span className="text-xs font-semibold text-ink/60">
              {shelf.doneSteps}/{shelf.steps.length} mazos
              {shelf.tier !== "none" && ` · ${TIER_GLYPH[shelf.tier]}`}
              {shelf.examPassed && " · 🎓"}
            </span>
          </>
        )}
      </span>
      {examDue && (
        <span className="absolute -top-3 right-4 flex items-center gap-1 rounded-full border-4 border-ink bg-[var(--color-lime)] px-3 py-0.5 text-xs font-extrabold">
          <span aria-hidden>🎓</span> ¡Examen!
        </span>
      )}
      {isNext && (
        <span className="absolute -top-3 left-4 rounded-full border-4 border-ink bg-white px-3 py-0.5 text-xs font-extrabold">
          Aquí estás
        </span>
      )}
    </span>
  );

  const label = shelf.locked
    ? `${name} — locked, finish the shelf before it`
    : examDue
      ? `${name} — sit the exam`
      : `${name} — ${shelf.doneSteps} of ${shelf.steps.length} decks, ${TIER_LABEL[shelf.tier]}`;

  return (
    <span className={`flex ${left ? "justify-start" : "justify-end"}`}>
      {shelf.locked ? (
        // A locked stop is inert rather than a link that refuses: the shelf
        // page would only turn them away (ADR 021), and a door that opens on
        // to a no is worse than one that is visibly shut.
        // `contents` only, exactly like the Link below: adding `flex w-full`
        // here made the wrapper the flex item and stretched it across the row,
        // so every locked stop ignored `justify-end` and hugged the left — the
        // snake straightened out for precisely the shelves a kid has not
        // reached yet.
        <span aria-label={label} role="img" className="contents">
          {card}
        </span>
      ) : (
        <Link
          // While the exam is due it *is* the shelf's next move, so the card
          // goes there rather than back into decks that are already finished.
          // The strip did this and the map lost it when the strip was deleted.
          href={examDue ? `/examen/${shelf.groupId}` : `/group/${shelf.groupId}`}
          aria-label={label}
          className="contents"
        >
          {card}
        </Link>
      )}
    </span>
  );
}

/** A súper examen's own stop, gold and on the path itself (ADR 021's
 *  addendum): passed is filled, due is ringed and tappable, ahead is pale. */
function SuperStop({ shelf, last }: { shelf: TrailShelf; last: boolean }) {
  const due = shelf.examPending && !shelf.examPassed;
  const body = (
    <span
      className={`flex items-center gap-3 rounded-full border-4 border-[#f5a524] px-5 py-2 font-extrabold ${
        shelf.examPassed
          ? "bg-[var(--color-lime)]"
          : due
            ? "bg-white ring-4 ring-[#f5a524]"
            : "bg-[color-mix(in_srgb,var(--color-ink)_6%,white)] opacity-70"
      }`}
    >
      <span aria-hidden className="text-2xl">
        🏅
      </span>
      <span className="text-sm">
        {shelf.examPassed
          ? "Súper aprobado"
          : due
            ? "¡Súper examen!"
            : last
              ? "El final del camino"
              : "Súper examen"}
      </span>
    </span>
  );
  const label = shelf.examPassed
    ? "Súper exam passed"
    : due
      ? "Sit the súper exam"
      : "Súper exam, not yet";

  return (
    <span className="flex justify-center py-2">
      {due ? (
        <Link href={`/examen/${shelf.groupId}`} aria-label={label} className="contents">
          {body}
        </Link>
      ) : (
        <span aria-label={label} role="img" className="contents">
          {body}
        </span>
      )}
    </span>
  );
}

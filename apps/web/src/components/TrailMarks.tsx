"use client";

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

/** `next` = the one thing to do now; `done` = finished. Neither locks anything. */
export function TrailBadge({ state }: { state: "next" | "done" }) {
  const next = state === "next";
  return (
    <span
      role="img"
      aria-label={next ? "Sigue aquí" : "Terminado"}
      className="absolute -left-1.5 -top-1.5 flex h-12 w-12 items-center justify-center rounded-full border-4 border-ink bg-white text-2xl"
    >
      <span aria-hidden>{next ? "👉" : "⭐"}</span>
    </span>
  );
}

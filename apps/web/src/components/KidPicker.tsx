"use client";

import { ALL_KIDS, type KidId } from "@learn-spanish/core";
import { KID_META } from "@/lib/kid";

interface Props {
  onPick: (kid: KidId) => void;
}

/** Full-screen "who's playing?" — two avatars, navigable by picture alone. */
export function KidPicker({ onPick }: Props) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-10 p-6">
      <header className="text-center">
        <h1 className="text-5xl font-extrabold sm:text-6xl">¿Quién juega?</h1>
        <p className="mt-1 text-lg font-semibold text-ink/60">
          Who&apos;s playing?
        </p>
      </header>
      <div className="grid w-full max-w-md grid-cols-2 gap-8">
        {ALL_KIDS.map((id, i) => {
          const meta = KID_META[id];
          return (
            <button
              type="button"
              key={id}
              onClick={() => onPick(id)}
              aria-label={`Play as ${meta.name} (${meta.english})`}
              className="sticker pop-in relative flex aspect-square flex-col items-center justify-center gap-2 p-4 active:translate-x-1 active:translate-y-1 active:shadow-none"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span aria-hidden className="sticker-peel" />
              <span aria-hidden className="text-8xl">
                {meta.avatar}
              </span>
              <span className="text-3xl font-extrabold">{meta.name}</span>
              <span aria-hidden className="text-2xl">
                {meta.glyph}
              </span>
            </button>
          );
        })}
      </div>
    </main>
  );
}

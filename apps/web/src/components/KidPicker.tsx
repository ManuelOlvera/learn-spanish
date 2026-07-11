"use client";

import { useEffect, useState } from "react";
import { ALL_KIDS, type KidId } from "@learn-spanish/core";
import { AVATAR_CHOICES, getAvatar, KID_META, setAvatar } from "@/lib/kid";

interface Props {
  onPick: (kid: KidId) => void;
}

/** Full-screen "who's playing?" — two avatars, navigable by picture alone.
 *  The 🎨 badge on each tile opens the avatar chooser for that kid. */
export function KidPicker({ onPick }: Props) {
  const [avatars, setAvatars] = useState<Record<KidId, string> | null>(null);
  const [choosingFor, setChoosingFor] = useState<KidId | null>(null);

  useEffect(() => {
    setAvatars({ listener: getAvatar("listener"), reader: getAvatar("reader") });
  }, []);

  if (avatars === null) {
    return <main className="min-h-dvh" aria-hidden />;
  }

  if (choosingFor !== null) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-8 p-6">
        <header className="text-center">
          <h1 className="text-5xl font-extrabold sm:text-6xl">
            Elige tu cara
          </h1>
          <p className="mt-1 text-lg font-semibold text-ink/60">
            Pick your avatar ({KID_META[choosingFor].english})
          </p>
        </header>
        <div className="grid w-full max-w-md grid-cols-4 gap-4">
          {AVATAR_CHOICES.map((emoji, i) => (
            <button
              type="button"
              key={emoji}
              onClick={() => {
                setAvatar(choosingFor, emoji);
                setAvatars({ ...avatars, [choosingFor]: emoji });
                setChoosingFor(null);
              }}
              aria-label={`Choose ${emoji}`}
              className="sticker pop-in flex aspect-square items-center justify-center text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
              style={
                avatars[choosingFor] === emoji
                  ? ({
                      "--sticker-face": "var(--color-lime)",
                      animationDelay: `${i * 25}ms`,
                    } as React.CSSProperties)
                  : ({ animationDelay: `${i * 25}ms` } as React.CSSProperties)
              }
            >
              {emoji}
            </button>
          ))}
        </div>
      </main>
    );
  }

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
            <div key={id} className="relative">
              <button
                type="button"
                onClick={() => onPick(id)}
                aria-label={`Play as ${avatars[id]} (${meta.english})`}
                className="sticker pop-in relative flex aspect-square w-full flex-col items-center justify-center gap-2 p-4 active:translate-x-1 active:translate-y-1 active:shadow-none"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span aria-hidden className="sticker-peel" />
                <span aria-hidden className="text-8xl">
                  {avatars[id]}
                </span>
                <span aria-hidden className="text-3xl">
                  {meta.glyph}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setChoosingFor(id)}
                aria-label={`Change avatar (${meta.english})`}
                className="sticker absolute -bottom-3 -right-3 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                🎨
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}

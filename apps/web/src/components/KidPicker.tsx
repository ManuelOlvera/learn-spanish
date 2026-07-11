"use client";

import { useEffect, useState } from "react";
import {
  ALL_KIDS,
  AVATAR_UNLOCKS,
  isAvatarUnlocked,
  type AvatarProgress,
  type KidId,
} from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { getAlbum, getStreak } from "@/lib/album";
import { AVATAR_CHOICES, getAvatar, KID_META, setAvatar } from "@/lib/kid";
import { feedbackSticker, feedbackWrong } from "@/lib/feedback";

interface Props {
  onPick: (kid: KidId) => void;
}

/** Full-screen "who's playing?" — two avatars, navigable by picture alone.
 *  The 🎨 badge on each tile opens the avatar chooser for that kid. */
export function KidPicker({ onPick }: Props) {
  const [avatars, setAvatars] = useState<Record<KidId, string> | null>(null);
  const [choosingFor, setChoosingFor] = useState<KidId | null>(null);
  const [progress, setProgress] = useState<AvatarProgress>({
    stickerCount: 0,
    streakDays: 0,
  });
  const [lockedTap, setLockedTap] = useState<{ avatar: string; nonce: number } | null>(
    null,
  );

  useEffect(() => {
    setAvatars({ listener: getAvatar("listener"), reader: getAvatar("reader") });
  }, []);

  // Unlocks are earned per kid: their stickers, their streak.
  useEffect(() => {
    if (choosingFor === null) {
      return;
    }
    let cancelled = false;
    Promise.all([getAlbum.execute(choosingFor), getStreak.execute(choosingFor)])
      .then(([stickers, streak]) => {
        if (!cancelled) {
          setProgress({
            stickerCount: stickers.length,
            streakDays: streak?.count ?? 0,
          });
        }
      })
      .catch((err: unknown) =>
        log.error("avatar-unlock", "failed to load progress", { err }),
      );
    return () => {
      cancelled = true;
    };
  }, [choosingFor]);

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
          {AVATAR_CHOICES.map((emoji, i) => {
            const unlocked = isAvatarUnlocked(emoji, progress);
            const requirement = AVATAR_UNLOCKS[emoji];
            const isWrong = lockedTap?.avatar === emoji;
            return (
              <button
                type="button"
                key={`${emoji}-${isWrong ? lockedTap.nonce : 0}`}
                onClick={() => {
                  if (!unlocked) {
                    // Locked: wobble and show what it takes.
                    feedbackWrong();
                    setLockedTap((prev) => ({
                      avatar: emoji,
                      nonce: (prev?.nonce ?? 0) + 1,
                    }));
                    return;
                  }
                  feedbackSticker();
                  setAvatar(choosingFor, emoji);
                  setAvatars({ ...avatars, [choosingFor]: emoji });
                  setChoosingFor(null);
                }}
                aria-label={
                  unlocked
                    ? `Choose ${emoji}`
                    : `${emoji} locked — needs ${requirement!.count} ${
                        requirement!.type === "stickers" ? "stickers" : "day streak"
                      }`
                }
                className={`sticker pop-in relative flex aspect-square flex-col items-center justify-center text-5xl ${
                  unlocked
                    ? "active:translate-x-1 active:translate-y-1 active:shadow-none"
                    : "opacity-60"
                } ${isWrong ? "wobble" : ""}`}
                style={
                  avatars[choosingFor] === emoji
                    ? ({
                        "--sticker-face": "var(--color-lime)",
                        animationDelay: `${i * 25}ms`,
                      } as React.CSSProperties)
                    : ({ animationDelay: `${i * 25}ms` } as React.CSSProperties)
                }
              >
                <span aria-hidden className={unlocked ? "" : "opacity-40 grayscale"}>
                  {emoji}
                </span>
                {!unlocked && requirement && (
                  <span
                    aria-hidden
                    className="absolute -bottom-2 rounded-full border-2 border-ink bg-white px-2 text-xs font-extrabold"
                  >
                    🔒 {requirement.count}
                    {requirement.type === "stickers" ? "📔" : "☀️"}
                  </span>
                )}
              </button>
            );
          })}
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

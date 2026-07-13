"use client";

import { useEffect, useState } from "react";
import {
  ALL_KIDS,
  avatarCost,
  isAvatarOwned,
  type KidId,
} from "@learn-spanish/core";
import {
  AVATAR_CHOICES,
  getAvatar,
  KID_META,
  setAvatar,
} from "@/lib/kid";
import { buyAvatar, getOwnedAvatars, getStars } from "@/lib/economy";
import { feedbackSticker, feedbackWrong } from "@/lib/feedback";

interface Props {
  onPick: (kid: KidId) => void;
}

/** Full-screen "who's playing?" — two avatars, navigable by picture alone.
 *  The 🎨 badge opens the avatar shop: free faces plus ones bought with stars. */
export function KidPicker({ onPick }: Props) {
  const [avatars, setAvatars] = useState<Record<KidId, string> | null>(null);
  const [choosingFor, setChoosingFor] = useState<KidId | null>(null);
  const [stars, setStars] = useState(0);
  const [owned, setOwned] = useState<readonly string[]>([]);
  const [nope, setNope] = useState<{ avatar: string; nonce: number } | null>(null);

  useEffect(() => {
    setAvatars({ listener: getAvatar("listener"), reader: getAvatar("reader") });
  }, []);

  useEffect(() => {
    if (choosingFor === null) {
      return;
    }
    setStars(getStars(choosingFor));
    // The currently-worn face always counts as owned (migration safety).
    setOwned([...getOwnedAvatars(choosingFor), getAvatar(choosingFor)]);
  }, [choosingFor]);

  if (avatars === null) {
    return <main className="min-h-dvh" aria-hidden />;
  }

  if (choosingFor !== null) {
    const kid = choosingFor;
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 p-6">
        <header className="text-center">
          <h1 className="text-5xl font-extrabold sm:text-6xl">Elige tu cara</h1>
          <p className="mt-1 text-lg font-semibold text-ink/60">
            Pick your avatar ({KID_META[kid].english})
          </p>
        </header>
        <span
          aria-label={`You have ${stars} stars`}
          className="rounded-full border-4 border-ink bg-white px-5 py-1 text-2xl font-extrabold"
        >
          ⭐ {stars}
        </span>
        <div className="grid w-full max-w-md grid-cols-4 gap-4">
          {AVATAR_CHOICES.map((emoji, i) => {
            const isOwned = isAvatarOwned(emoji, owned);
            const cost = avatarCost(emoji);
            const isWrong = nope?.avatar === emoji;
            const selected = avatars[kid] === emoji;
            return (
              <button
                type="button"
                key={`${emoji}-${isWrong ? nope.nonce : 0}`}
                onClick={() => {
                  if (isOwned) {
                    feedbackSticker();
                    setAvatar(kid, emoji);
                    setAvatars({ ...avatars, [kid]: emoji });
                    setChoosingFor(null);
                    return;
                  }
                  const balance = buyAvatar(kid, emoji);
                  if (balance === null) {
                    feedbackWrong();
                    setNope((prev) => ({ avatar: emoji, nonce: (prev?.nonce ?? 0) + 1 }));
                    return;
                  }
                  // Bought — wear it right away.
                  feedbackSticker();
                  setStars(balance);
                  setOwned([...owned, emoji]);
                  setAvatar(kid, emoji);
                  setAvatars({ ...avatars, [kid]: emoji });
                  setChoosingFor(null);
                }}
                aria-label={
                  isOwned ? `Choose ${emoji}` : `Buy ${emoji} for ${cost} stars`
                }
                className={`sticker pop-in relative flex aspect-square items-center justify-center text-5xl ${
                  "active:translate-x-1 active:translate-y-1 active:shadow-none"
                } ${isWrong ? "wobble" : ""}`}
                style={
                  selected
                    ? ({
                        "--sticker-face": "var(--color-lime)",
                        animationDelay: `${i * 20}ms`,
                      } as React.CSSProperties)
                    : ({ animationDelay: `${i * 20}ms` } as React.CSSProperties)
                }
              >
                <span aria-hidden className={isOwned ? "" : "opacity-45"}>
                  {emoji}
                </span>
                {!isOwned && (
                  <span
                    aria-hidden
                    className="absolute -bottom-2 rounded-full border-2 border-ink bg-white px-1.5 text-xs font-extrabold"
                  >
                    {cost}⭐
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setChoosingFor(null)}
          aria-label="Done choosing"
          className="sticker px-6 py-2 text-lg font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          ✓ Listo
        </button>
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

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createDuel,
  type Deck,
  type DuelGame,
  type KidId,
} from "@learn-spanish/core";
import { cardFace, emojiSizeClass } from "@/lib/emoji";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { getAvatar } from "@/lib/kid";
import { addStars, markActivityDone } from "@/lib/economy";
import { feedbackFanfare } from "@/lib/feedback";
import { useCombo } from "@/lib/use-combo";
import { RachaBurst } from "@/components/RachaBurst";
import { Confetti } from "@/components/Confetti";
import { StarChest } from "@/components/StarChest";

interface Props {
  deck: Deck;
  accent: string;
}

type Phase =
  | { at: "play"; kid: KidId }
  | { at: "handoff" }
  | { at: "results" };

const ADVANCE_MS = 1000;

/** Pass-the-tablet duel: same words, each kid at their own level, ⭐ for
 *  first-try answers. No stickers — bragging rights only. */
export function DuelPlayer({ deck, accent }: Props) {
  const [game, setGame] = useState<DuelGame | null>(null);
  const [phase, setPhase] = useState<Phase>({ at: "play", kid: "listener" });
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState<Record<KidId, number>>({
    listener: 0,
    reader: 0,
  });
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [wrongTap, setWrongTap] = useState<{ id: string; nonce: number } | null>(
    null,
  );
  const [avatars, setAvatars] = useState<Record<KidId, string>>({
    listener: "🦖",
    reader: "🦄",
  });
  const missed = useRef(false);
  const advanceTimer = useRef<number | null>(null);
  const combo = useCombo();

  useEffect(() => {
    warmUpVoices();
    setGame(createDuel(deck));
    setAvatars({ listener: getAvatar("listener"), reader: getAvatar("reader") });
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
    };
  }, [deck]);

  useEffect(() => {
    if (phase.at === "results") {
      feedbackFanfare();
      // Both kids played; the duel feeds both missions.
      markActivityDone("listener", "duel");
      markActivityDone("reader", "duel");
    }
  }, [phase]);

  const rounds = game?.rounds ?? [];
  const current = phase.at === "play" ? rounds[round] : undefined;

  function restart() {
    setGame(createDuel(deck));
    setPhase({ at: "play", kid: "listener" });
    setRound(0);
    setStars({ listener: 0, reader: 0 });
    setCorrectId(null);
    setWrongTap(null);
    missed.current = false;
    combo.reset();
  }

  function advance(kid: KidId) {
    if (round + 1 < rounds.length) {
      setRound(round + 1);
      return;
    }
    combo.reset();
    setRound(0);
    setPhase(kid === "listener" ? { at: "handoff" } : { at: "results" });
  }

  function choose(kid: KidId, cardId: string) {
    if (!current || correctId !== null) {
      return;
    }
    if (cardId === current.target.id) {
      setCorrectId(cardId);
      setWrongTap(null);
      combo.correct();
      if (!missed.current) {
        setStars((s) => ({ ...s, [kid]: s[kid] + 1 }));
      }
      missed.current = false;
      speakSpanish(current.target.spanish);
      advanceTimer.current = window.setTimeout(() => {
        setCorrectId(null);
        advance(kid);
      }, ADVANCE_MS);
    } else {
      missed.current = true;
      combo.wrong();
      setWrongTap((prev) => ({ id: cardId, nonce: (prev?.nonce ?? 0) + 1 }));
    }
  }

  function playRound(kid: KidId) {
    if (!current) {
      return <section className="flex-1" aria-hidden />;
    }
    const choices =
      kid === "listener" ? current.listenChoices : current.readChoices;
    return (
      <>
        <section className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-4xl">
              {avatars[kid]}
            </span>
            <span
              aria-label={`${stars[kid]} stars so far`}
              className="rounded-full border-4 border-ink bg-white px-4 py-1 text-xl font-extrabold"
            >
              ⭐ {stars[kid]}
            </span>
          </div>

          {kid === "listener" ? (
            <button
              type="button"
              onClick={() => speakSpanish(current.target.spanish)}
              aria-label={`Hear the word (${current.target.english})`}
              className="sticker flex h-32 w-32 items-center justify-center text-6xl active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              🔊
            </button>
          ) : (
            <div
              key={current.target.id}
              className="sticker pop-in relative flex w-full max-w-md items-center justify-center px-8 py-5"
            >
              <span aria-hidden className="sticker-peel" />
              <span className="text-4xl font-extrabold sm:text-5xl">
                {current.target.spanish}
              </span>
            </div>
          )}

          <div className="grid w-full max-w-md grid-cols-2 gap-6">
            {choices.map((choice) => {
              const isCorrectPick = correctId === choice.id;
              const isWrongPick = wrongTap?.id === choice.id;
              return (
                <button
                  type="button"
                  key={`${current.target.id}-${choice.id}-${
                    isWrongPick ? wrongTap.nonce : 0
                  }`}
                  onClick={() => choose(kid, choice.id)}
                  aria-label={`Pick ${choice.english}`}
                  className={`sticker flex aspect-square items-center justify-center p-4 ${
                    isCorrectPick ? "pop-in" : isWrongPick ? "wobble" : ""
                  }`}
                  style={
                    isCorrectPick
                      ? ({
                          "--sticker-face": "var(--color-lime)",
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  <span
                    aria-hidden
                    className={emojiSizeClass(cardFace(choice.emoji), "text-7xl sm:text-8xl", "text-4xl sm:text-5xl")}
                  >
                    {cardFace(choice.emoji)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <footer className="flex items-center justify-center pb-2">
          <div
            className="flex items-center gap-1.5"
            aria-label={`Round ${round + 1} of ${rounds.length}`}
          >
            {rounds.map((r, i) => (
              <span
                key={r.target.id}
                aria-hidden
                className={`h-3 w-3 rounded-full border-2 border-ink ${
                  i < round || (i === round && correctId !== null)
                    ? "bg-[var(--accent)]"
                    : "bg-white"
                }`}
              />
            ))}
          </div>
        </footer>
      </>
    );
  }

  const winner =
    stars.listener === stars.reader
      ? null
      : stars.listener > stars.reader
        ? "listener"
        : "reader";

  return (
    <main
      style={{ "--accent": accent } as React.CSSProperties}
      className="mx-auto flex min-h-dvh max-w-2xl flex-col p-4 sm:p-6"
    >
      <header className="flex items-center justify-between">
        <Link
          href={`/deck/${deck.id}`}
          aria-label={`Back to ${deck.nameEnglish}`}
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
        <span aria-hidden className="text-4xl">
          ⚔️
        </span>
      </header>

      {combo.racha !== null && phase.at === "play" && (
        <RachaBurst key={combo.racha} count={combo.racha} />
      )}

      {phase.at === "handoff" ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <span aria-hidden className="pop-in text-9xl">
            {avatars.reader}
          </span>
          <h1 className="text-4xl font-extrabold sm:text-5xl">
            ¡Ahora le toca a {avatars.reader}!
          </h1>
          <p className="text-lg font-semibold text-ink/60">
            Pass the tablet, then tap go
          </p>
          <button
            type="button"
            onClick={() => setPhase({ at: "play", kid: "reader" })}
            aria-label="Start the reader's turn"
            className="sticker flex h-24 w-40 items-center justify-center text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
            style={{ "--sticker-face": "var(--color-lime)" } as React.CSSProperties}
          >
            ¡Dale!
          </button>
        </section>
      ) : phase.at === "results" ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <Confetti />
          <h1 className="text-5xl font-extrabold">
            {winner === null ? "¡Empate!" : `¡Gana ${avatars[winner]}!`}
          </h1>
          <div className="flex gap-6">
            {(["listener", "reader"] as const).map((kid) => (
              <div
                key={kid}
                className={`sticker relative flex flex-col items-center gap-2 px-8 py-5 ${
                  winner === kid ? "pop-in" : ""
                }`}
                style={
                  winner === kid
                    ? ({
                        "--sticker-face": "var(--color-lime)",
                      } as React.CSSProperties)
                    : undefined
                }
              >
                <span aria-hidden className="sticker-peel" />
                <span aria-hidden className="text-6xl">
                  {avatars[kid]}
                </span>
                <span
                  aria-label={`${avatars[kid]} scored ${stars[kid]} stars`}
                  className="text-3xl font-extrabold"
                >
                  ⭐ {stars[kid]}
                </span>
              </div>
            ))}
          </div>
          <StarChest
            amount={Math.max(1, stars.listener) + Math.max(1, stars.reader)}
            onOpen={() => {
              addStars("listener", Math.max(1, stars.listener));
              addStars("reader", Math.max(1, stars.reader));
            }}
          />
          <div className="flex gap-6">
            <button
              type="button"
              onClick={restart}
              aria-label="Play again"
              className="sticker flex h-24 w-24 items-center justify-center text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              🔁
            </button>
            <Link
              href={`/deck/${deck.id}`}
              aria-label={`More games in ${deck.nameEnglish}`}
              className="sticker flex h-24 w-24 items-center justify-center text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              {deck.emoji}
            </Link>
          </div>
        </section>
      ) : (
        playRound(phase.kid)
      )}
    </main>
  );
}

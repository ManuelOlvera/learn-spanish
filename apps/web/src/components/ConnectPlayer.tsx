"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createConnectGame,
  type ConnectGame,
  type Deck,
  type QuizMode,
  type VocabularyCard,
} from "@learn-spanish/core";
import { cardFace, emojiSizeClass } from "@/lib/emoji";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { useCombo } from "@/lib/use-combo";
import { DoneScreen } from "@/components/DoneScreen";
import { RachaBurst } from "@/components/RachaBurst";

interface Props {
  deck: Deck;
  mode: QuizMode;
  accent: string;
}

type Side = "left" | "right";

const BOARD_DONE_MS = 1200;

/** Connect the columns: Spanish words on the left; pictures (listen) or
 *  English words (read) on the right. Tap one of each to pair them. */
export function ConnectPlayer({ deck, mode, accent }: Props) {
  // Deals are random, so the game is built client-side only (hydration).
  const [game, setGame] = useState<ConnectGame | null>(null);
  const [boardIndex, setBoardIndex] = useState(0);
  const [matched, setMatched] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<{ side: Side; cardId: string } | null>(
    null,
  );
  const [wrongTap, setWrongTap] = useState<{
    side: Side;
    cardId: string;
    nonce: number;
  } | null>(null);
  const advanceTimer = useRef<number | null>(null);
  const lastWrong = useRef(false);
  const firstTries = useRef(0);
  const mistakes = useRef(0);
  const combo = useCombo();

  useEffect(() => {
    warmUpVoices();
    setGame(createConnectGame(deck, mode));
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
    };
  }, [deck, mode]);

  const boards = game?.boards ?? [];
  const done = game !== null && boardIndex >= boards.length;
  const board = boards[boardIndex];
  const boardComplete =
    board !== undefined && matched.size === board.left.length;

  function restart() {
    setGame(createConnectGame(deck, mode));
    setBoardIndex(0);
    setMatched(new Set());
    setSelected(null);
    setWrongTap(null);
    lastWrong.current = false;
    firstTries.current = 0;
    mistakes.current = 0;
    combo.reset();
  }

  function tap(side: Side, card: VocabularyCard) {
    if (!board || boardComplete || matched.has(card.id)) {
      return;
    }
    // The left column is the Spanish word — hearing it is the listen game.
    if (side === "left" && mode === "listen") {
      speakSpanish(card.spanish);
    }
    if (selected === null || selected.side === side) {
      setSelected({ side, cardId: card.id });
      return;
    }
    if (selected.cardId === card.id) {
      const nowMatched = new Set([...matched, card.id]);
      setMatched(nowMatched);
      setSelected(null);
      combo.correct();
      if (!lastWrong.current) {
        firstTries.current += 1;
      }
      lastWrong.current = false;
      speakSpanish(card.spanish);
      if (nowMatched.size === board.left.length) {
        advanceTimer.current = window.setTimeout(() => {
          setBoardIndex((i) => i + 1);
          setMatched(new Set());
        }, BOARD_DONE_MS);
      }
    } else {
      combo.wrong();
      lastWrong.current = true;
      mistakes.current += 1;
      setWrongTap((prev) => ({
        side,
        cardId: card.id,
        nonce: (prev?.nonce ?? 0) + 1,
      }));
      setSelected(null);
    }
  }

  function tile(side: Side, card: VocabularyCard) {
    const isMatched = matched.has(card.id);
    const isSelected =
      selected?.side === side && selected.cardId === card.id;
    const isWrong = wrongTap?.side === side && wrongTap.cardId === card.id;
    const face = isMatched
      ? "var(--color-lime)"
      : isSelected
        ? "color-mix(in srgb, var(--accent) 35%, white)"
        : undefined;
    const label =
      side === "left"
        ? `Word ${card.spanish} (${card.english})`
        : mode === "listen"
          ? `Picture ${card.english}`
          : `Word ${card.english}`;
    return (
      <button
        type="button"
        key={`${card.id}-${side}-${isWrong ? wrongTap.nonce : 0}`}
        onClick={() => tap(side, card)}
        disabled={isMatched}
        aria-label={label}
        aria-pressed={isSelected}
        className={`sticker flex min-h-20 items-center justify-center p-3 ${
          isMatched
            ? "pop-in"
            : "active:translate-x-1 active:translate-y-1 active:shadow-none"
        } ${isWrong ? "wobble" : ""}`}
        style={
          face ? ({ "--sticker-face": face } as React.CSSProperties) : undefined
        }
      >
        {side === "right" && mode === "listen" ? (
          <span
            aria-hidden
            className={emojiSizeClass(cardFace(card.emoji), "text-5xl sm:text-6xl", "text-3xl sm:text-4xl")}
          >
            {cardFace(card.emoji)}
          </span>
        ) : (
          <span className="text-xl font-extrabold sm:text-2xl">
            {side === "left" ? card.spanish : card.english}
          </span>
        )}
      </button>
    );
  }

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
          {deck.emoji}
        </span>
      </header>

      {combo.racha !== null && !done && (
        <RachaBurst key={combo.racha} count={combo.racha} />
      )}
      {done ? (
        <DoneScreen
          stickerDeckId={deck.id}
          activity={mode === "listen" ? "connect-listen" : "connect-read"}
          onReplay={restart}
          firstTryCount={firstTries.current}
          mistakeCount={mistakes.current}
          back={{
            href: `/deck/${deck.id}`,
            emoji: deck.emoji,
            label: `More games in ${deck.nameEnglish}`,
          }}
        />
      ) : !board ? (
        <section className="flex-1" aria-hidden />
      ) : (
        <>
          <section className="flex flex-1 items-center justify-center">
            <div
              key={boardIndex}
              className="pop-in grid w-full max-w-md grid-cols-2 gap-x-8 gap-y-4"
            >
              <div className="flex flex-col gap-4">
                {board.left.map((card) => tile("left", card))}
              </div>
              <div className="flex flex-col gap-4">
                {board.right.map((card) => tile("right", card))}
              </div>
            </div>
          </section>

          <footer className="flex items-center justify-center pb-2">
            <div
              className="flex items-center gap-1.5"
              aria-label={`Board ${boardIndex + 1} of ${boards.length}`}
            >
              {boards.map((b, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={`h-3 w-3 rounded-full border-2 border-ink ${
                    i < boardIndex || (i === boardIndex && boardComplete)
                      ? "bg-[var(--accent)]"
                      : "bg-white"
                  }`}
                />
              ))}
            </div>
          </footer>
        </>
      )}
    </main>
  );
}

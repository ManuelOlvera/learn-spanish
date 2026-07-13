"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Deck } from "@learn-spanish/core";
import { log } from "@learn-spanish/config";
import { cardFace, emojiSizeClass } from "@/lib/emoji";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import {
  canRecord,
  playClip,
  startRecording,
  type ActiveRecording,
} from "@/lib/recorder";
import { DoneScreen } from "@/components/DoneScreen";

interface Props {
  deck: Deck;
  accent: string;
  /** Skip the sticker award — for assembled runs (el abecedario) that have
   *  no album deck of their own. */
  noAward?: boolean;
  /** Where the done screen's back button leads; defaults to the deck page. */
  backHref?: string;
}

/** Say-it-back states; "hidden" when recording is unsupported or denied. */
type MicState = "hidden" | "idle" | "recording" | "playing";

const MAX_RECORDING_MS = 5000;

export function FlashcardPlayer({ deck, accent, noAward, backHref }: Props) {
  const [index, setIndex] = useState(0);
  const [wobbleKey, setWobbleKey] = useState(0);
  const [mic, setMic] = useState<MicState>("hidden");
  const recording = useRef<ActiveRecording | null>(null);
  const autoStop = useRef<number | null>(null);
  const done = index >= deck.cards.length;
  const card = deck.cards[index];
  // The letter-case preference lives in localStorage, so the cased face can
  // only be drawn after mount — SSR and the first client render must agree
  // (hydration), so they show the stored face and the case applies right after.
  const [caseReady, setCaseReady] = useState(false);
  const face = card === undefined || !caseReady ? card?.emoji ?? "" : cardFace(card.emoji);

  useEffect(() => {
    warmUpVoices();
    setCaseReady(true);
    setMic(canRecord() ? "idle" : "hidden");
    return () => {
      // Leaving discards any in-flight clip and releases the mic (ADR 003).
      void recording.current?.stop();
    };
  }, []);

  function hear(text: string) {
    speakSpanish(text);
    setWobbleKey((k) => k + 1);
  }

  function discardRecording() {
    if (autoStop.current !== null) {
      window.clearTimeout(autoStop.current);
      autoStop.current = null;
    }
    void recording.current?.stop();
    recording.current = null;
  }

  async function finishRecording() {
    if (autoStop.current !== null) {
      window.clearTimeout(autoStop.current);
      autoStop.current = null;
    }
    const active = recording.current;
    recording.current = null;
    if (active === null) {
      return;
    }
    const clip = await active.stop();
    if (clip === null) {
      setMic("idle");
      return;
    }
    setMic("playing");
    // The clip is played once and dropped — never stored (ADR 003).
    await playClip(clip);
    setMic("idle");
  }

  async function toggleMic() {
    if (mic === "recording") {
      await finishRecording();
      return;
    }
    if (mic !== "idle") {
      return;
    }
    try {
      recording.current = await startRecording();
      setMic("recording");
      autoStop.current = window.setTimeout(() => {
        void finishRecording();
      }, MAX_RECORDING_MS);
    } catch (err) {
      // No mic, or the parent said no — flashcards keep working without it.
      log.warn("recorder", "recording unavailable", { err });
      setMic("hidden");
    }
  }

  // Deliberately silent on advance/restart: the kid gets to try naming the
  // picture first — audio only plays when the card itself is tapped.
  function next() {
    discardRecording();
    if (mic === "recording") {
      setMic("idle");
    }
    setIndex((i) => i + 1);
    setWobbleKey(0);
  }

  function restart() {
    discardRecording();
    if (mic === "recording") {
      setMic("idle");
    }
    setIndex(0);
    setWobbleKey(0);
  }

  return (
    <main
      style={{ "--accent": accent } as React.CSSProperties}
      className="mx-auto flex min-h-dvh max-w-2xl flex-col p-4 sm:p-6"
    >
      <header className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="Back to all decks"
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
        <span aria-hidden className="text-4xl">
          {deck.emoji}
        </span>
      </header>

      {done || !card ? (
        <DoneScreen
          stickerDeckId={deck.id}
          activity="learn"
          onReplay={restart}
          noAward={noAward}
          firstTryCount={2}
          back={{
            href: backHref ?? `/deck/${deck.id}`,
            emoji: deck.emoji,
            label: `More games in ${deck.nameEnglish}`,
          }}
        />
      ) : (
        <>
          <section className="flex flex-1 flex-col items-center justify-center gap-8">
            <button
              type="button"
              key={`${card.id}-${wobbleKey}`}
              onClick={() => hear(card.spanish)}
              aria-label={`Hear ${card.spanish} (${card.english})`}
              className={`sticker relative flex aspect-square w-full max-w-md flex-col items-center justify-center gap-4 p-8 ${
                wobbleKey > 0 ? "wobble" : "pop-in"
              }`}
            >
              <span aria-hidden className="sticker-peel" />
              <span
                aria-hidden
                className={`leading-none ${emojiSizeClass(face, "text-[7rem] sm:text-[9rem]", "text-[4rem] sm:text-[5rem]")}`}
              >
                {face}
              </span>
              <span className="text-4xl font-extrabold sm:text-5xl">
                {card.spanish}
              </span>
              <span aria-hidden className="absolute bottom-5 right-6 text-3xl">
                🔊
              </span>
            </button>
          </section>

          <footer className="flex items-center justify-between gap-4 pb-2">
            <div
              className="flex max-w-[40%] flex-wrap items-center gap-1.5"
              aria-label={`Card ${index + 1} of ${deck.cards.length}`}
            >
              {deck.cards.map((c, i) => (
                <span
                  key={c.id}
                  aria-hidden
                  className={`h-3 w-3 rounded-full border-2 border-ink ${
                    i <= index ? "bg-[var(--accent)]" : "bg-white"
                  }`}
                />
              ))}
            </div>
            {mic !== "hidden" && (
              <button
                type="button"
                onClick={() => void toggleMic()}
                disabled={mic === "playing"}
                aria-label={
                  mic === "recording"
                    ? "Stop recording"
                    : mic === "playing"
                      ? "Playing your voice"
                      : "Record your voice"
                }
                className={`sticker flex h-20 w-20 items-center justify-center text-4xl ${
                  mic === "playing"
                    ? "opacity-60"
                    : "active:translate-x-1 active:translate-y-1 active:shadow-none"
                } ${mic === "recording" ? "wobble" : ""}`}
                style={
                  mic === "recording"
                    ? ({ "--sticker-face": "#fecaca" } as React.CSSProperties)
                    : undefined
                }
              >
                {mic === "recording" ? "⏺" : mic === "playing" ? "▶️" : "🎤"}
              </button>
            )}
            <button
              type="button"
              onClick={next}
              aria-label="Next card"
              className="sticker flex h-20 w-28 items-center justify-center text-5xl font-extrabold active:translate-x-1 active:translate-y-1 active:shadow-none"
              style={
                {
                  "--sticker-face": "var(--color-lime)",
                  "--accent": "var(--color-ink)",
                } as React.CSSProperties
              }
            >
              →
            </button>
          </footer>
        </>
      )}
    </main>
  );
}

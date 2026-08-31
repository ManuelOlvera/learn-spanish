"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  createConversation,
  KID_GAME_MODES,
  type ConversationChoice,
  type Deck,
} from "@learn-spanish/core";
import { speakSpanish, warmUpVoices } from "@/lib/speech";
import { getActivePet, getPetCollection } from "@/lib/economy";
import { petFormEmoji, petMaxForm } from "@learn-spanish/core";
import { useSelectedKid } from "@/lib/use-selected-kid";
import { feedbackPop } from "@/lib/feedback";
import { DoneScreen } from "@/components/DoneScreen";

interface Props {
  deck: Deck;
  accent: string;
}

/** How long the kid's own line sits on screen before the pet answers it. */
const REPLY_DELAY_MS = 1400;

/**
 * Habla con tu mascota — the pet says something, the kid picks what to say
 * back, hears their own sentence spoken, and the pet answers *that*.
 *
 * Nothing here is right or wrong: there is no score, no ✅/❌, and no wrong
 * tap to dock a star. The chest pays for turns taken, not for accuracy — this
 * is the one game in the app a kid cannot lose.
 */
export function ConversationPlayer({ deck, accent }: Props) {
  const selected = useSelectedKid();
  const kid = selected.status === "picked" ? selected.kid : null;
  const [pet, setPet] = useState<{ emoji: string; name: string } | null>(null);
  const [index, setIndex] = useState(0);
  const [said, setSaid] = useState<ConversationChoice | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(0);
  /** The pending "pet answers back" timer, so leaving mid-turn cancels it. */
  const replyTimer = useRef<number | null>(null);

  function clearReplyTimer() {
    if (replyTimer.current !== null) {
      window.clearTimeout(replyTimer.current);
      replyTimer.current = null;
    }
  }

  // The reply is spoken 1.4s after the tap, so a kid who taps the back button
  // in between would otherwise hear the pet answer over the next screen — the
  // one place in the app audio can outlive its picture. Its own effect, so it
  // cannot be disturbed by anything the kid lookup below does.
  useEffect(() => clearReplyTimer, []);

  useEffect(() => {
    // The pet speaks first, from this effect rather than a tap, so the voice
    // list has to be warm before that line — two speakers need two voices.
    warmUpVoices();
    if (selected.status === "loading") {
      return;
    }
    const which = kid ?? "listener";
    const collection = getPetCollection(which);
    const active = getActivePet(which);
    setPet({
      emoji: petFormEmoji(
        collection.active,
        Math.min(active.form ?? Infinity, petMaxForm(collection.active, active.meals)),
      ),
      // An unnamed pet still has something to introduce itself as.
      name: active.name && active.name !== "" ? active.name : "tu amigo",
    });
  }, [selected, kid]);

  // One conversation per run; `round` re-rolls it on replay.
  const talk = useMemo(
    () => (pet === null ? null : createConversation(deck, pet.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck, pet, round],
  );
  const turn = talk?.turns[index] ?? null;

  // The pet speaks its line whenever a new turn arrives.
  useEffect(() => {
    if (turn !== null && said === null) {
      speakSpanish(turn.prompt, "pet");
    }
  }, [turn, said]);

  const choose = useCallback(
    (choice: ConversationChoice) => {
      feedbackPop();
      setSaid(choice);
      // The kid hears the sentence they just chose — that is the practice.
      speakSpanish(choice.spanish, "kid");
      clearReplyTimer();
      replyTimer.current = window.setTimeout(() => {
        replyTimer.current = null;
        setShowReply(true);
        speakSpanish(choice.reply, "pet");
      }, REPLY_DELAY_MS);
    },
    [],
  );

  function next() {
    clearReplyTimer();
    setSaid(null);
    setShowReply(false);
    if (talk !== null && index + 1 >= talk.turns.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function replay() {
    clearReplyTimer();
    setDone(false);
    setIndex(0);
    setSaid(null);
    setShowReply(false);
    setRound((r) => r + 1);
  }

  if (selected.status === "loading" || pet === null || talk === null || turn === null) {
    return <main className="min-h-dvh" aria-hidden />;
  }

  if (done) {
    return (
      <DoneScreen
        stickerDeckId={deck.id}
        activity="hablar"
        onReplay={replay}
        noAward
        // Every turn taken pays; there is nothing to get wrong here.
        firstTryCount={talk.turns.length}
        totalRounds={talk.turns.length}
        back={{
          href: `/deck/${deck.id}`,
          emoji: deck.emoji,
          label: `More games in ${deck.nameEnglish}`,
        }}
      />
    );
  }

  // The reader reads what they are saying; the pre-reader goes by picture.
  const reads = kid !== null && KID_GAME_MODES[kid].quiz === "read";

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
          {deck.emoji}
        </Link>
        <span
          aria-label={`Turn ${index + 1} of ${talk.turns.length}`}
          className="text-lg font-extrabold text-ink/40"
        >
          {index + 1}/{talk.turns.length}
        </span>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
        {/* The pet, and what it is saying right now. */}
        <button
          type="button"
          onClick={() =>
            speakSpanish(showReply && said ? said.reply : turn.prompt, "pet")
          }
          aria-label="Hear it again"
          className="sticker pop-in flex w-full flex-col items-center gap-3 p-5 active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <span aria-hidden className="text-7xl sm:text-8xl">
            {pet.emoji}
          </span>
          <span className="text-center text-2xl font-extrabold sm:text-3xl">
            {showReply && said ? said.reply : turn.prompt}
          </span>
        </button>

        {said === null ? (
          <div className="flex w-full flex-col gap-4">
            {turn.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => choose(choice)}
                aria-label={choice.english}
                className="sticker flex items-center gap-4 p-4 text-left active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                <span aria-hidden className="text-5xl sm:text-6xl">
                  {choice.emoji}
                </span>
                {reads && (
                  <span className="text-xl font-extrabold sm:text-2xl">
                    {choice.spanish}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-5">
            {/* What the kid just said, kept on screen while the pet answers. */}
            <p className="pop-in rounded-3xl border-4 border-ink bg-white px-5 py-3 text-center text-xl font-extrabold sm:text-2xl">
              <span aria-hidden className="mr-2">
                {said.emoji}
              </span>
              {said.spanish}
            </p>
            {showReply && (
              <button
                type="button"
                onClick={next}
                aria-label="Next"
                className="sticker pop-in flex h-24 w-24 items-center justify-center text-5xl active:translate-x-1 active:translate-y-1 active:shadow-none"
                style={
                  { "--accent": "var(--color-lime-deep)" } as React.CSSProperties
                }
              >
                <span aria-hidden>👉</span>
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

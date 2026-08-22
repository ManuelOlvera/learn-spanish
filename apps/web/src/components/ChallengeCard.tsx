"use client";

import Link from "next/link";
import { CHALLENGE_BONUS, type Deck, type ParentChallenge } from "@learn-spanish/core";
import { deckAccent } from "@/lib/deck-theme";
import { speakSpanish } from "@/lib/speech";

interface Props {
  challenge: ParentChallenge;
  deck: Deck;
  /** Bank the bonus; called only when the challenge is done and unclaimed. */
  onClaim: () => void;
}

/**
 * El reto de papá on the kid's home screen: the deck a parent picked out of
 * `/informe`, badged 👨 — *not* 🎯, which La misión already owns and sits
 * directly below this card. Two identical icons on a screen navigated by
 * picture alone is the whole failure mode; 👨 also says the thing that matters
 * about this card, which is that a person set it rather than the app.
 *
 * A pre-reader can't read "papá te reta", so the card speaks it — tapping it
 * says the line aloud in Spanish and goes to the deck. Once the deck has been
 * played it turns into the chest, which is the only tap that pays.
 */
export function ChallengeCard({ challenge, deck, onClaim }: Props) {
  const line = `¡Papá te reta! Vamos a ${deck.nameSpanish}.`;

  if (challenge.done && !challenge.claimed) {
    return (
      <button
        type="button"
        onClick={() => {
          speakSpanish("¡Lo lograste!");
          onClaim();
        }}
        aria-label={`Claim the challenge reward for ${deck.nameEnglish}`}
        className="sticker pop-in relative flex w-full items-center gap-3 px-6 py-3 active:translate-x-1 active:translate-y-1 active:shadow-none"
        style={{ "--accent": "var(--color-lime-deep)" } as React.CSSProperties}
      >
        <span aria-hidden className="text-3xl">
          👨
        </span>
        <span className="flex-1 text-left text-xl font-extrabold">
          ¡Lo lograste!
        </span>
        <span
          aria-hidden
          className="rounded-full border-2 border-ink bg-[var(--color-lime)] px-3 text-lg font-extrabold"
        >
          +{CHALLENGE_BONUS}⭐
        </span>
      </button>
    );
  }

  return (
    <Link
      href={`/deck/${deck.id}`}
      onClick={() => speakSpanish(line)}
      aria-label={`Papá's challenge: ${deck.nameEnglish}`}
      style={{ "--accent": deckAccent(deck.id) } as React.CSSProperties}
      className="sticker pop-in relative flex w-full items-center gap-3 px-6 py-3 active:translate-x-1 active:translate-y-1 active:shadow-none"
    >
      <span aria-hidden className="text-3xl">
        👨
      </span>
      <span className="flex flex-1 flex-col text-left">
        <span className="text-xs font-extrabold uppercase tracking-widest text-ink/40">
          El reto de papá
        </span>
        <span className="text-xl font-extrabold">{deck.nameSpanish}</span>
      </span>
      <span aria-hidden className="text-3xl">
        {deck.emoji}
      </span>
    </Link>
  );
}

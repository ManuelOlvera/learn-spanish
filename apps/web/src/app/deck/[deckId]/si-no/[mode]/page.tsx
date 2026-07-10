import { notFound } from "next/navigation";
import { DeckNotFoundError, type QuizMode } from "@learn-spanish/core";
import { getDeck, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { SiNoPlayer } from "@/components/SiNoPlayer";

const modes: readonly QuizMode[] = ["listen", "read"];

export async function generateStaticParams() {
  const decks = await listDecks.execute();
  return decks.flatMap((deck) =>
    modes.map((mode) => ({ deckId: deck.id, mode })),
  );
}

function isQuizMode(value: string): value is QuizMode {
  return (modes as readonly string[]).includes(value);
}

export default async function SiNoPage({
  params,
}: {
  params: Promise<{ deckId: string; mode: string }>;
}) {
  const { deckId, mode } = await params;
  if (!isQuizMode(mode)) {
    notFound();
  }

  let deck;
  try {
    deck = await getDeck.execute(deckId);
  } catch (err) {
    if (err instanceof DeckNotFoundError) {
      notFound();
    }
    throw err;
  }

  return <SiNoPlayer deck={deck} mode={mode} accent={deckAccent(deck.id)} />;
}

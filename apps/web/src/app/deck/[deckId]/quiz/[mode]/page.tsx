import { notFound } from "next/navigation";
import { DeckNotFoundError, QUIZ_CHOICE_COUNT, type QuizMode } from "@learn-spanish/core";
import { getDeck, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { QuizPlayer } from "@/components/QuizPlayer";

const modes = Object.keys(QUIZ_CHOICE_COUNT) as readonly QuizMode[];

export async function generateStaticParams() {
  const decks = await listDecks.execute();
  return decks.flatMap((deck) =>
    modes.map((mode) => ({ deckId: deck.id, mode })),
  );
}

function isQuizMode(value: string): value is QuizMode {
  return (modes as readonly string[]).includes(value);
}

export default async function QuizPage({
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

  return <QuizPlayer deck={deck} mode={mode} accent={deckAccent(deck.id)} />;
}

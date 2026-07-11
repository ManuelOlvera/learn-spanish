import { notFound } from "next/navigation";
import { DeckNotFoundError } from "@learn-spanish/core";
import { getDeck, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { DuelPlayer } from "@/components/DuelPlayer";

export async function generateStaticParams() {
  const decks = await listDecks.execute();
  return decks.map((deck) => ({ deckId: deck.id }));
}

export default async function DuelPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;

  let deck;
  try {
    deck = await getDeck.execute(deckId);
  } catch (err) {
    if (err instanceof DeckNotFoundError) {
      notFound();
    }
    throw err;
  }

  return <DuelPlayer deck={deck} accent={deckAccent(deck.id)} />;
}

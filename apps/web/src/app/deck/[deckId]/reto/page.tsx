import { notFound } from "next/navigation";
import { DeckNotFoundError } from "@learn-spanish/core";
import { getDeck, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { RetoPlayer } from "@/components/RetoPlayer";

export async function generateStaticParams() {
  const decks = await listDecks.execute();
  return decks.map((deck) => ({ deckId: deck.id }));
}

export default async function RetoPage({
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

  return <RetoPlayer deck={deck} accent={deckAccent(deck.id)} />;
}

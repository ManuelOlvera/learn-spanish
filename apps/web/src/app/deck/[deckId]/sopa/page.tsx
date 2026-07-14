import { notFound } from "next/navigation";
import { DeckNotFoundError, sopaDifficulties } from "@learn-spanish/core";
import { getDeck, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { SopaPlayer } from "@/components/SopaPlayer";

export async function generateStaticParams() {
  const decks = await listDecks.execute();
  return decks.map((deck) => ({ deckId: deck.id }));
}

export default async function SopaPage({
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
  // Decks whose words can't fill any grid have no sopa (the menu hides it too).
  if (sopaDifficulties(deck).length === 0) {
    notFound();
  }

  return <SopaPlayer deck={deck} accent={deckAccent(deck.id)} />;
}

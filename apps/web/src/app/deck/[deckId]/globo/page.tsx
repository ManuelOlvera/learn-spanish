import { notFound } from "next/navigation";
import { DeckNotFoundError, globoDifficulties } from "@learn-spanish/core";
import { getDeck, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { GloboPlayer } from "@/components/GloboPlayer";

export async function generateStaticParams() {
  const decks = await listDecks.execute();
  return decks.map((deck) => ({ deckId: deck.id }));
}

export default async function GloboPage({
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
  // Decks with too few words in any length band have no globo (the menu
  // hides it too).
  if (globoDifficulties(deck).length === 0) {
    notFound();
  }

  return <GloboPlayer deck={deck} accent={deckAccent(deck.id)} />;
}

import { notFound } from "next/navigation";
import { DeckNotFoundError } from "@learn-spanish/core";
import { getDeck, listDeckGroups, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { GameMenu } from "@/components/GameMenu";

export async function generateStaticParams() {
  const decks = await listDecks.execute();
  return decks.map((deck) => ({ deckId: deck.id }));
}

export default async function DeckPage({
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

  const [allDecks, allGroups] = await Promise.all([
    listDecks.execute(),
    listDeckGroups.execute(),
  ]);

  return (
    <GameMenu
      deck={deck}
      accent={deckAccent(deck.id)}
      allGroups={allGroups}
      allDecks={allDecks}
    />
  );
}

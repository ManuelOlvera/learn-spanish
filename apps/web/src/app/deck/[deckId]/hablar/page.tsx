import { notFound } from "next/navigation";
import { DeckNotFoundError, hasConversation } from "@learn-spanish/core";
import { getDeck, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { ConversationPlayer } from "@/components/ConversationPlayer";

export async function generateStaticParams() {
  const decks = await listDecks.execute();
  return decks.map((deck) => ({ deckId: deck.id }));
}

export default async function HablarPage({
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
  // The frames only read on things a person can like — the menu hides the
  // tile on every other deck, and a deep link lands here.
  if (!hasConversation(deck.id)) {
    notFound();
  }

  return <ConversationPlayer deck={deck} accent={deckAccent(deck.id)} />;
}

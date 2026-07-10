import { notFound } from "next/navigation";
import {
  DeckNotFoundError,
  MEMORY_PAIR_COUNT,
  type MemoryMode,
} from "@learn-spanish/core";
import { getDeck, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { MemoryPlayer } from "@/components/MemoryPlayer";

const modes = Object.keys(MEMORY_PAIR_COUNT) as readonly MemoryMode[];

export async function generateStaticParams() {
  const decks = await listDecks.execute();
  return decks.flatMap((deck) =>
    modes.map((mode) => ({ deckId: deck.id, mode })),
  );
}

function isMemoryMode(value: string): value is MemoryMode {
  return (modes as readonly string[]).includes(value);
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ deckId: string; mode: string }>;
}) {
  const { deckId, mode } = await params;
  if (!isMemoryMode(mode)) {
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

  return <MemoryPlayer deck={deck} mode={mode} accent={deckAccent(deck.id)} />;
}

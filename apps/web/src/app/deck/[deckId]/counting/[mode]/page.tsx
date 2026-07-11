import { notFound } from "next/navigation";
import type { QuizMode } from "@learn-spanish/core";
import { getDeck, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { CountingPlayer } from "@/components/CountingPlayer";

const modes: readonly QuizMode[] = ["listen", "read"];
/** Counting shows n copies of a picture — only 1-10 is showable. */
const COUNTING_DECK = "numbers";

export function generateStaticParams() {
  return modes.map((mode) => ({ deckId: COUNTING_DECK, mode }));
}

function isQuizMode(value: string): value is QuizMode {
  return (modes as readonly string[]).includes(value);
}

export default async function CountingPage({
  params,
}: {
  params: Promise<{ deckId: string; mode: string }>;
}) {
  const { deckId, mode } = await params;
  if (deckId !== COUNTING_DECK || !isQuizMode(mode)) {
    notFound();
  }

  const [numbersDeck, allDecks] = await Promise.all([
    getDeck.execute(COUNTING_DECK),
    listDecks.execute(),
  ]);
  const itemPool = allDecks
    .filter((d) => !d.id.startsWith("numbers") && !d.secret)
    .flatMap((d) => d.cards);

  return (
    <CountingPlayer
      itemPool={itemPool}
      numberCards={numbersDeck.cards}
      mode={mode}
      accent={deckAccent(COUNTING_DECK)}
    />
  );
}

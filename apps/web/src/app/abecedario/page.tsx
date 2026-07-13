import { buildAlphabetDeck } from "@learn-spanish/core";
import { listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { FlashcardPlayer } from "@/components/FlashcardPlayer";

/**
 * El abecedario completo: all 27 letters in order, one flashcard run —
 * the recital, like singing the ABC. Assembled from the letter decks
 * (no album deck of its own, so the run pays no sticker: the three real
 * decks are where progress lives).
 */
export default async function AbecedarioPage() {
  const decks = await listDecks.execute();
  const abecedario = buildAlphabetDeck(decks);
  return (
    <FlashcardPlayer
      deck={abecedario}
      accent={deckAccent("letras")}
      noAward
      backHref="/group/letras"
    />
  );
}

import { notFound } from "next/navigation";
import { adivinaDifficulties } from "@learn-spanish/core";
import { listDeckGroups, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { AdivinaPlayer } from "@/components/AdivinaPlayer";

export async function generateStaticParams() {
  const groups = await listDeckGroups.execute();
  return groups.map((group) => ({ groupId: group.id }));
}

/** Adivina la palabra is per-shelf, not per-deck: one deck rarely has six
 *  same-length words, and the guess list is the game. */
export default async function AdivinaPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const groups = await listDeckGroups.execute();
  const group = groups.find((g) => g.id === groupId);
  if (group === undefined) {
    notFound();
  }

  const allDecks = await listDecks.execute();
  const cards = group.deckIds.flatMap(
    (id) => allDecks.find((d) => d.id === id)?.cards ?? [],
  );
  // The answer comes from this shelf; a typed guess may be any pack word of
  // the right length, so the kid isn't refused words they've been taught.
  const packCards = allDecks.flatMap((deck) => deck.cards);
  // Las letras has no length with enough words — the shelf hides the tile too.
  if (adivinaDifficulties(cards).length === 0) {
    notFound();
  }

  return (
    <AdivinaPlayer
      groupId={group.id}
      groupNameSpanish={group.nameSpanish}
      groupNameEnglish={group.nameEnglish}
      groupEmoji={group.emoji}
      cards={cards}
      packCards={packCards}
      accent={deckAccent(group.id)}
    />
  );
}

import { notFound } from "next/navigation";
import { listDeckGroups, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { ExamPlayer } from "@/components/ExamPlayer";

export async function generateStaticParams() {
  const groups = await listDeckGroups.execute();
  return groups.map((group) => ({ groupId: group.id }));
}

/**
 * El examen for one shelf — the checkpoint that opens the next one (ADR 021).
 *
 * The guard that a kid may only sit an exam they have actually reached is in
 * the client (`ExamGate`): whether a shelf is complete is derived from the
 * album, which lives in the browser, so a server component cannot know it.
 * This page only resolves the shelf and hands the pack down.
 */
export default async function ExamenPage({
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
  const deckEmoji = Object.fromEntries(allDecks.map((d) => [d.id, d.emoji]));
  const deckName = Object.fromEntries(allDecks.map((d) => [d.id, d.nameSpanish]));

  return (
    <ExamPlayer
      group={group}
      allGroups={groups}
      allDecks={allDecks}
      accent={deckAccent(group.id)}
      deckEmoji={deckEmoji}
      deckName={deckName}
    />
  );
}

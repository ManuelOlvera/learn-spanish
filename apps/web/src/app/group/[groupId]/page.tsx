import Link from "next/link";
import { notFound } from "next/navigation";
import { listDeckGroups, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";

export async function generateStaticParams() {
  const groups = await listDeckGroups.execute();
  return groups.map((group) => ({ groupId: group.id }));
}

/** One shelf: the group's decks, sized to fit a single screen. */
export default async function GroupPage({
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
  const decks = group.deckIds.flatMap((id) => {
    const deck = allDecks.find((d) => d.id === id);
    return deck ? [deck] : [];
  });

  return (
    <main
      style={{ "--accent": deckAccent(group.id) } as React.CSSProperties}
      className="mx-auto flex min-h-dvh max-w-2xl flex-col p-4 sm:p-6"
    >
      <header className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="Back to all groups"
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
        <span aria-hidden className="text-4xl">
          {group.emoji}
        </span>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
        <div className="pop-in text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl">
            {group.nameSpanish}
          </h1>
          <p className="text-lg font-semibold text-ink/50">
            {group.nameEnglish}
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-5 sm:gap-6">
          {decks.map((deck, i) => (
            <Link
              key={deck.id}
              href={`/deck/${deck.id}`}
              style={{ "--accent": deckAccent(deck.id) } as React.CSSProperties}
              className="sticker pop-in relative flex min-h-44 flex-col items-center justify-center gap-2 p-4 transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none motion-safe:hover:-rotate-1"
            >
              <span aria-hidden className="sticker-peel" />
              <span
                aria-hidden
                className="text-6xl sm:text-7xl"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {deck.emoji}
              </span>
              <span className="text-center text-xl font-bold sm:text-2xl">
                {deck.nameSpanish}
              </span>
              <span className="text-sm font-semibold text-ink/50">
                {deck.nameEnglish}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

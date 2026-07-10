import Link from "next/link";
import { notFound } from "next/navigation";
import { DeckNotFoundError } from "@learn-spanish/core";
import { getDeck, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";

export async function generateStaticParams() {
  const decks = await listDecks.execute();
  return decks.map((deck) => ({ deckId: deck.id }));
}

const activities = [
  {
    href: "learn",
    emoji: "📖",
    spanish: "Las tarjetas",
    english: "Flashcards",
  },
  {
    href: "quiz/listen",
    emoji: "👂",
    spanish: "Escucha",
    english: "Hear it, tap it",
  },
  {
    href: "quiz/read",
    emoji: "🔤",
    spanish: "Lee",
    english: "Read it, tap it",
  },
] as const;

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

  return (
    <main
      style={{ "--accent": deckAccent(deck.id) } as React.CSSProperties}
      className="mx-auto flex min-h-dvh max-w-2xl flex-col p-4 sm:p-6"
    >
      <header className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="Back to all decks"
          className="sticker flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          🏠
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="pop-in text-center">
          <span aria-hidden className="block text-8xl">
            {deck.emoji}
          </span>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
            {deck.nameSpanish}
          </h1>
          <p className="text-lg font-semibold text-ink/50">{deck.nameEnglish}</p>
        </div>

        <div className="flex w-full max-w-md flex-col gap-6">
          {activities.map((activity, i) => (
            <Link
              key={activity.href}
              href={`/deck/${deck.id}/${activity.href}`}
              className="sticker pop-in relative flex min-h-28 items-center gap-6 px-8 py-4 active:translate-x-1 active:translate-y-1 active:shadow-none motion-safe:hover:-rotate-1"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span aria-hidden className="sticker-peel" />
              <span aria-hidden className="text-6xl">
                {activity.emoji}
              </span>
              <span className="flex flex-col text-left">
                <span className="text-3xl font-extrabold">
                  {activity.spanish}
                </span>
                <span className="text-sm font-semibold text-ink/50">
                  {activity.english}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

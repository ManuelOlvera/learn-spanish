import Link from "next/link";
import { notFound } from "next/navigation";
import { DeckNotFoundError } from "@learn-spanish/core";
import { getDeck, listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";

export async function generateStaticParams() {
  const decks = await listDecks.execute();
  return decks.map((deck) => ({ deckId: deck.id }));
}

/** One row per game; a kid picks their difficulty by glyph (👂 hear / 🔤 read). */
const games = [
  {
    emoji: "📖",
    spanish: "Las tarjetas",
    english: "Flashcards",
    modes: [{ glyph: "📖", href: "learn", label: "Flashcards" }],
  },
  {
    emoji: "🔍",
    spanish: "¿Dónde está?",
    english: "Find the picture",
    modes: [
      { glyph: "👂", href: "quiz/listen", label: "Find it by ear" },
      { glyph: "🔤", href: "quiz/read", label: "Find it by word" },
    ],
  },
  {
    emoji: "✅",
    spanish: "¿Sí o no?",
    english: "Yes or no",
    modes: [
      { glyph: "👂", href: "si-no/listen", label: "Yes or no by ear" },
      { glyph: "🔤", href: "si-no/read", label: "Yes or no by word" },
    ],
  },
  {
    emoji: "🧩",
    spanish: "Las parejas",
    english: "Matching pairs",
    modes: [
      { glyph: "🖼️", href: "match/pictures", label: "Pairs: pictures" },
      { glyph: "🔤", href: "match/words", label: "Pairs: words" },
    ],
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

      <section className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
        <div className="pop-in text-center">
          <span aria-hidden className="block text-7xl sm:text-8xl">
            {deck.emoji}
          </span>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
            {deck.nameSpanish}
          </h1>
          <p className="text-lg font-semibold text-ink/50">{deck.nameEnglish}</p>
        </div>

        <div className="flex w-full max-w-md flex-col gap-5">
          {games.map((game, i) => (
            <div
              key={game.spanish}
              className="pop-in flex items-center justify-between gap-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-3">
                <span aria-hidden className="text-5xl">
                  {game.emoji}
                </span>
                <span className="flex flex-col">
                  <span className="text-2xl font-extrabold sm:text-3xl">
                    {game.spanish}
                  </span>
                  <span className="text-sm font-semibold text-ink/50">
                    {game.english}
                  </span>
                </span>
              </div>
              <div className="flex gap-3">
                {game.modes.map((mode) => (
                  <Link
                    key={mode.href}
                    href={`/deck/${deck.id}/${mode.href}`}
                    aria-label={`${mode.label} — ${deck.nameEnglish}`}
                    className="sticker flex h-20 w-20 items-center justify-center text-4xl active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    {mode.glyph}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

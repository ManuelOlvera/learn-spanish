import Link from "next/link";
import { listDecks } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";

export default async function HomePage() {
  const decks = await listDecks.execute();

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-8 p-6">
      <header className="relative w-full text-center">
        <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl">
          ¡Palabras!
        </h1>
        <p className="mt-1 text-lg font-semibold text-ink/60">
          Tap a sticker to play
        </p>
        <Link
          href="/album"
          aria-label="Open the sticker album"
          className="sticker absolute right-0 top-0 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          📔
        </Link>
      </header>

      <div className="grid w-full grid-cols-2 gap-6 sm:gap-8">
        {decks.map((deck, i) => (
          <Link
            key={deck.id}
            href={`/deck/${deck.id}`}
            style={{ "--accent": deckAccent(deck.id) } as React.CSSProperties}
            className="sticker pop-in relative flex aspect-square flex-col items-center justify-center gap-2 p-4 transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none motion-safe:hover:-rotate-1"
          >
            <span aria-hidden className="sticker-peel" />
            <span
              aria-hidden
              className="text-7xl sm:text-8xl"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {deck.emoji}
            </span>
            <span className="text-2xl font-bold sm:text-3xl">
              {deck.nameSpanish}
            </span>
            <span className="text-sm font-semibold text-ink/50">
              {deck.nameEnglish}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}

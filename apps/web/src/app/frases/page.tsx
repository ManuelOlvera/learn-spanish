import Link from "next/link";
import { deckAccent } from "@/lib/deck-theme";

/** Difficulty chooser — only reached by deep link before a kid was ever
 *  picked; the home screen links straight to the right mode otherwise. */
export default function FrasesPage() {
  const modes = [
    { glyph: "👂", href: "/frases/listen", label: "Sentences by ear" },
    { glyph: "🔤", href: "/frases/read", label: "Sentence builder" },
  ];

  return (
    <main
      style={{ "--accent": deckAccent("frases") } as React.CSSProperties}
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
            💬
          </span>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">
            Las frases
          </h1>
          <p className="text-lg font-semibold text-ink/50">Sentences</p>
        </div>
        <div className="flex gap-6">
          {modes.map((mode) => (
            <Link
              key={mode.href}
              href={mode.href}
              aria-label={mode.label}
              className="sticker flex h-28 w-28 items-center justify-center text-6xl active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              {mode.glyph}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

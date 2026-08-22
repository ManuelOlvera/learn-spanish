import type { ActivityId } from "@learn-spanish/core";

/**
 * How each earnable activity is drawn (presentation-only, like deck-theme).
 * `game` identifies the game, `mode` the difficulty glyph — the same glyphs
 * the choice screen buttons use, so album slots read by picture alone.
 */
export const ACTIVITY_META: Record<
  ActivityId,
  { game: string; mode: string | null; english: string }
> = {
  learn: { game: "📖", mode: null, english: "Flashcards" },
  "quiz-listen": { game: "🔍", mode: "👂", english: "Find it by ear" },
  "quiz-read": { game: "🔍", mode: "🔤", english: "Find it by word" },
  "si-no-listen": { game: "✅", mode: "👂", english: "Yes or no by ear" },
  "si-no-read": { game: "✅", mode: "🔤", english: "Yes or no by word" },
  "match-pictures": { game: "🧩", mode: "🖼️", english: "Pairs: pictures" },
  "match-words": { game: "🧩", mode: "🔤", english: "Pairs: words" },
  "connect-listen": { game: "🔗", mode: "👂", english: "Connect by ear" },
  "connect-read": { game: "🔗", mode: "🔤", english: "Connect by word" },
  "scene-listen": { game: "👀", mode: "👂", english: "Seek by ear" },
  "scene-read": { game: "👀", mode: "🔤", english: "Seek by word" },
  "frases-listen": { game: "💬", mode: "👂", english: "Sentences by ear" },
  "frases-read": { game: "💬", mode: "🔤", english: "Sentence builder" },
  // 📚, not 📖 — the open book already means flashcards ("learn") in the album.
  "cuento-listen": { game: "📚", mode: "👂", english: "Story by ear" },
  "cuento-read": { game: "📚", mode: "🔤", english: "Story by word" },
  "counting-listen": { game: "🧮", mode: "👂", english: "Counting by ear" },
  "counting-read": { game: "🧮", mode: "🔤", english: "Counting by word" },
  spelling: { game: "✏️", mode: "🔤", english: "Spelling" },
  sopa: { game: "🥣", mode: "🔤", english: "Word search" },
  globo: { game: "🎈", mode: "🔤", english: "Balloon word guess" },
  hablar: { game: "🗣️", mode: "💬", english: "Talk with your pet" },
  adivina: { game: "🔡", mode: "🔤", english: "Guess the word" },
};

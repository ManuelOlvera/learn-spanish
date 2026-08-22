import type { VocabularyCard } from "./card";
import type { Deck } from "./deck";
import { ConversationDeckTooSmallError } from "./errors";
import { shuffled } from "./random";
import type { RandomSource } from "./random";

/**
 * Habla con tu mascota — the app's first game where the kid chooses what to
 * *say* rather than which answer is right.
 *
 * Every other game asks and grades. This one asks and *answers*: the mascota
 * says something, the kid picks one of two or three replies, hears their own
 * sentence spoken back, and the pet responds to that choice. There is no
 * correct answer anywhere in this file, and there must never be one — the
 * moment a `correct` flag appears here, this is just the quiz with a pet on it.
 *
 * This is ADR 010's no-microphone fallback, not roadmap 25: no speech
 * recognition, no model, no route handler, no API key, and it works offline.
 * It is a template engine, and honest about it — what keeps it from feeling
 * like one is the pet's own taste (below), three phrasings per frame, and
 * never talking about the same word twice in a session.
 */

/** Greeting, three things to talk about, goodbye. */
export const CONVERSATION_TURNS = 5;

/** Worst case the middle turns need: three ¿qué prefieres? rounds, two words
 *  each. Below this a session would have to repeat itself. */
const MIN_CARDS = 6;

export type TurnKind = "greeting" | "gusta" | "prefiere" | "farewell";

/** One thing the kid can say. Note what is absent: any notion of correctness. */
export interface ConversationChoice {
  readonly id: string;
  /** The picture a pre-reader taps. */
  readonly emoji: string;
  /** What the kid says — spoken back to them, and shown to the reader. */
  readonly spanish: string;
  readonly english: string;
  /** What the mascota says in return. Never empty: every choice gets an answer. */
  readonly reply: string;
}

export interface ConversationTurn {
  readonly kind: TurnKind;
  /** What the mascota says first. */
  readonly prompt: string;
  readonly choices: readonly ConversationChoice[];
}

export interface Conversation {
  readonly deckId: string;
  readonly turns: readonly ConversationTurn[];
}

/**
 * The mascota's own taste for one word, as a stable 0–1 number.
 *
 * This is what stops the pet being an echo. It likes some things and not
 * others, always the same ones, so "¿Te gusta el perro?" can be met with
 * "¡A mí también!" or "¿Sí? A mí no me gusta" — the same frame, two different
 * conversations. Seeded by the pet's *name*, so naming a new pet genuinely
 * gets a new companion rather than a re-skin.
 */
export function petPrefers(petName: string, cardId: string): number {
  let hash = 2166136261;
  for (const char of `${petName}:${cardId}`) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

const GREETINGS = [
  (pet: string) => `¡Hola! Soy ${pet}. ¿Cómo estás?`,
  (pet: string) => `¡Hola, hola! Soy ${pet}. ¿Qué tal estás?`,
  (pet: string) => `¡Buenos días! Soy ${pet}. ¿Cómo te sientes?`,
];

const GREETING_CHOICES: readonly ConversationChoice[] = [
  {
    id: "bien",
    emoji: "😀",
    spanish: "Estoy bien",
    english: "I'm good",
    reply: "¡Qué bien! Yo también estoy muy bien.",
  },
  {
    id: "regular",
    emoji: "😐",
    spanish: "Más o menos",
    english: "So-so",
    reply: "Bueno… ¡vamos a jugar un rato!",
  },
  {
    id: "triste",
    emoji: "😢",
    spanish: "Estoy triste",
    english: "I'm sad",
    reply: "Oh, lo siento. Yo te acompaño.",
  },
];

const FAREWELLS = [
  "Me lo he pasado muy bien. ¿Nos despedimos?",
  "¡Qué divertido! ¿Nos decimos adiós?",
  "Se hace tarde. ¿Nos despedimos?",
];

const FAREWELL_CHOICES: readonly ConversationChoice[] = [
  {
    id: "adios",
    emoji: "👋",
    spanish: "¡Adiós!",
    english: "Bye!",
    reply: "¡Adiós! Hasta pronto.",
  },
  {
    id: "hasta-luego",
    emoji: "🤗",
    spanish: "¡Hasta luego!",
    english: "See you later!",
    reply: "¡Hasta luego, amigo!",
  },
];

const GUSTA_PROMPTS = [
  (word: string) => `¿Te gusta ${word}?`,
  (word: string) => `Y ${word}, ¿te gusta?`,
  (word: string) => `Dime, ¿a ti te gusta ${word}?`,
];

const PREFIERE_PROMPTS = [
  (a: string, b: string) => `¿Qué prefieres, ${a} o ${b}?`,
  (a: string, b: string) => `Dime: ¿${a} o ${b}?`,
  (a: string, b: string) => `¿Te gusta más ${a} o ${b}?`,
];

function pick<T>(options: readonly T[], random: RandomSource): T {
  return options[Math.floor(random() * options.length)] ?? options[0]!;
}

function gustaTurn(
  card: VocabularyCard,
  petName: string,
  random: RandomSource,
): ConversationTurn {
  const likes = petPrefers(petName, card.id) > 0.5;
  return {
    kind: "gusta",
    prompt: pick(GUSTA_PROMPTS, random)(card.spanish),
    choices: [
      {
        id: "si",
        emoji: "👍",
        spanish: `Sí, me gusta ${card.spanish}`,
        english: `Yes, I like ${card.english}`,
        reply: likes
          ? `¡A mí también me gusta ${card.spanish}!`
          : `¿Sí? A mí no me gusta mucho.`,
      },
      {
        id: "no",
        emoji: "👎",
        spanish: `No, no me gusta ${card.spanish}`,
        english: `No, I don't like ${card.english}`,
        reply: likes
          ? `¿No? Pues a mí sí me gusta.`
          : `A mí tampoco me gusta.`,
      },
    ],
  };
}

function prefiereTurn(
  a: VocabularyCard,
  b: VocabularyCard,
  petName: string,
  random: RandomSource,
): ConversationTurn {
  const mine =
    petPrefers(petName, a.id) >= petPrefers(petName, b.id) ? a : b;
  const choiceFor = (card: VocabularyCard, other: VocabularyCard) => ({
    id: card.id,
    emoji: card.emoji,
    spanish: `Prefiero ${card.spanish}`,
    english: `I prefer ${card.english}`,
    reply:
      card.id === mine.id
        ? `¡Yo también prefiero ${card.spanish}!`
        : `Ah, yo prefiero ${other.spanish}.`,
  });
  return {
    kind: "prefiere",
    prompt: pick(PREFIERE_PROMPTS, random)(a.spanish, b.spanish),
    choices: [choiceFor(a, b), choiceFor(b, a)],
  };
}

/**
 * Build one conversation over a deck's words. `petName` is the mascota's own
 * name, which both greets the kid and seeds the pet's taste.
 */
export function createConversation(
  deck: Deck,
  petName: string,
  random: RandomSource = Math.random,
): Conversation {
  if (deck.cards.length < MIN_CARDS) {
    throw new ConversationDeckTooSmallError(deck.id, deck.cards.length, MIN_CARDS);
  }

  // One pool for the whole session, drawn from and never replaced — that is
  // what stops the pet asking about the same word twice in five turns.
  const pool = [...shuffled(deck.cards, random)];
  const middle: ConversationTurn[] = [];
  for (let i = 0; i < CONVERSATION_TURNS - 2; i++) {
    const wantsPair = random() < 0.5 && pool.length >= 2;
    if (wantsPair) {
      middle.push(prefiereTurn(pool.shift()!, pool.shift()!, petName, random));
    } else {
      middle.push(gustaTurn(pool.shift()!, petName, random));
    }
  }

  return {
    deckId: deck.id,
    turns: [
      {
        kind: "greeting",
        prompt: pick(GREETINGS, random)(petName),
        choices: GREETING_CHOICES,
      },
      ...middle,
      {
        kind: "farewell",
        prompt: pick(FAREWELLS, random),
        choices: FAREWELL_CHOICES,
      },
    ],
  };
}

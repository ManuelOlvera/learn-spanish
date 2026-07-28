import type { DeckGroup } from "../domain/deck-group";

/**
 * The home-screen shelves. Every deck must appear in exactly one group —
 * the content tests enforce the partition, so a new deck that isn't
 * shelved fails the build.
 */
export const DECK_GROUPS: readonly DeckGroup[] = [
  {
    id: "animales",
    nameSpanish: "Los animales",
    nameEnglish: "Animals",
    emoji: "🐾",
    deckIds: ["animals", "zoo", "bugs", "sea", "aves"],
  },
  {
    id: "numeros-colores",
    nameSpanish: "Números y colores",
    nameEnglish: "Numbers & colors",
    emoji: "🔢",
    deckIds: ["numbers", "numbers-11-20", "numbers-tens", "centenas", "colors"],
  },
  {
    // "…y yo" moved out to ¿Cómo soy? when this shelf hit its 5-deck cap.
    id: "casa",
    nameSpanish: "Mi casa",
    nameEnglish: "My home",
    emoji: "🏠",
    deckIds: ["food", "house", "clothes", "fruit"],
  },
  {
    // Describing a person: the parts, the hair and skin, the size, the mood.
    // Las emociones sits here rather than on Jugar y aprender — a feeling is
    // something a kid IS, not something a kid plays.
    id: "como-soy",
    nameSpanish: "¿Cómo soy?",
    nameEnglish: "All about me",
    emoji: "🧑",
    deckIds: ["body", "pelo", "tamanos", "feelings"],
  },
  {
    id: "mundo",
    nameSpanish: "El mundo",
    nameEnglish: "The world",
    emoji: "🌍",
    deckIds: ["nature", "weather", "vehicles", "jobs", "city"],
  },
  {
    id: "jugar",
    nameSpanish: "Jugar y aprender",
    nameEnglish: "Play & learn",
    emoji: "🎨",
    deckIds: ["toys", "sports", "school", "music"],
  },
  {
    id: "letras",
    nameSpanish: "Las letras",
    nameEnglish: "Letters",
    emoji: "🔤",
    deckIds: ["vocales", "letras-b-m", "letras-n-z"],
  },
  {
    // One deck per verb form. Grows to hold futuro/condicional later
    // (shelf caps at 5) once those become pre-reader-buildable.
    id: "verbos",
    nameSpanish: "Los verbos",
    nameEnglish: "Verbs",
    emoji: "🏃",
    deckIds: ["verbs-infinitive", "verbs-gerund", "verbs-imperative"],
  },
  {
    id: "calendario",
    nameSpanish: "El calendario",
    nameEnglish: "Calendar & time",
    emoji: "📅",
    deckIds: ["dias-semana", "meses", "la-hora", "dia-noche", "estaciones"],
  },
];

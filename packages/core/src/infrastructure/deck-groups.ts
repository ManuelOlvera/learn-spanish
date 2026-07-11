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
    deckIds: ["animals", "zoo", "bugs"],
  },
  {
    id: "numeros-colores",
    nameSpanish: "Números y colores",
    nameEnglish: "Numbers & colors",
    emoji: "🔢",
    deckIds: ["numbers", "numbers-11-20", "numbers-tens", "colors"],
  },
  {
    id: "casa-yo",
    nameSpanish: "Mi casa y yo",
    nameEnglish: "My home & me",
    emoji: "🏠",
    deckIds: ["body", "food", "house", "clothes"],
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
    deckIds: ["toys", "sports", "school", "feelings"],
  },
];

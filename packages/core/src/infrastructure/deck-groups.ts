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
    // La familia took the seat that freed up (2026-08-01): the people of the
    // house belong with the house, and ¿Cómo soy? — the other candidate — is
    // about one person, not the ones around them. Full again at 5.
    id: "casa",
    nameSpanish: "Mi casa",
    nameEnglish: "My home",
    emoji: "🏠",
    deckIds: ["familia", "food", "house", "clothes", "fruit"],
  },
  {
    // Describing a person: the face, the parts, the hair and skin, the size,
    // the mood, and the day. Las emociones sits here rather than on Jugar y
    // aprender — a feeling is something a kid IS, not something a kid plays.
    // La cara split out of El cuerpo (2026-08-12) and took the sixth seat:
    // home is already at its 9-shelf cap, so the shelf grew instead. Full at 6.
    id: "como-soy",
    nameSpanish: "¿Cómo soy?",
    nameEnglish: "All about me",
    emoji: "🧑",
    // Alto o bajo left for Formas y lugares (2026-08-17) — a size is a
    // spatial idea, and it only ever sat here for want of a shelf that was
    // about space. Back to 5, with room again.
    deckIds: ["cara", "body", "pelo", "feelings", "rutina"],
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
    // The spatial shelf (2026-08-17): what a thing looks like, where it is,
    // and how big it is. It took home to ten tiles, which re-pairs the
    // orphaned ninth rather than adding a row. Alto o bajo moved here from
    // ¿Cómo soy? to make three — a size belongs with the other space words.
    id: "formas-lugares",
    nameSpanish: "Formas y lugares",
    nameEnglish: "Shapes & places",
    emoji: "🔺",
    deckIds: ["formas", "posiciones", "tamanos"],
  },
  {
    id: "calendario",
    nameSpanish: "El calendario",
    nameEnglish: "Calendar & time",
    emoji: "📅",
    deckIds: ["dias-semana", "meses", "la-hora", "dia-noche", "estaciones"],
  },
];

/**
 * El camino's shelf order — easy → hard, and deliberately *not* the home
 * screen's order above. Home is arranged for browsing (what a kid recognises
 * fastest sits first); this is the learning ladder: the concrete and nameable
 * before the abstract, and reading last.
 *
 * Every shelf must appear exactly once — the content tests enforce it, so a
 * new shelf that nobody placed on the ladder fails the build.
 */
export const TRAIL_GROUP_ORDER: readonly string[] = [
  "animales",
  "numeros-colores",
  "casa",
  "como-soy",
  "formas-lugares",
  "jugar",
  "mundo",
  "calendario",
  "letras",
  "verbos",
];

/** The shelves in camino order. A shelf missing from the ladder falls to the
 *  end rather than vanishing — the route must never silently drop content. */
export function groupsInTrailOrder(
  groups: readonly DeckGroup[],
): readonly DeckGroup[] {
  const rank = (group: DeckGroup): number => {
    const at = TRAIL_GROUP_ORDER.indexOf(group.id);
    return at === -1 ? TRAIL_GROUP_ORDER.length : at;
  };
  return [...groups].sort((a, b) => rank(a) - rank(b));
}

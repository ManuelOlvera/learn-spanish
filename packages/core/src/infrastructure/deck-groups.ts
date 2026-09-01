import type { DeckGroup } from "../domain/deck-group";

/**
 * The home-screen shelves. Every deck must appear in exactly one group —
 * the content tests enforce the partition, so a new deck that isn't
 * shelved fails the build.
 */
export const DECK_GROUPS: readonly DeckGroup[] = [
  {
    // Named for the shelf, NOT for the deck inside it (2026-09-01). A shelf and
    // one of its own decks may never share a name: this shelf and its general
    // deck were both "Los animales / Animals", so /album's section and home's
    // category read as the same thing while counting different ones — the
    // album showed the deck finished while the shelf stood at 1 of 5. Renaming
    // the *shelf* rather than the deck is deliberate: a deck name is spoken to
    // the kids and printed on the tile they know, a shelf name is navigation.
    // A content test pins the rule.
    id: "animales",
    nameSpanish: "El mundo animal",
    nameEnglish: "Animal world",
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
    // La comida and La fruta left for the new La comida shelf (2026-08-29):
    // food is the category a 3-year-old points at most, and it had outgrown
    // being two tiles inside the house. Back to 3 — the shelf minimum, and
    // the seats are free again for the rooms of the house.
    id: "casa",
    nameSpanish: "Mi casa",
    nameEnglish: "My home",
    emoji: "🏠",
    deckIds: ["familia", "house", "clothes"],
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
    // Los vehículos left for El transporte (2026-08-29) — a car is not a
    // fact about the world the way weather and the city are, and it was the
    // one deck here a kid asked for by name.
    id: "mundo",
    nameSpanish: "El mundo",
    nameEnglish: "The world",
    emoji: "🌍",
    deckIds: ["nature", "weather", "jobs", "city"],
  },
  {
    id: "jugar",
    nameSpanish: "Jugar y aprender",
    nameEnglish: "Play & learn",
    emoji: "🎨",
    deckIds: ["toys", "sports", "school", "music"],
  },
  {
    // La comida (2026-08-29): food and fruit were buried inside Mi casa, and
    // the pack had exactly one vegetable. Promoted to a shelf of its own and
    // filled out to six — the shelf cap — so the whole meal is one place:
    // the ingredients, the vegetables, the sweets, the dish, and the table
    // it is eaten at.
    // Renamed off "La comida / Food" (2026-09-01) — the name the general deck
    // inside it already had, which is what the parent reported: /album's "La
    // comida" (the deck, gold) against home's "La comida" (the shelf, 1 of 6).
    // See the note on El mundo animal for why the shelf gives way, not the deck.
    id: "comida",
    nameSpanish: "Para comer",
    nameEnglish: "To eat",
    emoji: "🍽️",
    deckIds: ["food", "fruit", "verduras", "dulces", "platos", "mesa"],
  },
  {
    // El transporte (2026-08-29): the other half of the same ask. Los
    // vehículos came over from El mundo and brought four new decks — the
    // working vehicles a kid names in the street, the small wheels and the
    // rails, the air-and-sea second tier (el avión and el barco stay in Los
    // vehículos), and the things you carry on a journey.
    id: "transporte",
    nameSpanish: "El transporte",
    nameEnglish: "Transport",
    emoji: "🚗",
    deckIds: ["vehicles", "trabajo", "ruedas", "aire-mar", "viaje"],
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
  // La comida rides high on the ladder: a 3-year-old already knows these
  // things by sight in a way they do not know a profession or a month.
  "comida",
  "como-soy",
  "formas-lugares",
  "jugar",
  "transporte",
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

/**
 * Decks Habla con tu mascota runs on. Curated, not computed: the frames
 * ("¿Te gusta el perro?", "¿Qué prefieres, el gato o el perro?") only read
 * natively for things a person can *like*, which rules out body parts, letters,
 * numbers, positions, dates, feelings and the verb decks — "¿Te gusta el codo?"
 * is grammatical and absurd, and absurd is worse than absent for a 5-year-old.
 *
 * Los colores is the near miss: its words are bare adjectives (rojo, verde), so
 * the frame would produce "¿Te gusta rojo?". A content test pins the rule that
 * keeps this list honest — every card here carries its article.
 */
export const CONVERSATION_DECKS: readonly string[] = [
  "animals",
  "zoo",
  "bugs",
  "sea",
  "aves",
  "food",
  "fruit",
  "toys",
  "sports",
  "music",
  "clothes",
  "vehicles",
  "nature",
  "school",
  "city",
  "house",
  // The 2026-08-29 shelves. En la mesa is deliberately absent: "¿Te gusta el
  // tenedor?" is grammatical and strange, and strange is worse than absent.
  // El viaje is out for the same reason — you like a place, not a passport.
  "verduras",
  "dulces",
  "platos",
  "trabajo",
  "ruedas",
  "aire-mar",
];

/** Whether a deck offers a conversation — the 🗣️ tile is simply absent
 *  elsewhere, the same way Adivina and La sopa come and go. */
export function hasConversation(deckId: string): boolean {
  return CONVERSATION_DECKS.includes(deckId);
}

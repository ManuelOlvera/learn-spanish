export interface VocabularyCard {
  readonly id: string;
  /** The word as it should be shown and spoken, article included ("el perro").
   *  Letter cards are the exception — a letter's name is just the letter
   *  ("be", not "la be"); they carry their article in `article` instead. */
  readonly spanish: string;
  readonly english: string;
  /** The picture — pre-readers navigate by this alone, so it is required. */
  readonly emoji: string;
  /** State adjectives (triste, cansado…) take estar, not ser, when games
   *  build questions about the card ("¿Está triste?"). Defaults to ser. */
  readonly usesEstar?: boolean;
  /** Full question override for cards where neither "¿Es un/una …?" nor
   *  estar reads natively: mass nouns ("¿Es agua?"), unique entities
   *  ("¿Es el sol?"), activities ("¿Es tenis?"), idioms ("¿Hace calor?"). */
  readonly question?: string;
  /** The article to use when a game needs a noun phrase but `spanish` is bare.
   *  Letter names are spoken bare ("be") yet are feminine in a sentence, so
   *  scene can still ask "¿Dónde está la be?" — never "el be", never a bare
   *  "¿Dónde está be?". Only set this where `spanish` carries no article. */
  readonly article?: "el" | "la" | "los" | "las";
}

export interface VocabularyCard {
  readonly id: string;
  /** The word as it should be shown and spoken, article included ("el perro"). */
  readonly spanish: string;
  readonly english: string;
  /** The picture — pre-readers navigate by this alone, so it is required. */
  readonly emoji: string;
  /** State adjectives (triste, cansado…) take estar, not ser, when games
   *  build questions about the card ("¿Está triste?"). Defaults to ser. */
  readonly usesEstar?: boolean;
}

export interface VocabularyCard {
  readonly id: string;
  /** The word as it should be shown and spoken, article included ("el perro").
   *  Letter cards are the exception — a letter's name is just the letter
   *  ("be", not "la be"); they carry their article in `article` instead. */
  readonly spanish: string;
  readonly english: string;
  /** The picture — pre-readers navigate by this alone, so it is required.
   *  On a card that carries `image`, this is a **fallback that should never
   *  render**: it is the best available approximation, kept so a missing
   *  drawing degrades to a picture instead of an empty card (ADR 009, ADR 015).
   *  Fallbacks may therefore repeat within a deck; the *effective* picture,
   *  which is what a game deals, may not — see `cardPicture`. */
  readonly emoji: string;
  /** Drawing key for words emoji cannot show — a cheek, a neck, an elbow are
   *  only depictable as a highlighted part of a whole figure. A *key*, not a
   *  file: `packages/core` never learns what an asset is, and `apps/web` maps
   *  the key to art the same way `deck-theme.ts` maps a deck id to a colour
   *  (ADR 015). Absent on cards whose emoji already reads. */
  readonly image?: string;
  /** State adjectives (triste, cansado…) take estar, not ser, when games
   *  build questions about the card ("¿Está triste?"). Defaults to ser. */
  readonly usesEstar?: boolean;
  /** Full question override for cards where neither "¿Es un/una …?" nor
   *  estar reads natively: mass nouns ("¿Es agua?"), unique entities
   *  ("¿Es el sol?"), activities ("¿Es tenis?"), idioms ("¿Hace calor?"). */
  readonly question?: string;
  /** Full override for the scene hunt ("¿Dónde está …?") where the built
   *  phrase is wrong rather than merely stiff: month names take no article
   *  in Spanish, so the bare-word fallback would ask "¿Dónde está el enero?".
   *  Only set this where neither `spanish` nor `article` can produce a
   *  native question. */
  readonly sceneQuestion?: string;
  /** The article to use when a game needs a noun phrase but `spanish` is bare.
   *  Letter names are spoken bare ("be") yet are feminine in a sentence, so
   *  scene can still ask "¿Dónde está la be?" — never "el be", never a bare
   *  "¿Dónde está be?". Only set this where `spanish` carries no article. */
  readonly article?: "el" | "la" | "los" | "las";
}

/**
 * The picture a game actually deals, as an identity rather than an asset:
 * the drawing when the card has one, the emoji otherwise.
 *
 * Picture-choice rounds are answered by sight alone, so two cards a kid must
 * tell apart may never resolve to the same value here — that is the invariant
 * the pack tests enforce, and it is about what *renders*, not about the emoji
 * a drawn card carries as its fallback.
 */
export function cardPicture(card: VocabularyCard): string {
  return card.image ?? card.emoji;
}

/**
 * Shared spelling rules for the letter games (la sopa, el globo, adivina).
 * They all reduce a card to a bare, comparable word, and they must all agree
 * on what the alphabet is — a keyboard that can't type a letter the grid
 * contains is an unwinnable game.
 */

/** The 27 letters. Ñ is one of them; accented vowels are not — see below. */
export const SPANISH_ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

/**
 * Spanish word games drop accents (á files under A) but **Ñ is its own
 * letter and stays**. Deliberately not `normalize("NFD")` + strip: that
 * decomposes the ñ tilde too and quietly turns araña into ARANA.
 */
export function deaccent(word: string): string {
  return word
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/ü/g, "u");
}

/**
 * A card's bare word for the letter games: article stripped, accents
 * dropped, upper-cased. Null when the card has no single guessable word
 * (multi-word after the article, or an exclamation). Length limits belong
 * to each game, not here.
 */
export function bareWord(spanish: string): string | null {
  const bare = spanish.replace(/^(el|la|los|las) /, "");
  if (bare.includes(" ") || bare.includes("¡")) {
    return null;
  }
  return deaccent(bare).toUpperCase();
}

/**
 * Grammatical gender and number — what an adjective has to agree with.
 *
 * The app teaches by *speaking*, so a claim that does not agree ("la manzana
 * es rojo") is wrong Spanish said out loud to a child. Agreement is therefore
 * part of the content being correct, not polish on top of it.
 */
export type Gender = "m" | "f";
export type GrammaticalNumber = "singular" | "plural";

export interface Agreement {
  readonly gender: Gender;
  readonly number: GrammaticalNumber;
}

const ARTICLE_AGREEMENT: Readonly<Record<string, Agreement>> = {
  el: { gender: "m", number: "singular" },
  la: { gender: "f", number: "singular" },
  los: { gender: "m", number: "plural" },
  las: { gender: "f", number: "plural" },
};

/**
 * What a card's word agrees as.
 *
 * Read off the article the word already carries — the pack writes "la vaca",
 * so gender is data the content already has rather than a field to add and
 * keep in sync. A bare word falls back to its explicit `article` (letter cards
 * speak bare but are feminine in a sentence), then to masculine singular,
 * Spanish's unmarked default.
 */
export function cardAgreement(card: {
  readonly spanish: string;
  readonly article?: string;
}): Agreement {
  // The space matters: "las" in "lasaña" is not an article.
  const [first] = card.spanish.split(" ");
  const fromWord = first !== undefined ? ARTICLE_AGREEMENT[first] : undefined;
  return (
    fromWord ??
    (card.article === undefined ? undefined : ARTICLE_AGREEMENT[card.article]) ??
    { gender: "m", number: "singular" }
  );
}

/** Vowels whose written accent exists only to mark final-syllable stress. */
const STRESSED = "áéíóú";
const UNSTRESSED = "aeiou";

/**
 * Inflect an adjective to agree.
 *
 * Three classes, which is all this app's closed colour and size vocabularies
 * need:
 *
 * - **-o** inflects for gender (rojo / roja) and takes -s for plural.
 * - **any other vowel** is invariant in gender (verde, naranja, rosa) and
 *   takes -s for plural.
 * - **a consonant** is invariant in gender (azul, marrón) and takes **-es**,
 *   which adds a syllable — so a written accent marking stress on what *was*
 *   the last syllable becomes wrong and is dropped (marrón → marrones).
 */
export function agree(adjective: string, agreement: Agreement): string {
  const plural = agreement.number === "plural";
  if (adjective.endsWith("o")) {
    const stem = adjective.slice(0, -1) + (agreement.gender === "f" ? "a" : "o");
    return plural ? `${stem}s` : stem;
  }
  if (!plural) {
    return adjective;
  }
  return /[aeiouáéíóú]$/.test(adjective)
    ? `${adjective}s`
    : `${dropStressAccent(adjective)}es`;
}

/** Drop the one written accent that -es makes redundant. Only the last
 *  accented vowel is touched: a word can carry no other by Spanish's own
 *  accent rules, and deaccenting wholesale would break ñ-adjacent spellings
 *  the letter games rely on. */
function dropStressAccent(word: string): string {
  for (let i = word.length - 1; i >= 0; i -= 1) {
    const at = STRESSED.indexOf(word[i]!);
    if (at !== -1) {
      return word.slice(0, i) + UNSTRESSED[at]! + word.slice(i + 1);
    }
  }
  return word;
}

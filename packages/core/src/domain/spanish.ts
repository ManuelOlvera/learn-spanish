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

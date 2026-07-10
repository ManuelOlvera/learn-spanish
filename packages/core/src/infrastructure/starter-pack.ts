import type { Deck } from "../domain/deck";

/**
 * The built-in beginner vocabulary. Nouns carry their article so the
 * spoken form teaches gender along with the word.
 */
export const STARTER_PACK: readonly Deck[] = [
  {
    id: "animals",
    nameSpanish: "Los animales",
    nameEnglish: "Animals",
    emoji: "🐶",
    cards: [
      { id: "perro", spanish: "el perro", english: "the dog", emoji: "🐶" },
      { id: "gato", spanish: "el gato", english: "the cat", emoji: "🐱" },
      { id: "pajaro", spanish: "el pájaro", english: "the bird", emoji: "🐦" },
      { id: "pez", spanish: "el pez", english: "the fish", emoji: "🐟" },
      { id: "caballo", spanish: "el caballo", english: "the horse", emoji: "🐴" },
      { id: "vaca", spanish: "la vaca", english: "the cow", emoji: "🐮" },
      { id: "cerdo", spanish: "el cerdo", english: "the pig", emoji: "🐷" },
      { id: "pollo", spanish: "el pollo", english: "the chicken", emoji: "🐔" },
      { id: "rana", spanish: "la rana", english: "the frog", emoji: "🐸" },
      { id: "leon", spanish: "el león", english: "the lion", emoji: "🦁" },
      { id: "elefante", spanish: "el elefante", english: "the elephant", emoji: "🐘" },
      { id: "mariposa", spanish: "la mariposa", english: "the butterfly", emoji: "🦋" },
    ],
  },
  {
    id: "colors",
    nameSpanish: "Los colores",
    nameEnglish: "Colors",
    emoji: "🌈",
    cards: [
      { id: "rojo", spanish: "rojo", english: "red", emoji: "🔴" },
      { id: "naranja-color", spanish: "naranja", english: "orange", emoji: "🟠" },
      { id: "amarillo", spanish: "amarillo", english: "yellow", emoji: "🟡" },
      { id: "verde", spanish: "verde", english: "green", emoji: "🟢" },
      { id: "azul", spanish: "azul", english: "blue", emoji: "🔵" },
      { id: "morado", spanish: "morado", english: "purple", emoji: "🟣" },
      { id: "rosa", spanish: "rosa", english: "pink", emoji: "🌸" },
      { id: "marron", spanish: "marrón", english: "brown", emoji: "🟤" },
      { id: "negro", spanish: "negro", english: "black", emoji: "⚫" },
      { id: "blanco", spanish: "blanco", english: "white", emoji: "⚪" },
    ],
  },
  {
    id: "numbers",
    nameSpanish: "Los números",
    nameEnglish: "Numbers",
    emoji: "🔢",
    cards: [
      { id: "uno", spanish: "uno", english: "one", emoji: "1️⃣" },
      { id: "dos", spanish: "dos", english: "two", emoji: "2️⃣" },
      { id: "tres", spanish: "tres", english: "three", emoji: "3️⃣" },
      { id: "cuatro", spanish: "cuatro", english: "four", emoji: "4️⃣" },
      { id: "cinco", spanish: "cinco", english: "five", emoji: "5️⃣" },
      { id: "seis", spanish: "seis", english: "six", emoji: "6️⃣" },
      { id: "siete", spanish: "siete", english: "seven", emoji: "7️⃣" },
      { id: "ocho", spanish: "ocho", english: "eight", emoji: "8️⃣" },
      { id: "nueve", spanish: "nueve", english: "nine", emoji: "9️⃣" },
      { id: "diez", spanish: "diez", english: "ten", emoji: "🔟" },
    ],
  },
  {
    id: "food",
    nameSpanish: "La comida",
    nameEnglish: "Food",
    emoji: "🍎",
    cards: [
      { id: "manzana", spanish: "la manzana", english: "the apple", emoji: "🍎" },
      { id: "platano", spanish: "el plátano", english: "the banana", emoji: "🍌" },
      { id: "pan", spanish: "el pan", english: "the bread", emoji: "🍞" },
      { id: "leche", spanish: "la leche", english: "the milk", emoji: "🥛" },
      { id: "queso", spanish: "el queso", english: "the cheese", emoji: "🧀" },
      { id: "huevo", spanish: "el huevo", english: "the egg", emoji: "🥚" },
      { id: "fresa", spanish: "la fresa", english: "the strawberry", emoji: "🍓" },
      { id: "naranja-fruta", spanish: "la naranja", english: "the orange", emoji: "🍊" },
      { id: "zanahoria", spanish: "la zanahoria", english: "the carrot", emoji: "🥕" },
      { id: "galleta", spanish: "la galleta", english: "the cookie", emoji: "🍪" },
      { id: "agua", spanish: "el agua", english: "the water", emoji: "💧" },
      { id: "helado", spanish: "el helado", english: "the ice cream", emoji: "🍦" },
    ],
  },
];

import type { Sentence } from "../domain/sentence";

/**
 * The built-in beginner sentences: subject + verb + complement, three tiles
 * each, reusing pack vocabulary wherever possible so the words are familiar.
 */
export const SENTENCE_PACK: readonly Sentence[] = [
  {
    id: "gato-negro",
    tokens: ["el gato", "es", "negro"],
    english: "the cat is black",
    emoji: "🐱",
  },
  {
    id: "rana-verde",
    tokens: ["la rana", "es", "verde"],
    english: "the frog is green",
    emoji: "🐸",
  },
  {
    id: "elefante-grande",
    tokens: ["el elefante", "es", "grande"],
    english: "the elephant is big",
    emoji: "🐘",
  },
  {
    id: "manzana-roja",
    tokens: ["la manzana", "es", "roja"],
    english: "the apple is red",
    emoji: "🍎",
  },
  {
    id: "platano-amarillo",
    tokens: ["el plátano", "es", "amarillo"],
    english: "the banana is yellow",
    emoji: "🍌",
  },
  {
    id: "mariposa-bonita",
    tokens: ["la mariposa", "es", "bonita"],
    english: "the butterfly is pretty",
    emoji: "🦋",
  },
  {
    id: "perro-pan",
    tokens: ["el perro", "come", "pan"],
    english: "the dog eats bread",
    emoji: "🐶",
  },
  {
    id: "gato-leche",
    tokens: ["el gato", "bebe", "leche"],
    english: "the cat drinks milk",
    emoji: "🥛",
  },
  {
    id: "vaca-pasto",
    tokens: ["la vaca", "come", "pasto"],
    english: "the cow eats grass",
    emoji: "🐮",
  },
  {
    id: "pez-nada",
    tokens: ["el pez", "nada", "rápido"],
    english: "the fish swims fast",
    emoji: "🐟",
  },
  {
    id: "caballo-corre",
    tokens: ["el caballo", "corre", "rápido"],
    english: "the horse runs fast",
    emoji: "🐴",
  },
  {
    id: "pajaro-alto",
    tokens: ["el pájaro", "vuela", "alto"],
    english: "the bird flies high",
    emoji: "🐦",
  },
];

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
  {
    id: "sol-amarillo",
    tokens: ["el sol", "es", "amarillo"],
    english: "the sun is yellow",
    emoji: "☀️",
  },
  {
    id: "nieve-blanca",
    tokens: ["la nieve", "es", "blanca"],
    english: "the snow is white",
    emoji: "❄️",
  },
  {
    id: "mar-azul",
    tokens: ["el mar", "es", "azul"],
    english: "the sea is blue",
    emoji: "🌊",
  },
  {
    id: "veo-luna",
    tokens: ["yo", "veo", "la luna"],
    english: "I see the moon",
    emoji: "🌙",
  },
  {
    id: "carro-rapido",
    tokens: ["el carro", "es", "rápido"],
    english: "the car is fast",
    emoji: "🚗",
  },
  {
    id: "tren-grande",
    tokens: ["el tren", "es", "grande"],
    english: "the train is big",
    emoji: "🚂",
  },
  {
    id: "avion-alto",
    tokens: ["el avión", "vuela", "alto"],
    english: "the airplane flies high",
    emoji: "✈️",
  },
  {
    id: "camiseta-roja",
    tokens: ["la camiseta", "es", "roja"],
    english: "the t-shirt is red",
    emoji: "👕",
  },
  {
    id: "mano-pequena",
    tokens: ["la mano", "es", "pequeña"],
    english: "the hand is small",
    emoji: "🖐️",
  },
  {
    id: "duermo-cama",
    tokens: ["yo", "duermo", "en la cama"],
    english: "I sleep in the bed",
    emoji: "🛏️",
  },
  {
    id: "lluvia-fria",
    tokens: ["la lluvia", "es", "fría"],
    english: "the rain is cold",
    emoji: "🌧️",
  },
  {
    id: "helado-frio",
    tokens: ["el helado", "es", "frío"],
    english: "the ice cream is cold",
    emoji: "🍦",
  },
];

/**
 * Per-deck accent colors — presentation-only, so they live in the app,
 * not in @learn-spanish/core. Unknown deck ids fall back to lime.
 */
const accents: Record<string, string> = {
  animals: "#f59e0b",
  colors: "#ec4899",
  numbers: "#38bdf8",
  "numbers-11-20": "#818cf8",
  "numbers-tens": "#2dd4bf",
  food: "#fb7185",
  frases: "#c084fc",
  cuento: "#f0abfc",
  // one accent per story, so each cuento reads as its own little book
  "gato-pez": "#38bdf8",
  "rana-lluvia": "#4ade80",
  "perro-pelota": "#f59e0b",
  "elefante-baila": "#a78bfa",
  "luna-galleta": "#fbbf24",
  "oso-dormir": "#818cf8",
  "mundial-2010": "#ef4444",
  "mundial-2023": "#f43f5e",
  "mundial-2026": "#dc2626",
  "halloween-japon": "#f97316",
  // La cara sits next to El cuerpo on the shelf, so it takes a warm neighbour
  // of the body orange rather than a colour from elsewhere in the wheel.
  cara: "#f59e0b",
  body: "#fb923c",
  pelo: "#b45309",
  tamanos: "#2563eb",
  // Formas y lugares: warm orange, deep purple, and the blue Alto o bajo
  // brought with it from ¿Cómo soy? — three clearly different hues, since
  // these three tiles sit side by side on one shelf. Both new decks are drawn
  // whole, so the accent is also the ink in the pictures: every shape is
  // filled `formas` orange, and the cat that moves is `posiciones` purple.
  formas: "#c2410c",
  posiciones: "#7e22ce",
  rutina: "#10b981",
  clothes: "#facc15",
  house: "#34d399",
  familia: "#c026d3",
  vehicles: "#60a5fa",
  weather: "#22d3ee",
  school: "#a855f7",
  feelings: "#f472b6",
  nature: "#4ade80",
  toys: "#e879f9",
  sports: "#ef4444",
  bugs: "#a16207",
  zoo: "#14b8a6",
  jobs: "#6366f1",
  city: "#94a3b8",
  sea: "#0ea5e9",
  aves: "#0891b2",
  fruit: "#f97316",
  music: "#8b5cf6",
  "verbs-infinitive": "#fb923c",
  "verbs-gerund": "#f97316",
  "verbs-imperative": "#ea580c",
  mystery: "#7c3aed",
  centenas: "#0d9488",
  vocales: "#fbbf24",
  "letras-b-m": "#84cc16",
  "letras-n-z": "#06b6d4",
  "dias-semana": "#7dd3fc",
  meses: "#e11d48",
  "la-hora": "#eab308",
  "dia-noche": "#4f46e5",
  estaciones: "#65a30d",
  // La comida (2026-08-29). food (#fb7185) and fruit (#f97316) keep the
  // accents they already had; the four new tiles take hues that stay apart
  // from them and from each other on one shelf.
  verduras: "#16a34a",
  dulces: "#f472b6",
  platos: "#d97706",
  mesa: "#0ea5e9",
  // El transporte. vehicles keeps its blue (#60a5fa); the rest spread out
  // around it so no two tiles on the shelf read as the same colour.
  trabajo: "#dc2626",
  ruedas: "#7c3aed",
  "aire-mar": "#0284c7",
  viaje: "#ca8a04",
  // home-screen shelves (deck groups)
  animales: "#f59e0b",
  "numeros-colores": "#38bdf8",
  casa: "#fb7185",
  "como-soy": "#a855f7",
  mundo: "#4ade80",
  jugar: "#e879f9",
  verbos: "#f97316",
  letras: "#f43f5e",
  "formas-lugares": "#059669",
  calendario: "#0284c7",
  comida: "#ea580c",
  transporte: "#3b82f6",
};

export function deckAccent(deckId: string): string {
  return accents[deckId] ?? "#a3e635";
}

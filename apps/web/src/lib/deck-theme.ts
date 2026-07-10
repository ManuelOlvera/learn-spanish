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
  body: "#fb923c",
  clothes: "#facc15",
  house: "#34d399",
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
};

export function deckAccent(deckId: string): string {
  return accents[deckId] ?? "#a3e635";
}

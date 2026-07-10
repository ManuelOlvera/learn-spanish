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
};

export function deckAccent(deckId: string): string {
  return accents[deckId] ?? "#a3e635";
}

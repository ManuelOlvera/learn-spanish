/** Returns a number in [0, 1); injectable so game assembly is testable. */
export type RandomSource = () => number;

/** Fisher–Yates; never mutates the input. */
export function shuffled<T>(items: readonly T[], random: RandomSource): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

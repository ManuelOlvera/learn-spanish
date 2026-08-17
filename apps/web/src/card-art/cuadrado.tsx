/**
 * el cuadrado — four equal sides, the square a kid draws
 *
 * Card art (ADR 015), Las formas: same fill, stroke and weight as every other
 * shape in the deck; only the geometry changes.
 */
export function CuadradoArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <rect x="28" y="28" width="144" height="144" rx="8" fill="#c2410c" stroke="#221f1a" strokeWidth="6"/>
    </svg>
  );
}

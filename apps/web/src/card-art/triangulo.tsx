/**
 * el triángulo — equilateral, point up
 *
 * Card art (ADR 015), Las formas: same fill, stroke and weight as every other
 * shape in the deck; only the geometry changes.
 */
export function TrianguloArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path d="M100 26 L174 158 L26 158 Z" fill="#c2410c" stroke="#221f1a" strokeWidth="6" strokeLinejoin="round"/>
    </svg>
  );
}

/**
 * el hexágono — six sides, point up, the shape off a honeycomb
 *
 * Card art (ADR 015), Las formas: same fill, stroke and weight as every other
 * shape in the deck; only the geometry changes. Another with no emoji at all.
 */
export function HexagonoArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path d="M100 24 L166 62 L166 138 L100 176 L34 138 L34 62 Z" fill="#c2410c" stroke="#221f1a" strokeWidth="6" strokeLinejoin="round"/>
    </svg>
  );
}

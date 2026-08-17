/**
 * el rectángulo — longer than it is tall, so it can't be read as a square
 *
 * Card art (ADR 015), Las formas: same fill, stroke and weight as every other
 * shape in the deck; only the geometry changes. Emoji has no rectangle at all,
 * which is half of why this deck is drawn.
 */
export function RectanguloArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <rect x="18" y="56" width="164" height="88" rx="8" fill="#c2410c" stroke="#221f1a" strokeWidth="6"/>
    </svg>
  );
}

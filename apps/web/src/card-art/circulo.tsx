/**
 * el círculo
 *
 * Card art (ADR 015): a flat vector drawing in the Sticker Book language —
 * ink outline, the shape filled in the deck accent. Las formas is drawn whole
 * so only the geometry differs between cards: every shape in this deck shares
 * this exact fill, stroke and weight, because the varying part IS the lesson.
 */
export function CirculoArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <circle cx="100" cy="100" r="72" fill="#c2410c" stroke="#221f1a" strokeWidth="6"/>
    </svg>
  );
}

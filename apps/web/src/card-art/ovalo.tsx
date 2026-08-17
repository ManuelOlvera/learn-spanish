/**
 * el óvalo — a stretched circle, wide enough never to read as one
 *
 * Card art (ADR 015), Las formas: same fill, stroke and weight as every other
 * shape in the deck; only the geometry changes.
 */
export function OvaloArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="100" cy="100" rx="78" ry="50" fill="#c2410c" stroke="#221f1a" strokeWidth="6"/>
    </svg>
  );
}

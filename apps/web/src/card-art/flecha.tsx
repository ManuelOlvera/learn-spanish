/**
 * la flecha — shaft and head, pointing right
 *
 * Card art (ADR 015), Las formas: same fill, stroke and weight as every other
 * shape in the deck; only the geometry changes.
 */
export function FlechaArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path
        d="M26 78 H108 V44 L174 100 L108 156 V122 H26 Z"
        fill="#c2410c"
        stroke="#221f1a"
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

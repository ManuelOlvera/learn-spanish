/**
 * la cruz — equal arms, the plus-sign cross
 *
 * Card art (ADR 015), Las formas: same fill, stroke and weight as every other
 * shape in the deck; only the geometry changes.
 */
export function CruzArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path
        d="M76 26 H124 V76 H174 V124 H124 V174 H76 V124 H26 V76 H76 Z"
        fill="#c2410c"
        stroke="#221f1a"
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * la estrella — five points, the star a kid draws without lifting the pencil
 *
 * Card art (ADR 015), Las formas: same fill, stroke and weight as every other
 * shape in the deck; only the geometry changes. Named `estrella-forma` because
 * the pack already has an `estrella`, and a card id is never reused.
 */
export function EstrellaFormaArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path
        d="M100 22 L119 74 L174 76 L130 110 L146 163 L100 132 L54 163 L70 110 L26 76 L81 74 Z"
        fill="#c2410c"
        stroke="#221f1a"
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

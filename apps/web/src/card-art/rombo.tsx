/**
 * el rombo — the square stood on its corner
 *
 * Card art (ADR 015), Las formas: same fill, stroke and weight as every other
 * shape in the deck; only the geometry changes.
 */
export function RomboArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path d="M100 22 L172 100 L100 178 L28 100 Z" fill="#c2410c" stroke="#221f1a" strokeWidth="6" strokeLinejoin="round"/>
    </svg>
  );
}

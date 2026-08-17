/**
 * el corazón — the shape, not the organ
 *
 * Card art (ADR 015), Las formas: same fill, stroke and weight as every other
 * shape in the deck; only the geometry changes. Named `corazon-forma` because
 * El cuerpo already owns `corazon` — that card is the one inside a chest.
 */
export function CorazonFormaArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path
        d="M100 172 C40 128 20 96 20 72 C20 44 42 26 66 26 C84 26 96 36 100 46 C104 36 116 26 134 26 C158 26 180 44 180 72 C180 96 160 128 100 172 Z"
        fill="#c2410c"
        stroke="#221f1a"
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

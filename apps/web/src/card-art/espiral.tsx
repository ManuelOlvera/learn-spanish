/**
 * la espiral — two and a half turns, wound outward from the middle
 *
 * Card art (ADR 015), Las formas. The one shape in the deck that is a line
 * rather than an area, so it is drawn the way the body art draws a limb: an
 * ink stroke with a thinner accent stroke laid over it, which keeps the same
 * outlined-in-ink look as its eleven filled neighbours. Each half-turn is a
 * semicircle whose radius grows by 12, so the windings never touch.
 */
export function EspiralArt({ className }: { className?: string }) {
  const path =
    "M100 100 A12 12 0 0 1 100 76 A24 24 0 0 1 100 124 A36 36 0 0 1 100 52 A48 48 0 0 1 100 148 A60 60 0 0 1 100 28";
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path d={path} stroke="#221f1a" strokeWidth="16" strokeLinecap="round" fill="none"/>
      <path d={path} stroke="#c2410c" strokeWidth="8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

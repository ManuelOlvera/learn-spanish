/**
 * las pestañas — one eye filling the frame, lashes fanned out
 *
 * Card art (ADR 015): a flat vector drawing in the Sticker Book language —
 * ink outline, warm fill, the named part in the deck accent. Inline rather
 * than an imported asset so it costs no request and no CSP exception, and
 * scales to whatever box the game draws it in (`1em` inside a sized span).
 */
export function PestanasArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path d="M14 108 Q100 30 186 108 Q100 178 14 108 Z" fill="#fffdf8" stroke="#221f1a" strokeWidth="6" strokeLinejoin="round"/>
      <circle cx="100" cy="108" r="34" fill="#221f1a"/>
      <circle cx="112" cy="98" r="10" fill="#fffdf8"/>
      <path d="M30 78 L14 50" stroke="#fb923c" strokeWidth="13" strokeLinecap="round"/>
      <path d="M58 58 L48 26" stroke="#fb923c" strokeWidth="13" strokeLinecap="round"/>
      <path d="M92 48 L90 14" stroke="#fb923c" strokeWidth="13" strokeLinecap="round"/>
      <path d="M126 52 L136 18" stroke="#fb923c" strokeWidth="13" strokeLinecap="round"/>
      <path d="M158 68 L176 40" stroke="#fb923c" strokeWidth="13" strokeLinecap="round"/>
    </svg>
  );
}

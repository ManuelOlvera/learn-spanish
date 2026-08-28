/**
 * la boca — a face with its mouth wide open
 *
 * Card art (ADR 015): a flat vector drawing in the Sticker Book language —
 * ink outline, warm fill, the named part in the deck accent. Inline rather
 * than an imported asset so it costs no request and no CSP exception, and
 * scales to whatever box the game draws it in (`1em` inside a sized span).
 *
 * Drawn because 👄 *is* a pair of lips, so la boca and los labios dealt the
 * same picture to a pre-reader (parent-reported 2026-08-28). A mouth is the
 * opening, not the border: this is the hole in a face, while los labios stays
 * lips closed and filling the frame. The teeth are a thin band under the top
 * lip rather than a row — el diente and la lengua are cards of their own in
 * this deck, and neither may be what a kid sees when asked for la boca.
 */
export function BocaArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <circle cx="100" cy="100" r="76" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="76" cy="76" r="7" fill="#221f1a"/>
      <circle cx="124" cy="76" r="7" fill="#221f1a"/>
      <path d="M62 58 Q76 49 90 58" stroke="#221f1a" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M110 58 Q124 49 138 58" stroke="#221f1a" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <ellipse cx="100" cy="128" rx="38" ry="28" fill="#fb923c" stroke="#221f1a" strokeWidth="6"/>
      <path d="M65 118 Q100 86 135 118 Z" fill="#fffdf8" stroke="#221f1a" strokeWidth="5" strokeLinejoin="round"/>
    </svg>
  );
}

/**
 * el codo — a bent arm, hand at the end
 *
 * Card art (ADR 015): a flat vector drawing in the Sticker Book language —
 * ink outline, warm fill, the named part in the deck accent. Inline rather
 * than an imported asset so it costs no request and no CSP exception, and
 * scales to whatever box the game draws it in (`1em` inside a sized span).
 */
export function CodoArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path d="M30 30 L152 88 L92 162" stroke="#221f1a" strokeWidth="58" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M30 30 L152 88 L92 162" stroke="#f0c9a4" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

      <circle cx="54" cy="164" r="10" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="50" cy="180" r="10" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="56" cy="195" r="9" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="74" cy="176" r="26" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="152" cy="88" r="31" fill="#fb923c" stroke="#221f1a" strokeWidth="6"/>
    </svg>
  );
}

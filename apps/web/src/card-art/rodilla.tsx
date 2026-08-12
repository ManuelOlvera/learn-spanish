/**
 * la rodilla — an upright leg, foot on the floor
 *
 * Card art (ADR 015): a flat vector drawing in the Sticker Book language —
 * ink outline, warm fill, the named part in the deck accent. Inline rather
 * than an imported asset so it costs no request and no CSP exception, and
 * scales to whatever box the game draws it in (`1em` inside a sized span).
 */
export function RodillaArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path d="M74 16 L104 96 L92 162" stroke="#221f1a" strokeWidth="62" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M74 16 L104 96 L92 162" stroke="#f0c9a4" strokeWidth="50" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M88 176 Q88 158 108 158 L150 158 Q166 158 166 176 Q166 186 150 186 L100 186 Q88 186 88 176 Z"
      fill="#f0c9a4" stroke="#221f1a" strokeWidth="6" strokeLinejoin="round"/>
      <circle cx="104" cy="96" r="32" fill="#fb923c" stroke="#221f1a" strokeWidth="6"/>
    </svg>
  );
}

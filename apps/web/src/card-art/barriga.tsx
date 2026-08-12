/**
 * la barriga — a front torso, navel in the middle
 *
 * Card art (ADR 015): a flat vector drawing in the Sticker Book language —
 * ink outline, warm fill, the named part in the deck accent. Inline rather
 * than an imported asset so it costs no request and no CSP exception, and
 * scales to whatever box the game draws it in (`1em` inside a sized span).
 */
export function BarrigaArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path d="M46 78 L26 150" stroke="#221f1a" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M46 78 L26 150" stroke="#f0c9a4" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M154 78 L174 150" stroke="#221f1a" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M154 78 L174 150" stroke="#f0c9a4" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="42" y="52" width="116" height="148" rx="42" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <ellipse cx="100" cy="140" rx="44" ry="38" fill="#fb923c" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="100" cy="140" r="9" fill="#221f1a" opacity="0.55"/>
      <path d="M74 22 Q100 44 126 22" stroke="#221f1a" strokeWidth="6" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

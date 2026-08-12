/**
 * el hombro — head and one arm, the joint between them
 *
 * Card art (ADR 015): a flat vector drawing in the Sticker Book language —
 * ink outline, warm fill, the named part in the deck accent. Inline rather
 * than an imported asset so it costs no request and no CSP exception, and
 * scales to whatever box the game draws it in (`1em` inside a sized span).
 */
export function HombroArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path d="M138 108 L162 182" stroke="#221f1a" strokeWidth="58" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M138 108 L162 182" stroke="#f0c9a4" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="52" y="96" width="86" height="90" rx="30" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="138" cy="106" r="32" fill="#fb923c" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="72" cy="58" r="44" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="60" cy="54" r="5.5" fill="#221f1a"/>
      <circle cx="88" cy="54" r="5.5" fill="#221f1a"/>
      <path d="M64 74 Q74 82 86 72" stroke="#221f1a" strokeWidth="5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

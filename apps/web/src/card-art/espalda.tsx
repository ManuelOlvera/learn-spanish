/**
 * la espalda — a back seen from behind, under a hair cap
 *
 * Card art (ADR 015): a flat vector drawing in the Sticker Book language —
 * ink outline, warm fill, the named part in the deck accent. Inline rather
 * than an imported asset so it costs no request and no CSP exception, and
 * scales to whatever box the game draws it in (`1em` inside a sized span).
 */
export function EspaldaArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path d="M46 92 L26 162" stroke="#221f1a" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M46 92 L26 162" stroke="#f0c9a4" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M154 92 L174 162" stroke="#221f1a" strokeWidth="42" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M154 92 L174 162" stroke="#f0c9a4" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="42" y="66" width="116" height="134" rx="40" fill="#fb923c" stroke="#221f1a" strokeWidth="6"/>
      <path d="M100 88 L100 178" stroke="#221f1a" strokeWidth="7" strokeLinecap="round" opacity="0.5" fill="none"/>
      <path d="M72 104 Q62 128 76 144" stroke="#221f1a" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.4"/>
      <path d="M128 104 Q138 128 124 144" stroke="#221f1a" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.4"/>
      <path d="M56 62 Q56 2 100 2 Q144 2 144 62 Z" fill="#6b4a2f" stroke="#221f1a" strokeWidth="6" strokeLinejoin="round"/>
    </svg>
  );
}

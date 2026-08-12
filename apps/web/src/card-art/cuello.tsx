/**
 * el cuello — head and shoulders, the column between them
 *
 * Card art (ADR 015): a flat vector drawing in the Sticker Book language —
 * ink outline, warm fill, the named part in the deck accent. Inline rather
 * than an imported asset so it costs no request and no CSP exception, and
 * scales to whatever box the game draws it in (`1em` inside a sized span).
 */
export function CuelloArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path d="M26 200 Q26 146 100 146 Q174 146 174 200 Z" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <rect x="74" y="88" width="52" height="70" rx="18" fill="#fb923c" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="100" cy="62" r="52" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="84" cy="56" r="6.5" fill="#221f1a"/>
      <circle cx="116" cy="56" r="6.5" fill="#221f1a"/>
      <path d="M86 80 Q100 92 114 80" stroke="#221f1a" strokeWidth="6" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

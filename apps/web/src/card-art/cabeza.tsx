/**
 * la cabeza — the whole head, coloured in on a standing figure
 *
 * Card art (ADR 015): a flat vector drawing in the Sticker Book language —
 * ink outline, warm fill, the named part in the deck accent. Inline rather
 * than an imported asset so it costs no request and no CSP exception, and
 * scales to whatever box the game draws it in (`1em` inside a sized span).
 */
export function CabezaArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path d="M88 138 L84 168" stroke="#221f1a" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M88 138 L84 168" stroke="#f0c9a4" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M112 138 L116 168" stroke="#221f1a" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M112 138 L116 168" stroke="#f0c9a4" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M84 168 L82 186" stroke="#221f1a" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M84 168 L82 186" stroke="#f0c9a4" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M116 168 L118 186" stroke="#221f1a" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M116 168 L118 186" stroke="#f0c9a4" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M74 96 L54 120 L60 146" stroke="#221f1a" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M74 96 L54 120 L60 146" stroke="#f0c9a4" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M126 96 L146 120 L140 146" stroke="#221f1a" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M126 96 L146 120 L140 146" stroke="#f0c9a4" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="70" y="82" width="60" height="62" rx="24" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <rect x="90" y="64" width="20" height="22" rx="8" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="100" cy="42" r="34" fill="#fb923c" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="88" cy="38" r="4.5" fill="#221f1a"/>
      <circle cx="112" cy="38" r="4.5" fill="#221f1a"/>
      <path d="M90 54 Q100 62 110 54" stroke="#221f1a" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

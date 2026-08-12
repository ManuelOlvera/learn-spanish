/**
 * las cejas — two brows above the eyes
 *
 * Card art (ADR 015): a flat vector drawing in the Sticker Book language —
 * ink outline, warm fill, the named part in the deck accent. Inline rather
 * than an imported asset so it costs no request and no CSP exception, and
 * scales to whatever box the game draws it in (`1em` inside a sized span).
 */
export function CejasArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <circle cx="100" cy="100" r="76" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="78" cy="96" r="7" fill="#221f1a"/>
      <circle cx="122" cy="96" r="7" fill="#221f1a"/>
      <path d="M56 66 Q78 48 100 66" stroke="#221f1a" strokeWidth="20" strokeLinecap="round" fill="none"/>
      <path d="M56 66 Q78 48 100 66" stroke="#fb923c" strokeWidth="12" strokeLinecap="round" fill="none"/>
      <path d="M100 66 Q122 48 144 66" stroke="#221f1a" strokeWidth="20" strokeLinecap="round" fill="none"/>
      <path d="M100 66 Q122 48 144 66" stroke="#fb923c" strokeWidth="12" strokeLinecap="round" fill="none"/>
      <path d="M86 138 Q100 148 114 138" stroke="#221f1a" strokeWidth="7" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

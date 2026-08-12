/**
 * los labios — lips filling the frame
 *
 * Card art (ADR 015): a flat vector drawing in the Sticker Book language —
 * ink outline, warm fill, the named part in the deck accent. Inline rather
 * than an imported asset so it costs no request and no CSP exception, and
 * scales to whatever box the game draws it in (`1em` inside a sized span).
 */
export function LabiosArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path d="M22 100 Q52 58 76 84 Q100 62 124 84 Q148 58 178 100 Q100 130 22 100 Z"
      fill="#fb923c" stroke="#221f1a" strokeWidth="6" strokeLinejoin="round"/>
      <path d="M22 100 Q100 190 178 100 Q100 130 22 100 Z"
      fill="#fb923c" stroke="#221f1a" strokeWidth="6" strokeLinejoin="round"/>
      <path d="M22 100 Q100 130 178 100" stroke="#221f1a" strokeWidth="6" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

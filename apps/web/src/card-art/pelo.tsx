/**
 * el pelo — the hair as a cap over a face
 *
 * Card art (ADR 015): a flat vector drawing in the Sticker Book language —
 * ink outline, warm fill, the named part in the deck accent. Inline rather
 * than an imported asset so it costs no request and no CSP exception, and
 * scales to whatever box the game draws it in (`1em` inside a sized span).
 */
export function PeloArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <circle cx="100" cy="112" r="72" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <path d="M30 104 Q28 26 100 26 Q172 26 170 104 Q150 74 100 74 Q50 74 30 104 Z"
      fill="#fb923c" stroke="#221f1a" strokeWidth="6" strokeLinejoin="round"/>
      <path d="M56 60 Q76 42 100 46" stroke="#221f1a" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.4"/>
      <path d="M104 44 Q130 44 146 62" stroke="#221f1a" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.4"/>
      <circle cx="78" cy="112" r="7" fill="#221f1a"/>
      <circle cx="122" cy="112" r="7" fill="#221f1a"/>
      <path d="M86 146 Q100 156 114 146" stroke="#221f1a" strokeWidth="7" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

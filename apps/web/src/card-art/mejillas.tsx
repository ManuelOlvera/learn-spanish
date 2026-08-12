/**
 * las mejillas — two discs on the cheeks of a face
 *
 * Card art (ADR 015): a flat vector drawing in the Sticker Book language —
 * ink outline, warm fill, the named part in the deck accent. Inline rather
 * than an imported asset so it costs no request and no CSP exception, and
 * scales to whatever box the game draws it in (`1em` inside a sized span).
 */
export function MejillasArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <circle cx="100" cy="100" r="76" fill="#f0c9a4" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="66" cy="112" r="20" fill="#fb923c" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="134" cy="112" r="20" fill="#fb923c" stroke="#221f1a" strokeWidth="6"/>
      <circle cx="78" cy="82" r="6.5" fill="#221f1a"/>
      <circle cx="122" cy="82" r="6.5" fill="#221f1a"/>
      <path d="M64 62 Q78 52 92 62" stroke="#221f1a" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M108 62 Q122 52 136 62" stroke="#221f1a" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M88 142 Q100 152 112 142" stroke="#221f1a" strokeWidth="7" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

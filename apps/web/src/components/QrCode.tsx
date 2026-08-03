import { encodeQr } from "@learn-spanish/core";
import { log } from "@learn-spanish/config";

interface Props {
  /** The text a scanner should read — here, always a sync link. */
  value: string;
  /** Parent-facing description; the QR is decorative to a screen reader
   *  without it, since the code itself is always shown as text too. */
  label: string;
}

/** The white margin a scanner needs to find the symbol, in modules. */
const QUIET_ZONE = 4;

/**
 * A scannable QR, drawn as one SVG path so a 29×29 symbol is a single DOM
 * node rather than 841 of them.
 *
 * Colours are hard-coded black-on-white instead of using the paper/ink theme
 * tokens: a dark theme would render a low-contrast or inverted symbol that
 * phones refuse to read, and a QR that doesn't scan is worse than no QR.
 * Renders nothing if the payload can't be encoded — the panel always shows
 * the typeable code beside it, so the parent is never stranded.
 */
export function QrCode({ value, label }: Props) {
  let matrix: readonly (readonly boolean[])[];
  try {
    matrix = encodeQr(value);
  } catch (err) {
    log.warn("qr", "could not encode payload; showing the code only", { err });
    return null;
  }

  const span = matrix.length + QUIET_ZONE * 2;
  let path = "";
  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix.length; col += 1) {
      if (matrix[row]![col]) {
        path += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${span} ${span}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className="h-56 w-56 rounded-2xl border-4 border-ink bg-white"
    >
      <rect width={span} height={span} fill="#ffffff" />
      <path d={path} fill="#111111" />
    </svg>
  );
}

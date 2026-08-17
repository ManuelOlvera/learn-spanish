/**
 * The ¿Dónde está? scene kit — NOT card art itself, and not an art key.
 *
 * A position has no picture of its own. What teaches *dentro* is not a symbol
 * for insideness but a cat, a box, and the cat being in it — so all twelve
 * cards in the deck are one drawing with the cat moved, and the repetition is
 * the lesson. That makes the cat and the box shared parts rather than twelve
 * hand-copies: a tweak to the cat's ears has to land on all twelve at once or
 * the deck stops reading as one scene.
 *
 * Everything here is in the Sticker Book language (ADR 015): ink outlines,
 * flat fills, the moving subject in the deck accent so the eye tracks *where
 * the cat is*. Card art is not themed — these colours are fixed, and the
 * drawing sits on a white card face in both light and dark.
 *
 * The frame is the shared 200×200 of every card drawing, with the ground line
 * at y=184; a cat placed at y=184 is standing on it.
 */
const INK = "#221f1a";
/** Las posiciones' accent — the cat, the one thing that moves. */
const CAT = "#7e22ce";
const KRAFT = "#d9a468";
/** The shadowed inside of an open box, so "empty" reads as empty. */
const KRAFT_DARK = "#96602f";
const PAPER = "#efe3ca";

export const GROUND_Y = 184;

/** The 200×200 frame every card drawing shares. */
export function Scene({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** The floor. Present on every card: up and down mean nothing without it. */
export function Ground() {
  return (
    <path d={`M14 ${GROUND_Y} H186`} stroke={INK} strokeWidth="6" strokeLinecap="round" fill="none"/>
  );
}

/**
 * A shelf. Only arriba and abajo use one, and that is the point: it makes
 * "high up" a different picture from "on top of the box", which is the pair a
 * three-year-old would otherwise be asked to tell apart by a gap alone.
 */
export function Plank({ y }: { y: number }) {
  return <rect x="16" y={y} width="168" height="14" rx="7" fill={PAPER} stroke={INK} strokeWidth="6"/>;
}

/** A taped-shut box: the landmark the cat is placed against. */
export function Box({
  x,
  y,
  w,
  h,
  legs = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Height of two legs under the box, turning it into a table to crawl under. */
  legs?: number;
}) {
  return (
    <>
      {legs > 0 && (
        <>
          <rect x={x + 8} y={y + h} width="14" height={legs} fill={KRAFT} stroke={INK} strokeWidth="6"/>
          <rect x={x + w - 22} y={y + h} width="14" height={legs} fill={KRAFT} stroke={INK} strokeWidth="6"/>
        </>
      )}
      <rect x={x} y={y} width={w} height={h} rx="6" fill={KRAFT} stroke={INK} strokeWidth="6"/>
      <path d={`M${x} ${y + 22} H${x + w}`} stroke={INK} strokeWidth="5" fill="none"/>
      <path d={`M${x + w / 2} ${y} V${y + 22}`} stroke={INK} strokeWidth="5" fill="none"/>
    </>
  );
}

/**
 * The same box with its flaps open, so a cat can be inside it — the top edge
 * is left unstroked, which is what makes it read as open rather than lidded.
 */
export function OpenBox({
  x,
  y,
  w,
  h,
  empty = false,
}: {
  x: number;
  /** The rim: anything below this is hidden by the box's front wall. */
  y: number;
  w: number;
  h: number;
  empty?: boolean;
}) {
  const wall = `M${x} ${y} V${y + h - 10} Q${x} ${y + h} ${x + 10} ${y + h} H${x + w - 10} Q${x + w} ${y + h} ${x + w} ${y + h - 10} V${y}`;
  const flapL = `M${x} ${y} L${x - 24} ${y - 15}`;
  const flapR = `M${x + w} ${y} L${x + w + 24} ${y - 15}`;
  return (
    <>
      <path d={flapL} stroke={INK} strokeWidth="12" strokeLinecap="round" fill="none"/>
      <path d={flapR} stroke={INK} strokeWidth="12" strokeLinecap="round" fill="none"/>
      <path d={wall} fill={KRAFT} stroke={INK} strokeWidth="6" strokeLinejoin="round"/>
      {empty && (
        <path d={`M${x + 10} ${y + 15} H${x + w - 10}`} stroke={KRAFT_DARK} strokeWidth="18" strokeLinecap="round" fill="none"/>
      )}
      <path d={flapL} stroke={KRAFT} strokeWidth="6" strokeLinecap="round" fill="none"/>
      <path d={flapR} stroke={KRAFT} strokeWidth="6" strokeLinecap="round" fill="none"/>
    </>
  );
}

/** How far apart: short dashes for cerca, a long run of them for lejos. */
export function Dashes({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <path
      d={`M${x1} ${y} H${x2}`}
      stroke={INK}
      strokeWidth="5"
      strokeDasharray="9 10"
      strokeLinecap="round"
      fill="none"
    />
  );
}

/**
 * The cat, sitting, drawn from its feet: `y` is the surface it sits on and `x`
 * its middle. `facing: -1` mirrors it to look the other way, and `scale` is
 * for lejos, where a smaller cat with thinner lines is what "far" looks like.
 */
export function Cat({
  x,
  y,
  scale = 1,
  facing = 1,
}: {
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${facing * scale} ${scale})`}>
      <path d="M-26 -18 Q-44 -24 -40 -46" stroke={INK} strokeWidth="14" strokeLinecap="round" fill="none"/>
      <path d="M-26 -18 Q-44 -24 -40 -46" stroke={CAT} strokeWidth="8" strokeLinecap="round" fill="none"/>
      <ellipse cx="0" cy="-20" rx="28" ry="20" fill={CAT} stroke={INK} strokeWidth="6"/>
      <path d="M6 -55 L8 -68 L18 -58 Z" fill={CAT} stroke={INK} strokeWidth="5" strokeLinejoin="round"/>
      <path d="M23 -58 L33 -67 L33 -53 Z" fill={CAT} stroke={INK} strokeWidth="5" strokeLinejoin="round"/>
      <circle cx="18" cy="-44" r="16" fill={CAT} stroke={INK} strokeWidth="6"/>
      <circle cx="13" cy="-46" r="2.6" fill={INK}/>
      <circle cx="24" cy="-46" r="2.6" fill={INK}/>
      <path d="M15 -38 Q19 -35 23 -38" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none"/>
    </g>
  );
}

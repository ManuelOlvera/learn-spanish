import { GLOBO_LIVES } from "@learn-spanish/core";

interface Props {
  /** Air left, 0…GLOBO_LIVES. At 0 the balloon has popped. */
  lives: number;
}

/**
 * The ahorcado's gallows, redrawn as a balloon losing air — the mechanic
 * without the hanged man, which has no place in a sticker book for
 * pre-schoolers. Inline SVG on purpose: sized and coloured from `lives`
 * alone, so six states cost zero image assets (ADR 009 stays about story art).
 */
export function Balloon({ lives }: Props) {
  const popped = lives <= 0;
  // Full at GLOBO_LIVES, shrivelled at 1 — never below a visible nub.
  const fullness = Math.max(0, lives) / GLOBO_LIVES;
  const rx = 26 * (0.35 + 0.65 * fullness);
  const ry = 32 * (0.35 + 0.65 * fullness);
  // Green while healthy, amber, then red on the last breath.
  const face =
    lives >= 5
      ? "var(--color-lime)"
      : lives >= 3
        ? "#ffd166"
        : "#ff8f8f";

  return (
    <svg
      viewBox="0 0 80 120"
      role="img"
      aria-label={
        popped
          ? "The balloon popped"
          : `Balloon: ${lives} of ${GLOBO_LIVES} breaths of air left`
      }
      className="h-32 w-24 sm:h-40 sm:w-28"
    >
      {popped ? (
        <g stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round">
          {/* Burst: shreds flying out from where the balloon was. */}
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line
                key={angle}
                x1={40 + Math.cos(rad) * 12}
                y1={44 + Math.sin(rad) * 12}
                x2={40 + Math.cos(rad) * 30}
                y2={44 + Math.sin(rad) * 30}
              />
            );
          })}
          <text x="40" y="52" textAnchor="middle" fontSize="26" stroke="none">
            💥
          </text>
        </g>
      ) : (
        <g>
          {/* String — slack and wavy, drawn from the knot down. */}
          <path
            d={`M40 ${44 + ry} q 10 18 -4 30 q -12 12 2 26`}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <ellipse
            cx="40"
            cy="44"
            rx={rx}
            ry={ry}
            fill={face}
            stroke="var(--color-ink)"
            strokeWidth="4"
          />
          {/* Knot. */}
          <path
            d={`M36 ${44 + ry} l4 -5 l4 5 z`}
            fill={face}
            stroke="var(--color-ink)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Highlight — the sticker-book sheen. */}
          <ellipse
            cx={40 - rx * 0.35}
            cy={44 - ry * 0.35}
            rx={rx * 0.18}
            ry={ry * 0.13}
            fill="#fff"
            opacity="0.75"
          />
        </g>
      )}
    </svg>
  );
}

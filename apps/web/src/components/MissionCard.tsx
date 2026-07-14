"use client";

import { MISSION_BONUS, type MissionKind, type MissionView } from "@learn-spanish/core";

/** How each misión kind is drawn — pictures only, the kid can't read, so
 *  every icon MUST match the game's icon in the deck menu (a mismatch sends
 *  the kid to the wrong place: 🔢 here once pointed at the numbers deck tile
 *  instead of the 🧮 counting game). */
const KIND_EMOJI: Partial<Record<MissionKind, string>> = {
  learn: "📖",
  quiz: "🔍",
  "si-no": "✅",
  match: "🧩",
  connect: "🔗",
  scene: "👀",
  frases: "💬",
  duel: "⚔️",
  counting: "🧮",
  spelling: "✏️",
  sopa: "🥣",
};

interface Props {
  mission: MissionView;
  /** Open the bonus chest. The parent owns the payout, burst, and sync push. */
  onClaim: () => void;
}

/** The home screen's La misión card: today's three kinds, done state, and the
 *  bonus chest once all are done. */
export function MissionCard({ mission, onClaim }: Props) {
  return (
    <div
      className="sticker relative flex w-full max-w-md items-center justify-between gap-3 px-5 py-3"
      aria-label="Today's mission"
    >
      <span aria-hidden className="sticker-peel" />
      <span className="flex items-center gap-2">
        <span aria-hidden className="text-3xl">
          🎯
        </span>
        <span className="text-lg font-extrabold">La misión</span>
      </span>
      <span className="flex items-center gap-2">
        {mission.kinds.map((kind) => {
          const done = mission.state.done.includes(kind);
          return (
            <span
              key={kind}
              aria-label={`${kind}: ${done ? "done" : "to do"}`}
              className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border-4 text-2xl ${
                done ? "border-ink bg-[var(--color-lime)]" : "border-dashed border-ink/30"
              }`}
            >
              <span aria-hidden>{KIND_EMOJI[kind]}</span>
            </span>
          );
        })}
        {mission.complete && !mission.state.claimed ? (
          <button
            type="button"
            onClick={onClaim}
            aria-label={`Open the mission chest (+${MISSION_BONUS} stars)`}
            className="sticker chest-tease flex h-14 w-14 items-center justify-center rounded-2xl text-3xl active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            🎁
          </button>
        ) : mission.state.claimed ? (
          <span aria-label="Mission bonus claimed" className="text-3xl">
            🏆
          </span>
        ) : null}
      </span>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  KID_GAME_MODES,
  MISSION_BONUS,
  missionTarget,
  type Camino,
  type Deck,
  type DeckGroup,
  type KidId,
  type MissionKind,
  type MissionTarget,
  type MissionView,
} from "@learn-spanish/core";

/** How each misión kind is drawn — pictures only, the kid can't read, so
 *  every icon MUST match the game's icon in the deck menu (a mismatch sends
 *  the kid to the wrong place: 🔢 here once pointed at the numbers deck tile
 *  instead of the 🧮 counting game).
 *
 *  Total, never `Partial` — a missing kind renders an EMPTY tile the kid can't
 *  act on (`cuento` shipped missing and blanked a slot on ~30% of days). Every
 *  `MissionKind` needs an entry here, whether or not it's drawn today. */
const KIND_EMOJI: Record<MissionKind, string> = {
  learn: "📖",
  quiz: "🔍",
  "si-no": "✅",
  match: "🧩",
  connect: "🔗",
  scene: "👀",
  frases: "💬",
  // 📚, not 📖 — the open book already means flashcards ("learn").
  cuento: "📚",
  duel: "⚔️",
  counting: "🧮",
  spelling: "✏️",
  sopa: "🥣",
  globo: "🎈",
  hablar: "🗣️",
  adivina: "🔡",
  reto: "⏱️",
};

/** The path under `/deck/[id]` each kind's game lives at, at this kid's own
 *  difficulty — the very routes the deck's game menu links to, so the icon and
 *  the tile lead to the same screen.
 *
 *  Total over `MissionKind` for the same reason `KIND_EMOJI` is: a kind that
 *  ships unrouted would draw an icon that does nothing. `null` marks the three
 *  kinds that are not played on a deck at all — `missionTarget` answers those
 *  with a shelf or the pack, and `hrefFor` branches before it reads this. */
function deckPaths(
  modes: (typeof KID_GAME_MODES)[KidId],
): Record<MissionKind, string | null> {
  return {
    learn: "learn",
    quiz: `quiz/${modes.quiz}`,
    "si-no": `si-no/${modes.quiz}`,
    match: `match/${modes.match}`,
    connect: `connect/${modes.quiz}`,
    scene: `scene/${modes.quiz}`,
    counting: `counting/${modes.quiz}`,
    duel: "duel",
    reto: "reto",
    spelling: "spelling",
    sopa: "sopa",
    globo: "globo",
    hablar: "hablar",
    frases: null,
    cuento: null,
    adivina: null,
  };
}

/** The screen a misión icon opens, or null when the pack can host the kind
 *  nowhere — then the icon stays a plain badge rather than a dead link. */
function hrefFor(
  kind: MissionKind,
  target: MissionTarget,
  kid: KidId,
): string | null {
  if (target === null) {
    return null;
  }
  const modes = KID_GAME_MODES[kid];
  if (target.scope === "shelf") {
    return `/group/${target.groupId}/adivina`;
  }
  if (target.scope === "pack") {
    return kind === "cuento" ? "/cuento" : `/frases/${modes.quiz}`;
  }
  const path = deckPaths(modes)[kind];
  return path === null ? null : `/deck/${target.deckId}/${path}`;
}

interface Props {
  mission: MissionView;
  kid: KidId;
  /** The pack, minus the secret decks — what a misión may send a kid to. */
  decks: readonly Deck[];
  groups: readonly DeckGroup[];
  /** El camino, so a misión lands on the stop the route is already pointing
   *  at rather than the first deck in the pack. Null until it has loaded. */
  camino: Camino | null;
  /** Open the bonus chest. The parent owns the payout, burst, and sync push. */
  onClaim: () => void;
}

/** The home screen's La misión card: today's three kinds, done state, and the
 *  bonus chest once all are done.
 *
 *  Each icon is a link into the game it names. It has to be: the card asks a
 *  pre-reader for three games by picture, and until now the picture was the
 *  whole answer — the kid had to recognise 🔗, remember which shelf and deck
 *  carries Conecta, and navigate there by hand. Tapping the thing you are
 *  being asked to do is the shortest path, and it is how every other card on
 *  this screen already works. */
export function MissionCard({
  mission,
  kid,
  decks,
  groups,
  camino,
  onClaim,
}: Props) {
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
          const href = hrefFor(
            kind,
            missionTarget(
              kind,
              decks,
              groups,
              camino?.nextDeckId ?? null,
              camino?.nextGroupId ?? null,
            ),
            kid,
          );
          // A done kind stays a link: replaying is how a sticker tiers up,
          // and a tile that goes dead the moment it's finished reads as broken.
          const className = `relative flex h-12 w-12 items-center justify-center rounded-2xl border-4 text-2xl ${
            done
              ? "border-ink bg-[var(--color-lime)]"
              : "border-dashed border-ink/30"
          }`;
          const label = `${kind}: ${done ? "done" : "to do"}`;
          return href === null ? (
            <span key={kind} aria-label={label} className={className}>
              <span aria-hidden>{KIND_EMOJI[kind]}</span>
            </span>
          ) : (
            <Link
              key={kind}
              href={href}
              aria-label={`${label} — tap to play`}
              className={`${className} active:translate-x-0.5 active:translate-y-0.5`}
            >
              <span aria-hidden>{KIND_EMOJI[kind]}</span>
            </Link>
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

/**
 * The board-size axis, shared by every game that scales (roadmap 12).
 *
 * It is deliberately **one** set of rungs across the app: a kid who learns
 * that 🟢/🟡/🔴 means "small board / bigger board" in Las parejas should read
 * the same three buttons the same way in every other game. What each rung
 * *means* is the game's own business — pairs on the board, choices per
 * question, rounds per session — but how many rungs there are, and in what
 * order, is not.
 *
 * Independent of the listen/read axis. A pre-reader may pick 🔴 and a reader
 * 🟢; difficulty says how much is on the board, the level says whether the
 * prompt is a sound or a word.
 */
export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

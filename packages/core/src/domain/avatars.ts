/** Avatars are bought with stars (the sticker/streak gating is gone). Free
 *  starters keep the picker usable out of the box; the rest are a spend. */
export interface AvatarChoice {
  readonly emoji: string;
  /** 0 = a free starter (always owned). */
  readonly cost: number;
}

export const AVATAR_CATALOG: readonly AvatarChoice[] = [
  // Free starters
  { emoji: "🦖", cost: 0 },
  { emoji: "🦄", cost: 0 },
  { emoji: "🐯", cost: 0 },
  { emoji: "🦊", cost: 0 },
  { emoji: "🐼", cost: 0 },
  { emoji: "🐸", cost: 0 },
  // Cheap
  { emoji: "🐙", cost: 15 },
  { emoji: "🦋", cost: 15 },
  { emoji: "🐝", cost: 15 },
  { emoji: "🐧", cost: 20 },
  { emoji: "🦉", cost: 20 },
  { emoji: "🐰", cost: 20 },
  { emoji: "🦁", cost: 20 },
  // Mid
  { emoji: "🐬", cost: 25 },
  { emoji: "🐳", cost: 25 },
  { emoji: "🦩", cost: 25 },
  { emoji: "🐊", cost: 25 },
  { emoji: "🤖", cost: 30 },
  { emoji: "🦈", cost: 30 },
  { emoji: "🦕", cost: 30 },
  { emoji: "🦚", cost: 35 },
  // Fancy
  { emoji: "🐲", cost: 40 },
  { emoji: "👾", cost: 40 },
  { emoji: "🧙", cost: 40 },
  { emoji: "👽", cost: 40 },
  { emoji: "🦸", cost: 50 },
  { emoji: "🧚", cost: 50 },
  { emoji: "🧜", cost: 50 },
  { emoji: "🐉", cost: 60 },
];

export const AVATAR_COSTS: Readonly<Record<string, number>> = Object.fromEntries(
  AVATAR_CATALOG.map((a) => [a.emoji, a.cost]),
);

export const STARTER_AVATARS: readonly string[] = AVATAR_CATALOG.filter(
  (a) => a.cost === 0,
).map((a) => a.emoji);

export function avatarCost(emoji: string): number {
  return AVATAR_COSTS[emoji] ?? 0;
}

export function isAvatarOwned(
  emoji: string,
  owned: readonly string[],
): boolean {
  return avatarCost(emoji) === 0 || owned.includes(emoji);
}

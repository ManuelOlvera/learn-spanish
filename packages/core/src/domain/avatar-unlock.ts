/** Progress-gated avatars: collecting makes the picker grow. */
export interface AvatarRequirement {
  readonly type: "stickers" | "streak";
  readonly count: number;
}

export interface AvatarProgress {
  readonly stickerCount: number;
  readonly streakDays: number;
}

export const AVATAR_UNLOCKS: Readonly<Record<string, AvatarRequirement>> = {
  "🐲": { type: "stickers", count: 10 },
  "👾": { type: "stickers", count: 25 },
  "🦸": { type: "streak", count: 5 },
  "🧚": { type: "stickers", count: 50 },
};

export function isAvatarUnlocked(
  avatar: string,
  progress: AvatarProgress,
): boolean {
  const requirement = AVATAR_UNLOCKS[avatar];
  if (requirement === undefined) {
    return true;
  }
  return requirement.type === "stickers"
    ? progress.stickerCount >= requirement.count
    : progress.streakDays >= requirement.count;
}

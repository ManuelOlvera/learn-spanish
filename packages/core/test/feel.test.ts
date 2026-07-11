import { describe, expect, it } from "vitest";
import { COMBO_MILESTONES, isComboMilestone } from "../src/domain/combo";
import {
  AVATAR_UNLOCKS,
  isAvatarUnlocked,
} from "../src/domain/avatar-unlock";

describe("combo milestones", () => {
  it("fires at 3, 5, and 10 in a row and nowhere else", () => {
    expect(COMBO_MILESTONES).toEqual([3, 5, 10]);
    expect(isComboMilestone(3)).toBe(true);
    expect(isComboMilestone(5)).toBe(true);
    expect(isComboMilestone(10)).toBe(true);
    for (const n of [0, 1, 2, 4, 6, 7, 8, 9, 11]) {
      expect(isComboMilestone(n), `count ${n}`).toBe(false);
    }
  });
});

describe("avatar unlocks", () => {
  it("keeps freely available avatars unlocked", () => {
    expect(isAvatarUnlocked("🦖", { stickerCount: 0, streakDays: 0 })).toBe(true);
    expect(isAvatarUnlocked("🐼", { stickerCount: 0, streakDays: 0 })).toBe(true);
  });

  it("locks the special four behind progress", () => {
    const fresh = { stickerCount: 0, streakDays: 0 };
    for (const avatar of Object.keys(AVATAR_UNLOCKS)) {
      expect(isAvatarUnlocked(avatar, fresh), avatar).toBe(false);
    }
  });

  it("unlocks by sticker count and by streak", () => {
    expect(isAvatarUnlocked("🐲", { stickerCount: 10, streakDays: 0 })).toBe(true);
    expect(isAvatarUnlocked("🐲", { stickerCount: 9, streakDays: 99 })).toBe(false);
    expect(isAvatarUnlocked("🦸", { stickerCount: 0, streakDays: 5 })).toBe(true);
    expect(isAvatarUnlocked("🦸", { stickerCount: 999, streakDays: 4 })).toBe(false);
    expect(isAvatarUnlocked("👾", { stickerCount: 25, streakDays: 0 })).toBe(true);
    expect(isAvatarUnlocked("🧚", { stickerCount: 50, streakDays: 0 })).toBe(true);
  });
});

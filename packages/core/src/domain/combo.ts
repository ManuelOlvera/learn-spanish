/** Consecutive-correct milestones that earn the ⚡ racha burst. */
export const COMBO_MILESTONES: readonly number[] = [3, 5, 10];

export function isComboMilestone(count: number): boolean {
  return COMBO_MILESTONES.includes(count);
}

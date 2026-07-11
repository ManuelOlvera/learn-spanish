import { stickerId } from "../domain/album";
import type { ActivityId, AlbumStore, StickerCountsStore } from "../domain/album";
import { stickerTier } from "../domain/sticker-tiers";
import type { StickerTier } from "../domain/sticker-tiers";
import type { KidId } from "../domain/kid";

export interface AwardResult {
  readonly stickerId: string;
  readonly isNew: boolean;
  readonly count: number;
  readonly tier: StickerTier;
  /** True the first time a tier is reached — worth its own celebration. */
  readonly tierUp: boolean;
}

export class AwardStickerUseCase {
  constructor(
    private readonly album: AlbumStore,
    private readonly counts: StickerCountsStore,
  ) {}

  async execute(
    kid: KidId,
    deckId: string,
    activity: ActivityId,
  ): Promise<AwardResult> {
    const id = stickerId(kid, deckId, activity);
    const earned = await this.album.load();
    const isNew = !earned.includes(id);
    if (isNew) {
      await this.album.save([...earned, id]);
    }

    const allCounts = await this.counts.load();
    // Stickers earned before the tier system count as one completion.
    const previous = allCounts[id] ?? (isNew ? 0 : 1);
    const count = previous + 1;
    await this.counts.save({ ...allCounts, [id]: count });

    return {
      stickerId: id,
      isNew,
      count,
      tier: stickerTier(count),
      tierUp: stickerTier(count) !== stickerTier(previous),
    };
  }
}

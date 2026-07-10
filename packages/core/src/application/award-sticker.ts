import { stickerId } from "../domain/album";
import type { ActivityId, AlbumStore } from "../domain/album";
import type { KidId } from "../domain/kid";

export interface AwardResult {
  readonly stickerId: string;
  readonly isNew: boolean;
}

export class AwardStickerUseCase {
  constructor(private readonly album: AlbumStore) {}

  async execute(
    kid: KidId,
    deckId: string,
    activity: ActivityId,
  ): Promise<AwardResult> {
    const id = stickerId(kid, deckId, activity);
    const earned = await this.album.load();
    if (earned.includes(id)) {
      return { stickerId: id, isNew: false };
    }
    await this.album.save([...earned, id]);
    return { stickerId: id, isNew: true };
  }
}

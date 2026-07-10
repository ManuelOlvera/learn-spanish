import type { AlbumStore } from "../domain/album";
import type { KidId } from "../domain/kid";

export class GetAlbumUseCase {
  constructor(private readonly album: AlbumStore) {}

  async execute(kid: KidId): Promise<readonly string[]> {
    const earned = await this.album.load();
    return earned.filter((id) => id.startsWith(`${kid}:`));
  }
}

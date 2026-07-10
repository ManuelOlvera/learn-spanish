import type { AlbumStore } from "../domain/album";

export class GetAlbumUseCase {
  constructor(private readonly album: AlbumStore) {}

  execute(): Promise<readonly string[]> {
    return this.album.load();
  }
}

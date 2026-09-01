import { listDeckGroups, listDecks } from "@/lib/container";
import { AlbumView } from "@/components/AlbumView";

export default async function AlbumPage() {
  const [decks, groups] = await Promise.all([
    listDecks.execute(),
    listDeckGroups.execute(),
  ]);
  return <AlbumView decks={decks} groups={groups} />;
}

import { listDecks } from "@/lib/container";
import { AlbumView } from "@/components/AlbumView";

export default async function AlbumPage() {
  const decks = await listDecks.execute();
  return <AlbumView decks={decks} />;
}

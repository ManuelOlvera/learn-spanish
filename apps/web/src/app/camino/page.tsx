import { listDeckGroups, listDecks } from "@/lib/container";
import { CaminoView } from "@/components/CaminoView";

/** El camino as its own screen — the map the Tu camino strip only summarises. */
export default async function CaminoPage() {
  const [decks, groups] = await Promise.all([
    listDecks.execute(),
    listDeckGroups.execute(),
  ]);
  return <CaminoView decks={decks} groups={groups} />;
}

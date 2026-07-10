import { listDeckGroups, listDecks } from "@/lib/container";
import { HomeView } from "@/components/HomeView";

export default async function HomePage() {
  const [decks, groups] = await Promise.all([
    listDecks.execute(),
    listDeckGroups.execute(),
  ]);
  return <HomeView decks={decks} groups={groups} />;
}

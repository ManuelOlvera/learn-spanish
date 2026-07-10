import { listDecks } from "@/lib/container";
import { HomeView } from "@/components/HomeView";

export default async function HomePage() {
  const decks = await listDecks.execute();
  return <HomeView decks={decks} />;
}

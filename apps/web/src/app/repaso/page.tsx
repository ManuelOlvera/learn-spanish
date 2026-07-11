import { listDecks } from "@/lib/container";
import { RepasoView } from "@/components/RepasoView";

export default async function RepasoPage() {
  const decks = await listDecks.execute();
  return <RepasoView decks={decks} />;
}

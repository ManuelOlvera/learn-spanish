import { listDecks } from "@/lib/container";
import { InformeView } from "@/components/InformeView";

export default async function InformePage() {
  const decks = await listDecks.execute();
  return <InformeView decks={decks} />;
}

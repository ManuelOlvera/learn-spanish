import { notFound } from "next/navigation";
import { ALL_KIDS, isKidId } from "@learn-spanish/core";
import { listDecks } from "@/lib/container";
import { KidReportView } from "@/components/KidReportView";

/** Both kids are known at build time, so each report is a static page. */
export function generateStaticParams() {
  return ALL_KIDS.map((kid) => ({ kid }));
}

export default async function KidReportPage({
  params,
}: {
  params: Promise<{ kid: string }>;
}) {
  const { kid } = await params;
  if (!isKidId(kid)) {
    notFound();
  }
  const decks = await listDecks.execute();
  return <KidReportView decks={decks} kid={kid} />;
}

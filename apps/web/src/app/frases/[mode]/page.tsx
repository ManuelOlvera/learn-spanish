import { notFound } from "next/navigation";
import type { QuizMode } from "@learn-spanish/core";
import { listSentences } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { FrasesListenPlayer } from "@/components/FrasesListenPlayer";
import { FrasesBuildPlayer } from "@/components/FrasesBuildPlayer";

const modes: readonly QuizMode[] = ["listen", "read"];

export function generateStaticParams() {
  return modes.map((mode) => ({ mode }));
}

function isQuizMode(value: string): value is QuizMode {
  return (modes as readonly string[]).includes(value);
}

export default async function FrasesModePage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  if (!isQuizMode(mode)) {
    notFound();
  }

  const sentences = await listSentences.execute();
  const accent = deckAccent("frases");

  return mode === "listen" ? (
    <FrasesListenPlayer sentences={sentences} accent={accent} />
  ) : (
    <FrasesBuildPlayer sentences={sentences} accent={accent} />
  );
}

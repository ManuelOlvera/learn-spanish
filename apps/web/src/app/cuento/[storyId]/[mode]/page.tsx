import { notFound } from "next/navigation";
import { storyCast, type QuizMode } from "@learn-spanish/core";
import { listDecks, listStories } from "@/lib/container";
import { deckAccent } from "@/lib/deck-theme";
import { StoryPlayer } from "@/components/StoryPlayer";

const modes: readonly QuizMode[] = ["listen", "read"];

export async function generateStaticParams() {
  const stories = await listStories.execute();
  return stories.flatMap((story) =>
    modes.map((mode) => ({ storyId: story.id, mode })),
  );
}

function isQuizMode(value: string): value is QuizMode {
  return (modes as readonly string[]).includes(value);
}

export default async function StoryModePage({
  params,
}: {
  params: Promise<{ storyId: string; mode: string }>;
}) {
  const { storyId, mode } = await params;
  if (!isQuizMode(mode)) {
    notFound();
  }

  const stories = await listStories.execute();
  const story = stories.find((s) => s.id === storyId);
  if (story === undefined) {
    notFound();
  }

  // Resolve the cast here, not in the browser: the client only ever needs
  // this story's handful of cards, and shipping the whole 377-card pack in
  // every story page's payload would be pure weight. Throws at build time if
  // a story names a card that doesn't exist (the content tests catch it first).
  const cards = storyCast(
    story,
    (await listDecks.execute()).flatMap((deck) => deck.cards),
  );

  return (
    <StoryPlayer
      story={story}
      cards={cards}
      mode={mode}
      accent={deckAccent(story.id)}
    />
  );
}

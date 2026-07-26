import { listStories } from "@/lib/container";
import { StoryShelf } from "@/components/StoryShelf";

export default async function CuentoPage() {
  const stories = await listStories.execute();
  return <StoryShelf stories={stories} />;
}

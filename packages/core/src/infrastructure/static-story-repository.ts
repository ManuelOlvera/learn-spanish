import type { Story, StoryRepository } from "../domain/story";
import { STORY_PACK } from "./story-pack";

export class StaticStoryRepository implements StoryRepository {
  listStories(): Promise<readonly Story[]> {
    return Promise.resolve(STORY_PACK);
  }
}

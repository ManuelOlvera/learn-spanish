import type { Story, StoryRepository } from "../domain/story";

export class ListStoriesUseCase {
  constructor(private readonly stories: StoryRepository) {}

  execute(): Promise<readonly Story[]> {
    return this.stories.listStories();
  }
}

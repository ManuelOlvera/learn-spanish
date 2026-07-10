import type { Sentence, SentenceRepository } from "../domain/sentence";

export class ListSentencesUseCase {
  constructor(private readonly sentences: SentenceRepository) {}

  execute(): Promise<readonly Sentence[]> {
    return this.sentences.listSentences();
  }
}

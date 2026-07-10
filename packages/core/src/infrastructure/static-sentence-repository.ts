import type { Sentence, SentenceRepository } from "../domain/sentence";
import { SENTENCE_PACK } from "./sentence-pack";

export class StaticSentenceRepository implements SentenceRepository {
  listSentences(): Promise<readonly Sentence[]> {
    return Promise.resolve(SENTENCE_PACK);
  }
}

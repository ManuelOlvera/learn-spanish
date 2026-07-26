export class DeckNotFoundError extends Error {
  constructor(public readonly deckId: string) {
    super(`Deck not found: ${deckId}`);
    this.name = "DeckNotFoundError";
  }
}

/** A story named a card id the pack doesn't have — a content bug, caught by
 *  the content tests, never swallowed into a silently shorter quiz. */
export class StoryCastCardNotFoundError extends Error {
  constructor(
    public readonly storyId: string,
    public readonly cardId: string,
  ) {
    super(`Story ${storyId} casts unknown card: ${cardId}`);
    this.name = "StoryCastCardNotFoundError";
  }
}

export class QuizDeckTooSmallError extends Error {
  constructor(
    public readonly deckId: string,
    public readonly cardCount: number,
    public readonly requiredCount: number,
  ) {
    super(
      `Deck ${deckId} has ${cardCount} cards but a quiz round needs ${requiredCount}`,
    );
    this.name = "QuizDeckTooSmallError";
  }
}

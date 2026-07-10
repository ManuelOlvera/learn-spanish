export class DeckNotFoundError extends Error {
  constructor(public readonly deckId: string) {
    super(`Deck not found: ${deckId}`);
    this.name = "DeckNotFoundError";
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

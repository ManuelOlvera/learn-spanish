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

/** More bytes than the largest QR version this encoder builds. A caller hit
 *  this by handing over something that was never meant to be a QR code — the
 *  answer is a shorter payload, not a bigger symbol. */
export class QrPayloadTooLongError extends Error {
  constructor(
    public readonly byteLength: number,
    public readonly maxBytes: number,
  ) {
    super(`QR payload is ${byteLength} bytes; the maximum is ${maxBytes}`);
    this.name = "QrPayloadTooLongError";
  }
}

export class QrEmptyPayloadError extends Error {
  constructor() {
    super("QR payload is empty");
    this.name = "QrEmptyPayloadError";
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

/** Habla con tu mascota needs enough words to fill five turns without asking
 *  about the same one twice. Eligible decks are a curated list held well above
 *  this, so hitting it means the list let through a deck that shrank. */
export class ConversationDeckTooSmallError extends Error {
  constructor(
    public readonly deckId: string,
    public readonly cardCount: number,
    public readonly minimum: number,
  ) {
    super(
      `Deck ${deckId} has ${cardCount} cards; a conversation needs ${minimum}`,
    );
    this.name = "ConversationDeckTooSmallError";
  }
}

/**
 * A sync RPC gave up before the network answered (ADR 004). Sync is
 * serialized per device, so an exchange that never settles ends sync for the
 * life of the tab; the adapter bounds every request and raises this instead,
 * leaving one failed exchange the next pull retries.
 */
export class SyncTimeoutError extends Error {
  constructor(
    public readonly fn: string,
    public readonly timeoutMs: number,
  ) {
    super(`Sync call ${fn} timed out after ${timeoutMs}ms`);
    this.name = "SyncTimeoutError";
  }
}

/**
 * The pairing round-trip succeeded but the code could not be written to this
 * device (private browsing, a full quota). The device is genuinely unpaired,
 * so this must not be reported as a network failure: the parent needs to know
 * their storage refused the write, not to retry on better wifi.
 */
export class PairingNotStoredError extends Error {
  constructor(public readonly cause: unknown) {
    super("Paired successfully but could not store the code on this device");
    this.name = "PairingNotStoredError";
  }
}

/** True for the abort a bounded `fetch` raises, and only that — an ordinary
 *  offline `TypeError` must stay distinguishable from a stall. */
export function isTimeoutError(err: unknown): boolean {
  return err instanceof Error && err.name === "TimeoutError";
}

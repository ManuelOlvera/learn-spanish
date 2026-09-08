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
 * The server refused the snapshot for its size (ADR 004; the 64 KB cap in
 * `0002_progress_hardening.sql`).
 *
 * Named rather than folded into the generic RPC failure because it is the one
 * sync failure that **never recovers on its own**. A network error clears when
 * the wifi does; this one is a ceiling the family grows into, and every
 * subsequent push fails identically until the payload shrinks. It has to reach
 * the parent as its own thing — "retry on better wifi" is exactly the wrong
 * advice for it.
 */
export class SnapshotTooLargeError extends Error {
  constructor() {
    super("The progress snapshot is larger than the server accepts");
    this.name = "SnapshotTooLargeError";
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

/** True for the server's size refusal. Matched by name, like every other
 *  error predicate here: `instanceof` compares class identity, which is not
 *  stable once the same module is loaded twice (a test that resets modules,
 *  a bundle that duplicates a chunk), and this error decides which of two
 *  quite different things the parent is told. */
export function isSnapshotTooLarge(err: unknown): boolean {
  return err instanceof Error && err.name === "SnapshotTooLargeError";
}

/** True for the abort a bounded `fetch` raises, and only that — an ordinary
 *  offline `TypeError` must stay distinguishable from a stall. */
export function isTimeoutError(err: unknown): boolean {
  return err instanceof Error && err.name === "TimeoutError";
}

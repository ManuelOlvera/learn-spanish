/**
 * A localStorage stand-in that can be made to fail.
 *
 * Every adapter in `src/lib` is written to survive a hostile store — a refused
 * write, a corrupt document, a getter that throws — and those are exactly the
 * paths `/verify` cannot reach, because it only ever drives a healthy device.
 * This is what makes them testable.
 */
export interface FakeStorage extends Storage {
  /** Reject writes the way a full quota does, from this call onward. */
  failWrites(reason?: string): void;
  /** Reject reads, the way a locked-down browser can. */
  failReads(reason?: string): void;
  /** Stop failing. */
  heal(): void;
  /** The raw backing map, for asserting what actually landed. */
  readonly data: Map<string, string>;
}

export function createFakeStorage(seed: Record<string, string> = {}): FakeStorage {
  const data = new Map<string, string>(Object.entries(seed));
  let writeError: string | null = null;
  let readError: string | null = null;

  const storage = {
    data,
    get length() {
      return data.size;
    },
    key(i: number) {
      return [...data.keys()][i] ?? null;
    },
    getItem(k: string) {
      if (readError !== null) {
        throw new DOMException(readError, "SecurityError");
      }
      return data.get(k) ?? null;
    },
    setItem(k: string, v: string) {
      if (writeError !== null) {
        // The real shape of a full quota, name included — adapters log it.
        throw new DOMException(writeError, "QuotaExceededError");
      }
      data.set(k, String(v));
    },
    removeItem(k: string) {
      if (writeError !== null) {
        throw new DOMException(writeError, "QuotaExceededError");
      }
      data.delete(k);
    },
    clear() {
      data.clear();
    },
    failWrites(reason = "quota exceeded") {
      writeError = reason;
    },
    failReads(reason = "storage disabled") {
      readError = reason;
    },
    heal() {
      writeError = null;
      readError = null;
    },
  };
  return storage as unknown as FakeStorage;
}

/** Install a fresh fake as `window.localStorage` and hand it back. */
export function installFakeStorage(seed: Record<string, string> = {}): FakeStorage {
  const fake = createFakeStorage(seed);
  Object.defineProperty(window, "localStorage", {
    value: fake,
    configurable: true,
    writable: true,
  });
  return fake;
}

/** Parse a stored kid-keyed document, or `{}` when absent. */
export function readDocRaw<T>(
  fake: FakeStorage,
  key: string,
): Record<string, T> {
  const raw = fake.data.get(key);
  return raw === undefined ? {} : (JSON.parse(raw) as Record<string, T>);
}

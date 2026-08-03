import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { encodeQr } from "../src/domain/qr";
import { QrEmptyPayloadError, QrPayloadTooLongError } from "../src/domain/errors";

/**
 * The encoder is hand-rolled (the app carries no third-party runtime deps),
 * so "it looks like a QR code" is not evidence. Every test here decodes the
 * matrix with a real scanner — jsQR, dev-only — and asserts the payload comes
 * back byte-for-byte. A wrong mask, a swapped block or an off-by-one in the
 * zig-zag placement all fail here, which is the whole point.
 */
function decode(matrix: readonly (readonly boolean[])[]): string | null {
  const quiet = 4;
  const scale = 5;
  const size = matrix.length + quiet * 2;
  const px = size * scale;
  const rgba = new Uint8ClampedArray(px * px * 4).fill(255);

  for (let y = 0; y < px; y += 1) {
    for (let x = 0; x < px; x += 1) {
      const row = Math.floor(y / scale) - quiet;
      const col = Math.floor(x / scale) - quiet;
      const dark = matrix[row]?.[col] === true;
      if (dark) {
        const i = (y * px + x) * 4;
        rgba[i] = 0;
        rgba[i + 1] = 0;
        rgba[i + 2] = 0;
      }
    }
  }
  return jsQR(rgba, px, px)?.data ?? null;
}

describe("encodeQr", () => {
  it("round-trips a real sync link through a scanner", () => {
    const link = "https://palabras.vercel.app/#sync=A1B2C-3D4E5-F6G7H-8J9K0";
    expect(decode(encodeQr(link))).toBe(link);
  });

  it("round-trips payloads across every version it grows through", () => {
    // One per capacity step: a scanner must read the smallest and the largest
    // symbol the app can produce, not just the size we happen to ship today.
    for (const length of [1, 14, 26, 42, 62, 84, 106, 122, 152, 180, 213]) {
      const payload = "x".repeat(length);
      expect(decode(encodeQr(payload)), `length ${length}`).toBe(payload);
    }
  });

  it("round-trips non-ASCII text as UTF-8", () => {
    const text = "¡Palabras! ñ á é";
    expect(decode(encodeQr(text))).toBe(text);
  });

  it("is a square matrix of 17 + 4·version modules", () => {
    const matrix = encodeQr("short");
    expect(matrix.length).toBe(21); // version 1
    expect(matrix.every((row) => row.length === 21)).toBe(true);
  });

  it("grows to the smallest version that fits the payload", () => {
    expect(encodeQr("x".repeat(14)).length).toBe(21); // v1 holds 14 bytes
    expect(encodeQr("x".repeat(15)).length).toBe(25); // v2 at 15
  });

  it("places the three finder patterns", () => {
    const m = encodeQr("short");
    const last = m.length - 1;
    for (const [top, left] of [
      [0, 0],
      [0, last - 6],
      [last - 6, 0],
    ] as const) {
      expect(m[top]![left]).toBe(true); // outer ring corner
      expect(m[top + 1]![left + 1]).toBe(false); // white ring
      expect(m[top + 3]![left + 3]).toBe(true); // solid centre
    }
  });

  it("is deterministic — the same text always yields the same matrix", () => {
    expect(encodeQr("¡Palabras!")).toEqual(encodeQr("¡Palabras!"));
  });

  it("rejects a payload past the largest version, rather than truncating", () => {
    expect(() => encodeQr("x".repeat(214))).toThrow(QrPayloadTooLongError);
  });

  it("rejects an empty payload", () => {
    expect(() => encodeQr("")).toThrow(QrEmptyPayloadError);
  });
});

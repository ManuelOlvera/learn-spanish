import { QrEmptyPayloadError, QrPayloadTooLongError } from "./errors";

/**
 * A minimal QR encoder: byte mode, error correction level M, versions 1–10.
 *
 * Hand-rolled on purpose. The web app ships zero third-party runtime
 * dependencies, and ADR 010 names "one compromised client dependency" as a
 * real risk on a five-year-old's tablet — a pairing QR is not worth widening
 * that surface. It lives in `core` because it is pure, framework-agnostic
 * logic, and `test/qr.test.ts` proves every output decodes in a real scanner.
 *
 * The scope is deliberately narrow. Byte mode alone covers any URL; level M
 * (~15% recovery) is the usual choice for one; and version 10 holds 213 bytes,
 * far past the longest link this app can build. Anything bigger is a bug, not
 * a bigger symbol — hence the throw.
 */

/** Level-M block structure per version: EC codewords per block, then the
 *  data-block groups as [blockCount, dataCodewordsPerBlock]. */
interface VersionSpec {
  readonly ecPerBlock: number;
  readonly groups: readonly (readonly [number, number])[];
}

const VERSIONS: readonly VersionSpec[] = [
  { ecPerBlock: 10, groups: [[1, 16]] }, // v1  — 14 bytes
  { ecPerBlock: 16, groups: [[1, 28]] }, // v2  — 26
  { ecPerBlock: 26, groups: [[1, 44]] }, // v3  — 42
  { ecPerBlock: 18, groups: [[2, 32]] }, // v4  — 62
  { ecPerBlock: 24, groups: [[2, 43]] }, // v5  — 84
  { ecPerBlock: 16, groups: [[4, 27]] }, // v6  — 106
  { ecPerBlock: 18, groups: [[4, 31]] }, // v7  — 122
  {
    ecPerBlock: 22,
    groups: [
      [2, 38],
      [2, 39],
    ],
  }, // v8  — 152
  {
    ecPerBlock: 22,
    groups: [
      [3, 36],
      [2, 37],
    ],
  }, // v9  — 180
  {
    ecPerBlock: 26,
    groups: [
      [4, 43],
      [1, 44],
    ],
  }, // v10 — 213
];

/** Alignment-pattern centre coordinates per version (index 0 = version 1). */
const ALIGNMENT: readonly (readonly number[])[] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

/** Encode `text` as a QR matrix; `true` is a dark module. Row-major, no quiet
 *  zone — the renderer owns the margin. */
export function encodeQr(text: string): readonly (readonly boolean[])[] {
  const bytes = new TextEncoder().encode(text);
  if (bytes.length === 0) {
    throw new QrEmptyPayloadError();
  }

  const version = smallestVersion(bytes.length);
  const spec = VERSIONS[version - 1]!;
  const codewords = interleave(bitStream(bytes, version), spec);
  const size = 17 + version * 4;

  const reserved = blank(size, false);
  const modules = blank(size, false);
  drawFunctionPatterns(modules, reserved, version);
  drawCodewords(modules, reserved, codewords);

  // Every mask is tried; the standard's penalty rules pick the one least
  // likely to confuse a scanner (large same-colour blobs, finder look-alikes).
  let best: boolean[][] | null = null;
  let bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = modules.map((row) => [...row]);
    applyMask(candidate, reserved, mask);
    drawFormatBits(candidate, mask);
    const penalty = penaltyScore(candidate);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      best = candidate;
    }
  }
  return best!;
}

function smallestVersion(byteLength: number): number {
  for (let version = 1; version <= VERSIONS.length; version += 1) {
    if (byteLength <= byteCapacity(version)) {
      return version;
    }
  }
  throw new QrPayloadTooLongError(byteLength, byteCapacity(VERSIONS.length));
}

function dataCodewords(version: number): number {
  return VERSIONS[version - 1]!.groups.reduce(
    (total, [count, per]) => total + count * per,
    0,
  );
}

/** Mode indicator (4 bits) + character count (8 bits below version 10, 16 at
 *  and above) is the only overhead over the payload itself. */
function countBits(version: number): number {
  return version < 10 ? 8 : 16;
}

function byteCapacity(version: number): number {
  return Math.floor((dataCodewords(version) * 8 - 4 - countBits(version)) / 8);
}

/** Header + payload + terminator + padding, as data codewords. */
function bitStream(bytes: Uint8Array, version: number): number[] {
  const bits: number[] = [];
  const push = (value: number, width: number) => {
    for (let i = width - 1; i >= 0; i -= 1) {
      bits.push((value >>> i) & 1);
    }
  };

  push(0b0100, 4); // byte mode
  push(bytes.length, countBits(version));
  for (const byte of bytes) {
    push(byte, 8);
  }

  const capacityBits = dataCodewords(version) * 8;
  push(0, Math.min(4, capacityBits - bits.length)); // terminator
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const words: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let word = 0;
    for (let j = 0; j < 8; j += 1) {
      word = (word << 1) | bits[i + j]!;
    }
    words.push(word);
  }
  // The standard's alternating pad bytes fill whatever room is left.
  const PADDING = [0xec, 0x11];
  while (words.length < dataCodewords(version)) {
    words.push(PADDING[words.length % 2]!);
  }
  return words;
}

/** Split into blocks, append each block's Reed–Solomon codewords, then
 *  interleave — a scratched symbol then damages every block a little rather
 *  than one block fatally. */
function interleave(data: readonly number[], spec: VersionSpec): number[] {
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (const [count, per] of spec.groups) {
    for (let i = 0; i < count; i += 1) {
      const block = data.slice(offset, offset + per);
      offset += per;
      dataBlocks.push(block);
      ecBlocks.push(reedSolomon(block, spec.ecPerBlock));
    }
  }

  const result: number[] = [];
  const longest = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < longest; i += 1) {
    for (const block of dataBlocks) {
      if (i < block.length) {
        result.push(block[i]!);
      }
    }
  }
  for (let i = 0; i < spec.ecPerBlock; i += 1) {
    for (const block of ecBlocks) {
      result.push(block[i]!);
    }
  }
  return result;
}

// --- GF(256) arithmetic, primitive polynomial 0x11d -------------------------

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i += 1) {
    EXP[i] = EXP[i - 255]!;
  }
}

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a]! + LOG[b]!]!;
}

/** Generator polynomial (x−α⁰)(x−α¹)…, coefficients high degree first. */
function generatorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] = next[j]! ^ poly[j]!;
      next[j + 1] = next[j + 1]! ^ gfMul(poly[j]!, EXP[i]!);
    }
    poly = next;
  }
  return poly;
}

function reedSolomon(data: readonly number[], ecLength: number): number[] {
  const gen = generatorPoly(ecLength);
  const buffer = [...data, ...new Array<number>(ecLength).fill(0)];
  for (let i = 0; i < data.length; i += 1) {
    const factor = buffer[i]!;
    if (factor === 0) {
      continue;
    }
    for (let j = 0; j < gen.length; j += 1) {
      buffer[i + j] = buffer[i + j]! ^ gfMul(gen[j]!, factor);
    }
  }
  return buffer.slice(data.length);
}

// --- Matrix construction ----------------------------------------------------

function blank(size: number, value: boolean): boolean[][] {
  return Array.from({ length: size }, () => new Array<boolean>(size).fill(value));
}

function drawFunctionPatterns(
  modules: boolean[][],
  reserved: boolean[][],
  version: number,
): void {
  const size = modules.length;
  const set = (row: number, col: number, dark: boolean) => {
    modules[row]![col] = dark;
    reserved[row]![col] = true;
  };

  // Finders, with their one-module separator, at three corners.
  for (const [top, left] of [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ] as const) {
    for (let dr = -1; dr <= 7; dr += 1) {
      for (let dc = -1; dc <= 7; dc += 1) {
        const r = top + dr;
        const c = left + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) {
          continue;
        }
        const ring = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
        set(r, c, ring !== 2 && ring <= 3);
      }
    }
  }

  // Timing: the alternating row and column that let a scanner count modules.
  for (let i = 8; i < size - 8; i += 1) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  // Alignment patterns, except where they would sit on a finder.
  const centres = ALIGNMENT[version - 1]!;
  const last = centres[centres.length - 1];
  for (const r of centres) {
    for (const c of centres) {
      const onFinder =
        (r === 6 && c === 6) || (r === 6 && c === last) || (r === last && c === 6);
      if (onFinder) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr += 1) {
        for (let dc = -2; dc <= 2; dc += 1) {
          set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
        }
      }
    }
  }

  // Format areas are reserved now and written per-mask later; the module
  // below the top-left finder is always dark.
  for (let i = 0; i <= 8; i += 1) {
    reserved[8]![i] = true;
    reserved[i]![8] = true;
  }
  for (let i = 0; i < 8; i += 1) {
    reserved[8]![size - 1 - i] = true;
    reserved[size - 1 - i]![8] = true;
  }
  set(size - 8, 8, true);

  if (version >= 7) {
    drawVersionBits(set, size, version);
  }
}

/** Version information (two 6×3 blocks) — only versions 7 and up carry it. */
function drawVersionBits(
  set: (row: number, col: number, dark: boolean) => void,
  size: number,
  version: number,
): void {
  let rem = version;
  for (let i = 0; i < 12; i += 1) {
    rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  }
  const bits = (version << 12) | rem;
  for (let i = 0; i < 18; i += 1) {
    const dark = ((bits >>> i) & 1) !== 0;
    const a = size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    set(b, a, dark);
    set(a, b, dark);
  }
}

/** Format information: EC level (M) and mask, BCH-protected, written twice so
 *  a scanner can still read it with one corner damaged. */
function drawFormatBits(modules: boolean[][], mask: number): void {
  const size = modules.length;
  const data = mask; // level M is 0b00, so the 5-bit field is just the mask
  let rem = data;
  for (let i = 0; i < 10; i += 1) {
    rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  }
  const bits = (((data << 10) | rem) ^ 0x5412) & 0x7fff;
  const bit = (i: number) => ((bits >>> i) & 1) !== 0;

  for (let i = 0; i <= 5; i += 1) {
    modules[i]![8] = bit(i);
  }
  modules[7]![8] = bit(6);
  modules[8]![8] = bit(7);
  modules[8]![7] = bit(8);
  for (let i = 9; i < 15; i += 1) {
    modules[8]![14 - i] = bit(i);
  }
  for (let i = 0; i < 8; i += 1) {
    modules[8]![size - 1 - i] = bit(i);
  }
  for (let i = 8; i < 15; i += 1) {
    modules[size - 15 + i]![8] = bit(i);
  }
}

/** Zig-zag placement: two-module-wide columns walked bottom-up then top-down,
 *  right to left, skipping the vertical timing column. */
function drawCodewords(
  modules: boolean[][],
  reserved: boolean[][],
  codewords: readonly number[],
): void {
  const size = modules.length;
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right = 5;
    }
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const col = right - j;
        const upward = ((right + 1) & 2) === 0;
        const row = upward ? size - 1 - vert : vert;
        if (!reserved[row]![col] && i < codewords.length * 8) {
          modules[row]![col] = ((codewords[i >>> 3]! >>> (7 - (i & 7))) & 1) !== 0;
          i += 1;
        }
      }
    }
  }
}

function applyMask(modules: boolean[][], reserved: boolean[][], mask: number): void {
  const size = modules.length;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!reserved[row]![col] && maskBit(mask, row, col)) {
        modules[row]![col] = !modules[row]![col];
      }
    }
  }
}

function maskBit(mask: number, row: number, col: number): boolean {
  switch (mask) {
    case 0:
      return (row + col) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return col % 3 === 0;
    case 3:
      return (row + col) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    default:
      return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
  }
}

/** The standard's four penalty rules; lower is more scannable. */
function penaltyScore(modules: boolean[][]): number {
  const size = modules.length;
  let score = 0;

  const lines: boolean[][] = [];
  for (let i = 0; i < size; i += 1) {
    lines.push(modules[i]!);
    lines.push(modules.map((row) => row[i]!));
  }

  for (const line of lines) {
    // Rule 1: runs of five or more same-coloured modules.
    let run = 1;
    for (let i = 1; i < size; i += 1) {
      if (line[i] === line[i - 1]) {
        run += 1;
      } else {
        if (run >= 5) {
          score += 3 + (run - 5);
        }
        run = 1;
      }
    }
    if (run >= 5) {
      score += 3 + (run - 5);
    }

    // Rule 3: a finder-lookalike (dark:light:dark×3:light:dark) next to four
    // light modules — the pattern a scanner uses to locate the symbol.
    const bits = line.map((dark) => (dark ? "1" : "0")).join("");
    for (const pattern of ["10111010000", "00001011101"]) {
      let from = bits.indexOf(pattern);
      while (from !== -1) {
        score += 40;
        from = bits.indexOf(pattern, from + 1);
      }
    }
  }

  // Rule 2: every 2×2 block of one colour.
  for (let row = 0; row < size - 1; row += 1) {
    for (let col = 0; col < size - 1; col += 1) {
      const first = modules[row]![col];
      if (
        modules[row]![col + 1] === first &&
        modules[row + 1]![col] === first &&
        modules[row + 1]![col + 1] === first
      ) {
        score += 3;
      }
    }
  }

  // Rule 4: drift away from a 50/50 dark/light balance.
  const dark = modules.reduce(
    (total, row) => total + row.filter(Boolean).length,
    0,
  );
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

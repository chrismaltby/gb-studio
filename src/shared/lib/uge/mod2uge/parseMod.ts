import type {
  MODFile,
  MODSample,
  MODCell,
  MODPattern,
  EffectCode,
} from "./types";

const SAMPLE_COUNT = 31;
const ROWS_PER_PATTERN = 64;
const CHANNELS = 4;

/**
 * Parse a raw MOD binary buffer into a typed MODFile structure.
 * MOD format uses big-endian for multi-byte values.
 */
export function parseMod(buf: Buffer): MODFile {
  let offset = 0;

  const name = readFixedString(buf, offset, 20);
  offset += 20;

  const samples: MODSample[] = [];
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const sampleName = readFixedString(buf, offset, 22);
    offset += 22;
    const sampleLength = buf.readUInt16BE(offset);
    offset += 2;
    const finetune = buf.readUInt8(offset++);
    const volume = buf.readUInt8(offset++);
    const repeatPoint = buf.readUInt16BE(offset);
    offset += 2;
    const repeatLength = buf.readUInt16BE(offset);
    offset += 2;
    samples.push({
      name: sampleName,
      sampleLength,
      finetune,
      volume,
      repeatPoint,
      repeatLength,
    });
  }

  const songLen = buf.readUInt8(offset++);
  const _numPatternsMagic = buf.readUInt8(offset++); // unused
  const positions: number[] = [];
  for (let i = 0; i < 128; i++) {
    positions.push(buf.readUInt8(offset++));
  }
  const mkMagic = buf.subarray(offset, offset + 4).toString("ascii");
  offset += 4;

  let maxOrder = 0;
  for (const p of positions) {
    if (p > maxOrder) maxOrder = p;
  }

  const patternCount = maxOrder + 1;
  const patterns: MODPattern[] = [];

  for (let i = 0; i < patternCount; i++) {
    const pattern: MODPattern = [];
    for (let row = 0; row < ROWS_PER_PATTERN; row++) {
      const rowData: MODCell[] = [];
      for (let ch = 0; ch < CHANNELS; ch++) {
        rowData.push(parseModCell(buf, offset));
        offset += 4;
      }
      pattern.push(rowData);
    }
    patterns.push(pattern);
  }

  return { name, samples, songLen, positions, mkMagic, patterns };
}

/**
 * Convert 4 raw MOD bytes into a parsed MODCell.
 *
 * MOD pattern cell layout:
 *   byte[0]: IIIINNNN  (instrument high nibble | note period bits 8–11)
 *   byte[1]: NNNNNNNN  (note period bits 0–7)
 *   byte[2]: IIIIEEEE  (instrument low nibble | effect code)
 *   byte[3]: PPPPPPPP  (effect parameters)
 */
const parseModCell = (buf: Buffer, offset: number): MODCell => {
  const b0 = buf[offset];
  const b1 = buf[offset + 1];
  const b2 = buf[offset + 2];
  const b3 = buf[offset + 3];

  const note = ((b0 & 0x0f) << 8) | b1;
  const instrument = (b0 & 0xf0) | ((b2 & 0xf0) >> 4);
  const effectCode = toEffectCode(b2);
  const effectParams = b3;

  return {
    note,
    instrument,
    effect: { code: effectCode, params: effectParams },
  };
};

/**
 * Read a fixed-length ASCII string from the buffer, stopping at the first null byte.
 */
const readFixedString = (
  buf: Buffer,
  offset: number,
  length: number,
): string => {
  const end = buf.subarray(offset, offset + length).indexOf(0);
  return buf
    .subarray(offset, offset + (end === -1 ? length : end))
    .toString("ascii");
};

/**
 * Convert a MOD effect code to be strongly typed as EffectCode (0-F).
 */
const toEffectCode = (code: number): EffectCode => {
  return (code & 0x0f) as EffectCode;
};

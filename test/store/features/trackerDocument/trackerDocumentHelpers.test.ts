import {
  toAbsRow,
  fromAbsRow,
  resolveAbsRow,
  transposePatternCellNote,
  getTransposeNoteDelta,
  resolveUniqueTrackerCells,
  resolveTrackerCellFields,
} from "../../../../src/store/features/trackerDocument/trackerDocumentHelpers";
import { createPatternCell } from "../../../../src/shared/lib/uge/song";
import { SequenceItem } from "shared/lib/uge/types";

const TRACKER_PATTERN_LENGTH = 64;

describe("toAbsRow / fromAbsRow", () => {
  it("round-trips (sequenceId, rowId) through absolute row", () => {
    const absRow = toAbsRow(3, 10);
    const back = fromAbsRow(absRow);
    expect(back).toEqual({ sequenceId: 3, rowId: 10 });
  });

  it("toAbsRow(0, 0) === 0", () => {
    expect(toAbsRow(0, 0)).toBe(0);
  });

  it("toAbsRow(1, 0) === TRACKER_PATTERN_LENGTH", () => {
    expect(toAbsRow(1, 0)).toBe(TRACKER_PATTERN_LENGTH);
  });
});

describe("resolveAbsRow", () => {
  const sequence = [
    { splitPattern: false, channels: [0, 1, 2, 3] },
    { splitPattern: false, channels: [4, 5, 6, 7] },
    { splitPattern: false, channels: [8, 9, 10, 11] },
  ] as SequenceItem[];

  it("resolves a valid absRow to correct sequenceId, rowId, patternId", () => {
    const result = resolveAbsRow(sequence, toAbsRow(1, 10), 2);
    expect(result).toEqual({ sequenceId: 1, rowId: 10, patternId: 6 });
  });

  it("returns null when the sequence slot is out of bounds", () => {
    const result = resolveAbsRow(sequence, toAbsRow(5, 0), 0);
    expect(result).toBeNull();
  });
});

describe("transposePatternCellNote", () => {
  it("transposes note up by 1", () => {
    const cell = createPatternCell();
    cell.note = 12;
    transposePatternCellNote(cell, 1);
    expect(cell.note).toBe(13);
  });

  it("transposes note down by 1", () => {
    const cell = createPatternCell();
    cell.note = 12;
    transposePatternCellNote(cell, -1);
    expect(cell.note).toBe(11);
  });

  it("does not modify an undefined cell", () => {
    expect(() => transposePatternCellNote(undefined, 1)).not.toThrow();
  });

  it("does not modify a cell with a null note", () => {
    const cell = createPatternCell();
    cell.note = null;
    transposePatternCellNote(cell, 1);
    expect(cell.note).toBeNull();
  });
});

describe("getTransposeNoteDelta", () => {
  it("returns +1 for (up, note)", () => {
    expect(getTransposeNoteDelta("up", "note")).toBe(1);
  });

  it("returns -1 for (down, note)", () => {
    expect(getTransposeNoteDelta("down", "note")).toBe(-1);
  });

  it("returns +12 for (up, octave)", () => {
    expect(getTransposeNoteDelta("up", "octave")).toBe(12);
  });

  it("returns -12 for (down, octave)", () => {
    expect(getTransposeNoteDelta("down", "octave")).toBe(-12);
  });
});

// TRACKER constants used to build field indices
// TRACKER_ROW_SIZE = 16, TRACKER_CHANNEL_FIELDS = 4
const TRACKER_ROW_SIZE = 16;

describe("resolveUniqueTrackerCells", () => {
  it("deduplicates fields that map to the same cell", () => {
    // Fields 0,1,2,3 all belong to row 0, channel 0
    const cells = resolveUniqueTrackerCells(0, [0, 1, 2, 3]);
    expect(cells).toHaveLength(1);
    expect(cells[0]).toMatchObject({
      patternId: 0,
      rowIndex: 0,
      channelIndex: 0,
    });
  });

  it("returns separate entries for different rows", () => {
    const cells = resolveUniqueTrackerCells(0, [0, TRACKER_ROW_SIZE]);
    expect(cells).toHaveLength(2);
  });

  it("returns separate entries for different channels", () => {
    // field 0 = ch0 row0, field 4 = ch1 row0
    const cells = resolveUniqueTrackerCells(0, [0, 4]);
    expect(cells).toHaveLength(2);
    expect(cells[1]?.channelIndex).toBe(1);
  });
});

describe("resolveTrackerCellFields", () => {
  it("preserves per-field granularity", () => {
    // Fields 0 and 1 are row 0 ch 0, but different fieldIndex
    const cells = resolveTrackerCellFields(0, [0, 1]);
    expect(cells).toHaveLength(2);
    expect(cells[0]?.fieldIndex).toBe(0);
    expect(cells[1]?.fieldIndex).toBe(1);
  });

  it("deduplicates identical field positions", () => {
    const cells = resolveTrackerCellFields(0, [0, 0]);
    expect(cells).toHaveLength(1);
  });
});

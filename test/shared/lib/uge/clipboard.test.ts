import { createPatternMatrix } from "store/features/trackerDocument/trackerDocumentHelpers";
import {
  NO_CHANGE_ON_PASTE,
  parseClipboardOrigin,
  parsePatternToClipboard,
  parseClipboardToPattern,
} from "../../../../src/shared/lib/uge/clipboard";

describe("NO_CHANGE_ON_PASTE", () => {
  it("is a fixed sentinel value (-9)", () => {
    expect(NO_CHANGE_ON_PASTE).toBe(-9);
  });
});

describe("parseClipboardOrigin", () => {
  it("returns null when no origin header is present", () => {
    expect(
      parseClipboardOrigin("GBStudio hUGETracker Piano format\nline2"),
    ).toBeNull();
  });

  it("parses the origin row number from a header", () => {
    const clipboard =
      "GBStudio hUGETracker Piano format\nGBStudio origin: 42\nline3";
    expect(parseClipboardOrigin(clipboard)).toBe(42);
  });

  it("parses origin 0", () => {
    expect(parseClipboardOrigin("GBStudio origin: 0")).toBe(0);
  });
});

describe("parsePatternToClipboard / parseClipboardToPattern round-trip", () => {
  it("round-trips an empty pattern without losing structure", () => {
    const pattern = createPatternMatrix();
    const clipboard = parsePatternToClipboard(pattern);
    const parsed = parseClipboardToPattern(clipboard);
    // Every parsed row should have 4 channels
    for (const row of parsed) {
      expect(row).toHaveLength(4);
    }
  });

  it("round-trips a pattern with notes set in channel 0", () => {
    const pattern = createPatternMatrix();
    if (pattern[0]?.[0]) {
      pattern[0][0].note = 0; // C-3
      pattern[0][0].instrument = 0;
    }

    const clipboard = parsePatternToClipboard(pattern, 0);
    const parsed = parseClipboardToPattern(clipboard);

    expect(parsed[0]?.[0]?.note).toBe(0);
    expect(parsed[0]?.[0]?.instrument).toBe(0);
  });

  it("round-trips a null note back as null (not NO_CHANGE_ON_PASTE)", () => {
    // null note serialises as '...' which parses back as null, not NO_CHANGE_ON_PASTE
    const pattern = createPatternMatrix();
    const clipboard = parsePatternToClipboard(pattern, 0);
    const parsed = parseClipboardToPattern(clipboard);
    expect(parsed[0]?.[0]?.note).toBeNull();
  });

  it("round-trips a null instrument back as null", () => {
    const pattern = createPatternMatrix();
    const clipboard = parsePatternToClipboard(pattern, 0);
    const parsed = parseClipboardToPattern(clipboard);
    expect(parsed[0]?.[0]?.instrument).toBeNull();
  });

  it("embeds the origin row when originAbsRow and selectedCells are provided", () => {
    const pattern = createPatternMatrix();
    if (pattern[0]?.[0]) {
      pattern[0][0].note = 0;
    }
    const clipboard = parsePatternToClipboard(pattern, 0, [0], 10);
    expect(clipboard).toContain("GBStudio origin: 10");
    expect(parseClipboardOrigin(clipboard)).toBe(10);
  });

  it("includes only selected cells when selectedCells is provided", () => {
    const pattern = createPatternMatrix();
    if (pattern[2]?.[0]) {
      pattern[2][0].note = 24;
    }
    const clipboard = parsePatternToClipboard(pattern, 0, [2]);
    const parsed = parseClipboardToPattern(clipboard);
    // Only one row should contain data
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.[0]?.note).toBe(24);
  });

  it("fills gaps in selected cells with null note cells", () => {
    const pattern = createPatternMatrix();
    if (pattern[0]?.[0]) {
      pattern[0][0].note = 0;
    }
    if (pattern[2]?.[0]) {
      pattern[2][0].note = 12;
    }
    // select rows 0 and 2, but row 1 is not selected
    const clipboard = parsePatternToClipboard(pattern, 0, [0, 2]);
    const parsed = parseClipboardToPattern(clipboard);
    // 3 rows: row 0 (note 0), row 1 (empty gap), row 2 (note 12)
    expect(parsed).toHaveLength(3);
    expect(parsed[0]?.[0]?.note).toBe(0);
    expect(parsed[1]?.[0]?.note).toBeNull(); // empty cell parses back as null
    expect(parsed[2]?.[0]?.note).toBe(12);
  });
});

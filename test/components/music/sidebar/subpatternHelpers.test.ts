import {
  createSubPatternCell,
  createSubPattern,
} from "../../../../src/shared/lib/uge/song";
import {
  applySubpatternCellChanges,
  formatSubpatternFlow,
  formatSubpatternPitch,
  getSubpatternFlowType,
  moveSubpatternRow,
  isSubpatternRowEmpty,
  toSubpatternNote,
  toSubpatternJump,
  getSubpatternJumpTarget,
  isValidSubpatternEffectCode,
  getVisibleSubpatternRows,
  offsetToStoredPitch,
  doubleSubpattern,
  halfSubpattern,
  TRACKER_SUBPATTERN_VISIBLE_LENGTH,
} from "../../../../src/components/music/form/subpattern/helpers";

test("Should format null and positive subpattern pitch values", () => {
  expect(formatSubpatternPitch(null)).toBe("Base");
  expect(formatSubpatternPitch(43)).toBe("+7 st");
});

test("Should map stored jump values to continue and jump states", () => {
  expect(getSubpatternFlowType(null, 5)).toBe("continue");
  expect(formatSubpatternFlow(1, 5)).toBe("Jump to 00");
  expect(getSubpatternFlowType(6, 5)).toBe("jump");
  expect(formatSubpatternFlow(6, 5)).toBe("Jump to 05");
});

test("Should initialize effect param when setting effect code zero", () => {
  const subpattern = [createSubPatternCell()];
  const nextSubpattern = applySubpatternCellChanges(subpattern, 0, {
    effectCode: 0,
  });

  expect(nextSubpattern[0]?.effectCode).toBe(0);
  expect(nextSubpattern[0]?.effectParam).toBe(0);
});

test("Should move a visible subpattern row without dropping data", () => {
  const subpattern = [createSubPatternCell(), createSubPatternCell()];
  if (subpattern[0]) {
    subpattern[0].note = 40;
  }
  if (subpattern[1]) {
    subpattern[1].note = 45;
  }

  const nextSubpattern = moveSubpatternRow(subpattern, 0, 1);

  expect(nextSubpattern[0]?.note).toBe(45);
  expect(nextSubpattern[1]?.note).toBe(40);
});

test("isSubpatternRowEmpty returns true for a blank cell", () => {
  const cell = createSubPatternCell();
  expect(isSubpatternRowEmpty(cell)).toBe(true);
});

test("isSubpatternRowEmpty returns false when note is non-default", () => {
  const cell = createSubPatternCell();
  cell.note = 40;
  expect(isSubpatternRowEmpty(cell)).toBe(false);
});

test("toSubpatternNote converts a semitone offset to a stored note value", () => {
  expect(toSubpatternNote(0)).toBe(36); // base note is 36
  expect(toSubpatternNote(7)).toBe(43);
  expect(toSubpatternNote(-1)).toBe(35);
});

test("toSubpatternNote returns null for null input", () => {
  expect(toSubpatternNote(null)).toBeNull();
});

test("toSubpatternNote clamps offsets outside the valid range", () => {
  expect(toSubpatternNote(100)).toBe(36 + 35); // max offset is +35
  expect(toSubpatternNote(-100)).toBe(36 - 36); // min offset is -36
});

test("getSubpatternJumpTarget returns null for null or 0 jump", () => {
  expect(getSubpatternJumpTarget(null)).toBeNull();
  expect(getSubpatternJumpTarget(0)).toBeNull();
});

test("getSubpatternJumpTarget converts 1-based stored value to 0-based target", () => {
  expect(getSubpatternJumpTarget(1)).toBe(0);
  expect(getSubpatternJumpTarget(6)).toBe(5);
});

test("toSubpatternJump converts a 0-based target to a 1-based stored value", () => {
  expect(toSubpatternJump(0)).toBe(1);
  expect(toSubpatternJump(5)).toBe(6);
});

test("toSubpatternJump returns null for null input", () => {
  expect(toSubpatternJump(null)).toBeNull();
});

test("isValidSubpatternEffectCode rejects codes not in the allowed list", () => {
  expect(isValidSubpatternEffectCode(3)).toBe(false);
  expect(isValidSubpatternEffectCode(null)).toBe(false);
  expect(isValidSubpatternEffectCode(undefined)).toBe(false);
});

test("isValidSubpatternEffectCode accepts codes in the allowed list", () => {
  expect(isValidSubpatternEffectCode(0)).toBe(true);
  expect(isValidSubpatternEffectCode(15)).toBe(true);
});

test("getVisibleSubpatternRows pads short subpatterns with empty cells", () => {
  const short = [createSubPatternCell()];
  const rows = getVisibleSubpatternRows(short);
  expect(rows).toHaveLength(TRACKER_SUBPATTERN_VISIBLE_LENGTH);
  expect(rows[1]?.note).toBeNull();
});

test("offsetToStoredPitch adds the base note (36) to the offset", () => {
  expect(offsetToStoredPitch(0)).toBe(36);
  expect(offsetToStoredPitch(7)).toBe(43);
  expect(offsetToStoredPitch(-5)).toBe(31);
});

test("applySubpatternCellChanges does not set effectParam when it already has a value", () => {
  const subpattern = [createSubPatternCell()];
  if (subpattern[0]) {
    subpattern[0].effectParam = 10;
  }
  const next = applySubpatternCellChanges(subpattern, 0, { effectCode: 5 });
  if (next[0]) {
    expect(next[0].effectParam).toBe(10);
  }
});

test("doubleSubpattern doubles the spacing between rows", () => {
  const sub = createSubPattern();
  if (sub[0]) {
    sub[0].note = 40;
  }
  if (sub[1]) {
    sub[1].note = 45;
  }
  const doubled = doubleSubpattern(sub);
  expect(doubled[0]?.note).toBe(40);
  expect(doubled[1]?.note).toBeNull(); // gap
  expect(doubled[2]?.note).toBe(45);
});

test("halfSubpattern halves the number of active rows", () => {
  const sub = createSubPattern();
  if (sub[0]) {
    sub[0].note = 40;
  }
  if (sub[2]) {
    sub[2].note = 45;
  }
  const halved = halfSubpattern(sub);
  expect(halved[0]?.note).toBe(40);
  expect(halved[1]?.note).toBe(45);
});

test("doubleSubpattern adjusts jump targets", () => {
  const sub = createSubPattern();
  // jump=2 means target row 1 (0-based); after doubling, target becomes row 2 (0-based) → stored as 3
  if (sub[0]) {
    sub[0].jump = 2;
  }
  const doubled = doubleSubpattern(sub);
  expect(doubled[0]?.jump).toBe(3);
});

/* eslint-disable camelcase */
const {
  is16BitCType,
  minForCType,
  maxForCType,
  clampToCType,
  precompileEngineFields,
} = require("../../src/lib/helpers/engineFields");

test("Should be able to determine if CType is 16-bit", () => {
  expect(is16BitCType("WORD")).toBe(true);
  expect(is16BitCType("UWORD")).toBe(true);
  expect(is16BitCType("BYTE")).toBe(false);
  expect(is16BitCType("UBYTE")).toBe(false);
});

test("Should be able to get minimum value for CType", () => {
  expect(minForCType("WORD")).toBe(-32768);
  expect(minForCType("BYTE")).toBe(-128);
  expect(minForCType("UWORD")).toBe(0);
  expect(minForCType("UBYTE")).toBe(0);
});

test("Should be able to get maximum value for CType", () => {
  expect(maxForCType("WORD")).toBe(32767);
  expect(maxForCType("BYTE")).toBe(127);
  expect(maxForCType("UWORD")).toBe(65535);
  expect(maxForCType("UBYTE")).toBe(255);
});

test("Should be able to clamp value within cType", () => {
  expect(clampToCType(434234234, "WORD")).toBe(32767);
  expect(clampToCType(434234234, "BYTE")).toBe(127);
  expect(clampToCType(434234234, "UWORD")).toBe(65535);
  expect(clampToCType(434234234, "UBYTE")).toBe(255);

  expect(clampToCType(-434234234, "WORD")).toBe(-32768);
  expect(clampToCType(-434234234, "BYTE")).toBe(-128);
  expect(clampToCType(-434234234, "UWORD")).toBe(0);
  expect(clampToCType(-434234234, "UBYTE")).toBe(0);

  expect(clampToCType(50, "WORD")).toBe(50);
  expect(clampToCType(50, "BYTE")).toBe(50);
  expect(clampToCType(50, "UWORD")).toBe(50);
  expect(clampToCType(50, "UBYTE")).toBe(50);

  expect(clampToCType(500, "WORD")).toBe(500);
  expect(clampToCType(500, "BYTE")).toBe(127);
  expect(clampToCType(500, "UWORD")).toBe(500);
  expect(clampToCType(500, "UBYTE")).toBe(255);
});

test("Should be able precompile memory offsets for engine fields", () => {
  const field1 = {
    key: "test_field_1",
    label: "Test Field 1",
    group: "Global",
    type: "number",
    cType: "UWORD",
    defaultValue: 1,
  };
  const field2 = {
    key: "test_field_2",
    label: "Test Field 2",
    group: "Global",
    type: "number",
    cType: "UBYTE",
    defaultValue: 1,
  };
  const field3 = {
    key: "test_field_3",
    label: "Test Field 3",
    group: "Global",
    type: "number",
    cType: "UBYTE",
    defaultValue: 1,
  };
  expect(precompileEngineFields([field1, field2, field3])).toEqual({
    test_field_1: field1,
    test_field_2: field2,
    test_field_3: field3,
  });
});

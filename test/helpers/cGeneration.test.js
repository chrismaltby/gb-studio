import {
  cIntArray,
  cIntArrayExternDeclaration,
  C_NAME_INVALID,
  C_DATA_EMPTY,
  C_DATA_INVALID
} from "../../src/lib/helpers/cGeneration";

test("should generate an int array", () => {
  const output = cIntArray("hello", [0]);
  expect(output).toBe(`const unsigned char hello[] = {\n0x00\n};`);
});

test("should fail if c name is missing", () => {
  expect(() => cIntArray(undefined, [0])).toThrow(C_NAME_INVALID);
});

test("should fail if c name is invalid", () => {
  expect(() => cIntArray("9", [0])).toThrow(C_NAME_INVALID);
  expect(() => cIntArray("-", [0])).toThrow(C_NAME_INVALID);
  expect(() => cIntArray("-", [0])).toThrow(C_NAME_INVALID);
});

test("should work if c name is valid", () => {
  expect(cIntArray("abC", [0])).toBeDefined();
  expect(cIntArray("ABc", [0])).toBeDefined();
  expect(cIntArray("_dEf", [0])).toBeDefined();
});

test("should fail if data is empty", () => {
  expect(() => cIntArray("world", [])).toThrow(C_DATA_EMPTY);
});

test("should fail if data isn't array", () => {
  expect(() => cIntArray("world", 1)).toThrow(C_DATA_INVALID);
});

test("should generate an int array extern declaration", () => {
  expect(cIntArrayExternDeclaration("world")).toBe(
    `extern const unsigned char world[];`
  );
});

test("should fail making declaration if c name is invalid", () => {
  expect(() => cIntArrayExternDeclaration("9")).toThrow(C_NAME_INVALID);
  expect(() => cIntArrayExternDeclaration("-")).toThrow(C_NAME_INVALID);
  expect(() => cIntArrayExternDeclaration("-")).toThrow(C_NAME_INVALID);
});

import { normalizeVariableId } from "shared/lib/variables/variableIds";

test("normalizes numeric variable IDs without losing precision", () => {
  expect(normalizeVariableId("00042")).toBe("42");
  expect(normalizeVariableId("000")).toBe("0");
  expect(normalizeVariableId("000900719925474099312345")).toBe(
    "900719925474099312345",
  );
});

test("does not change scoped or UUID variable IDs", () => {
  expect(normalizeVariableId("L0")).toBe("L0");
  expect(normalizeVariableId("abcdef01-2345-6789-abcd-ef0123456789")).toBe(
    "abcdef01-2345-6789-abcd-ef0123456789",
  );
});

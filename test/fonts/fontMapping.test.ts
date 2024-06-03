import { encodeString } from "shared/lib/helpers/fonts";

test("should encode newlines as \\012", () => {
  expect(encodeString("Hello\nWorld")).toBe("Hello\\012World");
});

test("should encode carriage return as \\015", () => {
  expect(encodeString("Hello\rWorld")).toBe("Hello\\015World");
});

test("should encode newlines as \\012 even when backslash and 'n' are remapped", () => {
  expect(
    encodeString("Hello\nWorld", {
      "\\": 42,
      n: 43,
    })
  ).toBe("Hello\\012World");
});

test("should remap ascii printable characters as chars", () => {
  expect(
    encodeString("Hello\nWorld", {
      H: 74,
    })
  ).toBe("Jello\\012World");
});

test("should remap ascii non-printable characters as octal", () => {
  expect(
    encodeString("Hello\nWorld", {
      H: 17,
    })
  ).toBe("\\021ello\\012World");
});

test("should remap characters beyond ascii range as octal", () => {
  expect(
    encodeString("Hello\nWorld", {
      H: 128,
      e: 126,
      W: 241,
    })
  ).toBe("\\200~llo\\012\\361orld");
});

test("should remap quote characters to octal", () => {
  expect(encodeString('Hello "World"')).toBe("Hello \\042World\\042");
});

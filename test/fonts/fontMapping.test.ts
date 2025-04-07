import { encodeString, encodeChar } from "shared/lib/helpers/fonts";

describe("encodeString", () => {
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
      }),
    ).toBe("Hello\\012World");
  });

  test("should remap ascii printable characters as chars", () => {
    expect(
      encodeString("Hello\nWorld", {
        H: 74,
      }),
    ).toBe("Jello\\012World");
  });

  test("should remap ascii non-printable characters as octal", () => {
    expect(
      encodeString("Hello\nWorld", {
        H: 17,
      }),
    ).toBe("\\021ello\\012World");
  });

  test("should remap characters beyond ascii range as octal", () => {
    expect(
      encodeString("Hello\nWorld", {
        H: 128,
        e: 126,
        W: 241,
      }),
    ).toBe("\\200~llo\\012\\361orld");
  });

  test("should remap quote characters to octal", () => {
    expect(encodeString('Hello "World"')).toBe("Hello \\042World\\042");
  });

  test("should correctly encode a surrogate pair emoji as octal when mapped", () => {
    expect(
      encodeString("Hello 😊 World", {
        "😊": 200,
      }),
    ).toBe("Hello \\310 World");
  });

  test("should correctly map a long string key like 'euro'", () => {
    expect(
      encodeString("This is euro coin", {
        euro: 162,
      }),
    ).toBe("This is \\242 coin");
  });

  test("should prefer longer mapping key over partial match", () => {
    expect(
      encodeString("euro", {
        e: 101,
        eu: 102,
        euro: 103,
      }),
    ).toBe("g"); // 103 = g
  });
});

describe("encodeChar", () => {
  test("should return code and length for basic ASCII character", () => {
    const result = encodeChar("A");
    expect(result).toEqual({ code: 65, length: 1 });
  });

  test("should return code and length for emoji character", () => {
    const code = "😊".codePointAt(0) ?? 0;
    const result = encodeChar("😊");
    expect(result).toEqual({ code, length: 2 });
  });

  test("should return mapped code for single-character mapping", () => {
    const result = encodeChar("a", { a: 100 });
    expect(result).toEqual({ code: 100, length: 1 });
  });

  test("should return mapped code for emoji character", () => {
    const result = encodeChar("😊", { "😊": 200 });
    expect(result).toEqual({ code: 200, length: 2 });
  });

  test("should return mapped code for long string key", () => {
    const result = encodeChar("euro coin", { euro: 162 });
    expect(result).toEqual({ code: 162, length: 4 });
  });

  test("should prefer longest matching key", () => {
    const result = encodeChar("euro", {
      e: 101,
      eu: 102,
      euro: 103,
    });
    expect(result).toEqual({ code: 103, length: 4 });
  });

  test("should fallback to first character if no mapping exists", () => {
    const code = "x".codePointAt(0) ?? 0;
    const result = encodeChar("xyz");
    expect(result).toEqual({ code, length: 1 });
  });

  test("should fallback safely if input is empty string", () => {
    const result = encodeChar("");
    expect(result).toEqual({ code: 0, length: 1 });
  });
});

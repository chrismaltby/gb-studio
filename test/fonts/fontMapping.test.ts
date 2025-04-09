import { encodeString, resolveMapping } from "shared/lib/helpers/fonts";

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
        H: 190,
      }),
    ).toBe("\\276ello\\012World");
  });

  test("should remap ascii non-printable characters below 32 as escaped octal", () => {
    expect(
      encodeString("Hello\nWorld", {
        H: 17,
      }),
    ).toBe("\\005\\021ello\\012World");
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

  test("should output multiple codes for emoji when mapped to array", () => {
    expect(
      encodeString("Hello 😊 World", {
        "😊": [128, 129],
      }),
    ).toBe("Hello \\200\\201 World");
  });

  test("should output multiple codes for long string key mapped to array", () => {
    expect(
      encodeString("euro", {
        euro: [162, 163],
      }),
    ).toBe("\\242\\243");
  });

  test("should handle a mix of single and multi-code mappings", () => {
    expect(
      encodeString("aMULTIb", {
        a: 65,
        MULTI: [70, 71, 72],
        b: 98,
      }),
    ).toBe("AFGHb");
  });
});

describe("resolveMapping", () => {
  test("should return codes and length for basic ASCII character", () => {
    const result = resolveMapping("A");
    expect(result).toEqual({ codes: [65], isMapped: false, length: 1 });
  });

  test("should return codes and length for emoji character", () => {
    const code = "😊".codePointAt(0) ?? 0;
    const result = resolveMapping("😊");
    expect(result).toEqual({ codes: [code], isMapped: false, length: 2 });
  });

  test("should return mapped code array for single-character mapping", () => {
    const result = resolveMapping("a", { a: 100 });
    expect(result).toEqual({ codes: [100], isMapped: true, length: 1 });
  });

  test("should return mapped code array for emoji character", () => {
    const result = resolveMapping("😊", { "😊": 200 });
    expect(result).toEqual({ codes: [200], isMapped: true, length: 2 });
  });

  test("should return mapped code array for long string key", () => {
    const result = resolveMapping("euro coin", { euro: 162 });
    expect(result).toEqual({ codes: [162], isMapped: true, length: 4 });
  });

  test("should prefer longest matching key", () => {
    const result = resolveMapping("euro", {
      e: 101,
      eu: 102,
      euro: 103,
    });
    expect(result).toEqual({ codes: [103], isMapped: true, length: 4 });
  });

  test("should fallback to first character if no mapping exists", () => {
    const code = "x".codePointAt(0) ?? 0;
    const result = resolveMapping("xyz");
    expect(result).toEqual({ codes: [code], isMapped: false, length: 1 });
  });

  test("should fallback safely if input is empty string", () => {
    const result = resolveMapping("");
    expect(result).toEqual({ codes: [0], isMapped: false, length: 1 });
  });

  test("should return multiple codes for emoji when mapped to array", () => {
    const result = resolveMapping("😊", {
      "😊": [200, 201],
    });
    expect(result).toEqual({ codes: [200, 201], isMapped: true, length: 2 });
  });

  test("should return multiple codes for long key when mapped to array", () => {
    const result = resolveMapping("MULTI test", {
      MULTI: [38, 39, 51],
    });
    expect(result).toEqual({ codes: [38, 39, 51], isMapped: true, length: 5 });
  });

  test("should still return single code if mapped to number", () => {
    const result = resolveMapping("a", {
      a: 70,
    });
    expect(result).toEqual({ codes: [70], isMapped: true, length: 1 });
  });
});

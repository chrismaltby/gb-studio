import { Token } from "shared/lib/compiler/lexText";
import {
  encodeString,
  FontData,
  lexTextWithMapping,
  resolveMapping,
} from "shared/lib/helpers/fonts";

const makeFont = (mapping: Record<string, number | number[]>): FontData =>
  ({
    mapping,
  }) as FontData;

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

  test("should remap ascii control characters as octal", () => {
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
    expect(result).toEqual({ codes: [65], length: 1 });
  });

  test("should return codes and length for emoji character", () => {
    const code = "😊".codePointAt(0) ?? 0;
    const result = resolveMapping("😊");
    expect(result).toEqual({ codes: [code], length: 2 });
  });

  test("should return mapped code array for single-character mapping", () => {
    const result = resolveMapping("a", { a: 100 });
    expect(result).toEqual({ codes: [100], length: 1 });
  });

  test("should return mapped code array for emoji character", () => {
    const result = resolveMapping("😊", { "😊": 200 });
    expect(result).toEqual({ codes: [200], length: 2 });
  });

  test("should return mapped code array for long string key", () => {
    const result = resolveMapping("euro coin", { euro: 162 });
    expect(result).toEqual({ codes: [162], length: 4 });
  });

  test("should prefer longest matching key", () => {
    const result = resolveMapping("euro", {
      e: 101,
      eu: 102,
      euro: 103,
    });
    expect(result).toEqual({ codes: [103], length: 4 });
  });

  test("should fallback to first character if no mapping exists", () => {
    const code = "x".codePointAt(0) ?? 0;
    const result = resolveMapping("xyz");
    expect(result).toEqual({ codes: [code], length: 1 });
  });

  test("should fallback safely if input is empty string", () => {
    const result = resolveMapping("");
    expect(result).toEqual({ codes: [0], length: 1 });
  });

  test("should return multiple codes for emoji when mapped to array", () => {
    const result = resolveMapping("😊", {
      "😊": [200, 201],
    });
    expect(result).toEqual({ codes: [200, 201], length: 2 });
  });

  test("should return multiple codes for long key when mapped to array", () => {
    const result = resolveMapping("MULTI test", {
      MULTI: [38, 39, 51],
    });
    expect(result).toEqual({ codes: [38, 39, 51], length: 5 });
  });

  test("should still return single code if mapped to number", () => {
    const result = resolveMapping("a", {
      a: 70,
    });
    expect(result).toEqual({ codes: [70], length: 1 });
  });
});

describe("lexTextWithMapping", () => {
  const monoFont = makeFont({ H: 74, e: 101 });
  const emojiFont = makeFont({ "😊": [200, 201] });

  const fontsData = {
    mono: monoFont,
    emoji: emojiFont,
  };

  test("should apply mapping to a single text token", () => {
    const tokens = lexTextWithMapping("Hello", fontsData, "mono");

    const textTokens = tokens.filter((t) => t.type === "text") as Extract<
      Token,
      { type: "text" }
    >[];

    expect(textTokens.map((t) => t.value).join("")).toBe("Jello");
  });

  test("should switch font when font token is encountered", () => {
    const tokens = lexTextWithMapping("Hi!F:emoji!😊", fontsData, "mono");

    const joined = tokens
      .map((t) => (t.type === "text" ? t.value : ""))
      .join("");

    // mono: H → J (74)
    // emoji: 😊 → \310\311 (200, 201)
    expect(joined).toEqual("Ji\\310\\311");
  });

  test("should preserve font token in output", () => {
    const tokens = lexTextWithMapping("!F:emoji!Hello", fontsData, "mono");
    const fontToken = tokens.find((t) => t.type === "font");
    const textToken = tokens.find((t) => t.type === "text");
    expect(fontToken).toBeTruthy();
    expect(fontToken?.fontId).toBe("emoji");
    expect(textToken).toBeTruthy();
    expect(textToken?.value).toEqual("Hello");
  });

  test("should fallback to original font if font token is unknown", () => {
    const tokens = lexTextWithMapping(
      "!F:doesnotexist!Hello",
      fontsData,
      "mono",
    );

    const textToken = tokens.find((t) => t.type === "text");

    expect(textToken).toBeTruthy();
    expect(textToken?.value).toEqual("Jello"); // mapped using mono
  });

  test("should use previewValue if preferPreviewValue is true", () => {
    const tokens = lexTextWithMapping(
      "A",
      {
        mono: makeFont({
          A: 2,
        }),
      },
      "mono",
      true,
    );
    const textToken = tokens.find((t) => t.type === "text");
    expect(textToken).toBeTruthy();
    expect(textToken?.value).toEqual("\\002");
    expect(textToken?.previewValue).toEqual("");
  });
});

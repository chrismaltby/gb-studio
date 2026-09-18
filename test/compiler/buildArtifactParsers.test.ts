import { readFileSync } from "fs";
import Path from "path";
import {
  capacityForCartType,
  classifyAreaName,
  parseObjectAreaSizes,
} from "lib/compiler/buildArtifactParsers";

describe("build artifact parsers", () => {
  test("reads hexadecimal object area sizes and sums repeated areas", () => {
    expect(
      parseObjectAreaSizes(
        [
          "A _HOME size 10 flags 0 addr 0",
          "A _HOME size 20 flags 0 addr 0",
          "A _DATA size 59C flags 0 addr 0",
          "A _CODE size 0 flags 0 addr 0",
        ].join("\n"),
      ),
    ).toEqual({ _HOME: 0x30, _DATA: 0x59c });
  });

  test("accepts a valid object containing only zero-sized areas", () => {
    expect(
      parseObjectAreaSizes(
        [
          "XL4",
          "M empty",
          "A _CODE size 0 flags 0 addr 0",
          "A _DATA size 0 flags 0 addr 0",
        ].join("\n"),
      ),
    ).toEqual({});
  });

  test("rejects an artifact containing no area records", () => {
    expect(() => parseObjectAreaSizes("not an SDCC object file")).toThrow(
      "Build artifact contains no area records",
    );
  });

  test("rejects malformed area records", () => {
    expect(() => parseObjectAreaSizes("A _CODE bytes 10 flags 0")).toThrow(
      'Invalid object area: "A _CODE bytes 10 flags 0"',
    );
  });

  test.each([
    ["_CODE", "bank0"],
    ["_HOME", "bank0"],
    ["_HEADER0", "bank0"],
    ["_CODE_0", "bank0"],
    ["_CODE_", "other"],
    ["_CODE_255", "bankedRom"],
    ["_DATA", "wram"],
    ["_BSS", "wram"],
    ["_VRAM", "other"],
  ] as const)("classifies object area %s as %s", (name, expected) => {
    expect(classifyAreaName(name)).toBe(expected);
  });

  test("uses the cartridge's switchable bank count for capacity", () => {
    expect(capacityForCartType("mbc3")).toEqual({
      bank0: 16 * 1024,
      wram: 8 * 1024,
      bankedRom: 127 * 16 * 1024,
    });
    expect(capacityForCartType("mbc5").bankedRom).toBe(255 * 16 * 1024);
  });

  test("parses an object captured from the bundled GBDK toolchain", () => {
    const source = readFileSync(
      Path.join(__dirname, "_files/build-usage-example.o"),
      "utf8",
    );

    expect(parseObjectAreaSizes(source)).toEqual({
      _DATA: 0x1,
      _CODE_3: 0x402,
    });
  });
});

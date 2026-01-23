import { PNG } from "pngjs";
import { writeFile } from "fs-extra";
import { readFileToPalettes } from "lib/tiles/readFileToPalettes";
import {
  IndexedImage,
  pixelDataToIndexedImage,
} from "shared/lib/tiles/indexedImage";
import {
  extractTilePaletteWithHint,
  compressPalettes,
  compressSparsePalettes,
  SparseHexPalette,
  setUIPalette,
  HexPalette,
  fillVariablePalette,
  fillVariablePalettes,
} from "shared/lib/tiles/autoColor";
import { tileDataIndexFn } from "shared/lib/tiles/tileData";
import chroma from "chroma-js";

test("Should reduce the palettes to a maximum of 8", async () => {
  const filename = `${__dirname}/_files/test/color_town.png`;
  const paletteData = await readFileToPalettes(filename, "default", [
    "ffffff",
    "aaaaaa",
    "555555",
    "000000",
  ]);
  writeIndexedImagePNG(
    `${__dirname}/_tmp/color_town_tiles.png`,
    paletteData.indexedImage,
  );
});

test("Should reduce the palettes to a maximum of 8", async () => {
  const filename = `${__dirname}/_files/test/parallax_color.png`;
  const paletteData = await readFileToPalettes(filename, "default", [
    "ffffff",
    "aaaaaa",
    "555555",
    "000000",
  ]);
  writeIndexedImagePNG(
    `${__dirname}/_tmp/parallax_color_tiles.png`,
    paletteData.indexedImage,
  );
});

const writeIndexedImagePNG = async (
  filename: string,
  img: IndexedImage,
): Promise<void> => {
  const png = new PNG({
    width: img.width,
    height: img.height,
  });
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const dataIdx = img.data[idx / 4];

      if (dataIdx === 3) {
        png.data[idx] = 7;
        png.data[idx + 1] = 24;
        png.data[idx + 2] = 33;
      } else if (dataIdx === 2) {
        png.data[idx] = 48;
        png.data[idx + 1] = 104;
        png.data[idx + 2] = 80;
      } else if (dataIdx === 1) {
        png.data[idx] = 134;
        png.data[idx + 1] = 192;
        png.data[idx + 2] = 108;
      } else {
        png.data[idx] = 224;
        png.data[idx + 1] = 248;
        png.data[idx + 2] = 207;
      }

      png.data[idx + 3] = 255; // Alpha
    }
  }
  const options = { colorType: 6 } as const;
  const buffer = PNG.sync.write(png, options);
  await writeFile(filename, buffer);
};

describe("extractTilePaletteWithHint", () => {
  test("should extract palette with hint for color correction being both on and off", () => {
    const pixels = new Uint8ClampedArray(8 * 8 * 4);
    const dmgPixels = new Uint8ClampedArray(8 * 8 * 4);

    pixels[0] = 255;
    pixels[1] = 255;
    pixels[2] = 255;
    pixels[3] = 255;

    dmgPixels[0] = 170;
    dmgPixels[1] = 170;
    dmgPixels[2] = 170;
    dmgPixels[3] = 255;

    const width = 8;
    const height = 8;
    const tileX = 0;
    const tileY = 0;

    const setPixel = (
      x: number,
      y: number,
      r: number,
      g: number,
      b: number,
    ) => {
      const index = (y * width + x) * 4;
      pixels[index] = r;
      pixels[index + 1] = g;
      pixels[index + 2] = b;
      pixels[index + 3] = 255;
    };
    const setDmgPixel = (
      x: number,
      y: number,
      r: number,
      g: number,
      b: number,
    ) => {
      const index = (y * width + x) * 4;
      dmgPixels[index] = r;
      dmgPixels[index + 1] = g;
      dmgPixels[index + 2] = b;
      dmgPixels[index + 3] = 255;
    };

    setPixel(0, 0, 255, 0, 0);
    setPixel(1, 0, 0, 255, 0);
    setPixel(2, 0, 147, 148, 254);
    setPixel(3, 0, 255, 0, 255);

    setDmgPixel(0, 0, 0, 0, 0);
    setDmgPixel(1, 0, 66, 66, 66);
    setDmgPixel(2, 0, 131, 131, 131);
    setDmgPixel(3, 0, 206, 206, 206);

    const dmgIndexed = pixelDataToIndexedImage(
      width,
      height,
      dmgPixels,
      tileDataIndexFn,
    );

    const rawPalette = extractTilePaletteWithHint(
      pixels,
      width,
      tileX,
      tileY,
      dmgIndexed,
      "none",
    );
    expect(rawPalette).toEqual(["ff00ff", "9394fe", "00ff00", "ff0000"]);

    const correctedPalette = extractTilePaletteWithHint(
      pixels,
      width,
      tileX,
      tileY,
      dmgIndexed,
      "default",
    );
    expect(correctedPalette).toEqual(["ff00ff", "9c7bff", "00ff00", "ff0000"]);
  });

  test("should extract palette with hint", () => {
    const pixels = new Uint8ClampedArray(8 * 8 * 4);
    const dmgPixels = new Uint8ClampedArray(8 * 8 * 4);

    pixels[0] = 255;
    pixels[1] = 255;
    pixels[2] = 255;
    pixels[3] = 255;

    dmgPixels[0] = 170;
    dmgPixels[1] = 170;
    dmgPixels[2] = 170;
    dmgPixels[3] = 255;

    const width = 8;
    const height = 8;
    const tileX = 0;
    const tileY = 0;

    const setPixel = (
      x: number,
      y: number,
      r: number,
      g: number,
      b: number,
    ) => {
      const index = (y * width + x) * 4;
      pixels[index] = r;
      pixels[index + 1] = g;
      pixels[index + 2] = b;
      pixels[index + 3] = 255;
    };
    const setDmgPixel = (
      x: number,
      y: number,
      r: number,
      g: number,
      b: number,
    ) => {
      const index = (y * width + x) * 4;
      dmgPixels[index] = r;
      dmgPixels[index + 1] = g;
      dmgPixels[index + 2] = b;
      dmgPixels[index + 3] = 255;
    };

    setPixel(0, 0, 255, 0, 0);
    setPixel(1, 0, 0, 255, 0);
    setPixel(2, 0, 147, 148, 254);
    setPixel(3, 0, 255, 0, 255);

    setDmgPixel(0, 0, 0, 0, 0);
    setDmgPixel(1, 0, 66, 66, 66);
    setDmgPixel(2, 0, 131, 131, 131);
    setDmgPixel(3, 0, 206, 206, 206);

    const dmgIndexed = pixelDataToIndexedImage(
      width,
      height,
      dmgPixels,
      tileDataIndexFn,
    );

    const sparsePalette = extractTilePaletteWithHint(
      pixels,
      width,
      tileX,
      tileY,
      dmgIndexed,
      "none",
    );
    expect(sparsePalette).toEqual(["ff00ff", "9394fe", "00ff00", "ff0000"]);
  });
});

describe("compressPalettes", () => {
  test("merges overlapping palettes down to 4 colors and maps all to palette 0", () => {
    const palettes = [
      ["111111"],
      ["222222"],
      ["111111", "222222"],
      ["333333"],
      ["333333", "444444"],
      ["444444"],
      ["111111", "333333"],
      ["222222", "444444"],
      ["111111", "222222", "333333", "444444"],
    ];
    const { palettes: out, mappingTable } = compressPalettes(palettes);

    // Should merge to at least one palette containing all four colors
    const mergedContainsAll = out.some((p) =>
      ["111111", "222222", "333333", "444444"].every((c) => p.includes(c)),
    );
    expect(mergedContainsAll).toBe(true);

    // Mapping table should map everything to a single palette index (0..7)
    expect(mappingTable).toHaveLength(palettes.length);
    expect(mappingTable.every((v) => v === 0)).toBe(true);
  });

  test("caps mapping table indices to 8 when unmergeable > 8 palettes", () => {
    const makePal = (i: number) => [
      (i * 4 + 1).toString(16).padStart(6, "0"),
      (i * 4 + 2).toString(16).padStart(6, "0"),
      (i * 4 + 3).toString(16).padStart(6, "0"),
      (i * 4 + 4).toString(16).padStart(6, "0"),
    ];
    const palettes = Array.from({ length: 9 }, (_, i) => makePal(i));
    const { mappingTable } = compressPalettes(palettes);
    expect(mappingTable).toHaveLength(9);
    // Index 8 should wrap to 0
    expect(mappingTable[8]).toBe(0);
    expect(mappingTable.every((v) => v >= 0 && v < 8)).toBe(true);
  });
});

describe("compressSparsePalettes", () => {
  test("merges compatible sparse palettes into a single palette", () => {
    const A: SparseHexPalette = ["111111", undefined, undefined, undefined];
    const B: SparseHexPalette = [undefined, "222222", undefined, undefined];
    const C: SparseHexPalette = [undefined, undefined, "333333", undefined];

    const { palettes, mappingTable } = compressSparsePalettes([A, B, C]);

    expect(palettes.length).toBe(1);
    expect(palettes[0]).toEqual(["111111", "222222", "333333", "000000"]);
    expect(mappingTable).toEqual([0, 0, 0]);
  });

  test("does not merge conflicting sparse palettes (different colors in same slot)", () => {
    const A: SparseHexPalette = ["111111", undefined, undefined, undefined];
    const B: SparseHexPalette = ["222222", undefined, undefined, undefined];

    const { palettes, mappingTable } = compressSparsePalettes([A, B]);

    expect(palettes.length).toBe(2);
    // Both resulting palettes must keep their first slot color
    const colorsAt0 = new Set(palettes.map((p) => p[0]));
    expect(colorsAt0.has("111111")).toBe(true);
    expect(colorsAt0.has("222222")).toBe(true);

    // Each original maps to a distinct palette index
    expect(new Set(mappingTable).size).toBe(2);
    expect(mappingTable).toHaveLength(2);
  });
});

describe("setUIPalette", () => {
  test("If UI palette is exactly matched in existing palettes, move the match to position 7", () => {
    const inputPalettes: HexPalette[] = [
      ["64a5ff", "ffad63", "9394fe", "000000"],
      ["833100", "ffad63", "8b8cde", "000000"],
      ["5b315b", "f7c4a5", "9394fe", "000000"],
      ["ffe7c5", "f7c4a5", "525252", "000000"],
      ["7bff30", "f7c4a5", "8b8cde", "000000"],
      ["833100", "5b315b", "9394fe", "000000"],
      ["833100", "ffad63", "000000", "000000"],
      ["833100", "008486", "000000", "000000"],
    ];
    const inputMappingTable = [0, 1, 2, 3, 4, 5, 6, 7];
    const { palettes, mappingTable } = setUIPalette(
      {
        palettes: inputPalettes,
        mappingTable: inputMappingTable,
      },
      ["64a5ff", "ffad63", "9394fe", "000000"],
    );
    expect(palettes).toHaveLength(8);
    expect(palettes[7]).toEqual(["64a5ff", "ffad63", "9394fe", "000000"]);
    expect(mappingTable).toEqual([7, 1, 2, 3, 4, 5, 6, 0]);
  });

  test("If UI palette is not exactly matched in existing palettes, move the closest match to position 7", () => {
    const inputPalettes: HexPalette[] = [
      ["64a5ff", "ffad63", "9394fe", "000000"],
      ["833100", "ffad63", "8b8cde", "000000"],
      ["5b315b", "f7c4a5", "9394fe", "000000"],
      ["ffe7c5", "f7c4a5", "525252", "000000"],
      ["7bff30", "f7c4a5", "8b8cde", "000000"],
      ["cc0000", "00ee00", "333333", "000000"],
      ["833100", "ffad63", "000000", "000000"],
      ["833100", "008486", "000000", "000000"],
    ];
    const inputMappingTable = [0, 1, 2, 3, 4, 5, 6, 7];
    const { palettes, mappingTable } = setUIPalette(
      {
        palettes: inputPalettes,
        mappingTable: inputMappingTable,
      },
      ["dd0000", "11dd22", "444444", "101010"],
    );
    expect(palettes).toHaveLength(8);
    expect(palettes[0]).toEqual(inputPalettes[0]);
    expect(palettes[1]).toEqual(inputPalettes[1]);
    expect(palettes[2]).toEqual(inputPalettes[2]);
    expect(palettes[3]).toEqual(inputPalettes[3]);
    expect(palettes[4]).toEqual(inputPalettes[4]);
    expect(palettes[5]).toEqual(inputPalettes[7]);
    expect(palettes[6]).toEqual(inputPalettes[6]);
    expect(palettes[7]).toEqual(["dd0000", "11dd22", "444444", "101010"]);
    expect(mappingTable).toEqual([0, 1, 2, 3, 4, 7, 6, 5]);
  });

  test("If UI palette is not provided, return unmodified data", () => {
    const inputPalettes: HexPalette[] = [
      ["64a5ff", "ffad63", "9394fe", "000000"],
      ["833100", "ffad63", "8b8cde", "000000"],
      ["5b315b", "f7c4a5", "9394fe", "000000"],
      ["ffe7c5", "f7c4a5", "525252", "000000"],
      ["7bff30", "f7c4a5", "8b8cde", "000000"],
      ["833100", "5b315b", "9394fe", "000000"],
      ["833100", "ffad63", "000000", "000000"],
      ["833100", "008486", "000000", "000000"],
    ];
    const inputMappingTable = [0, 1, 2, 3, 4, 5, 6, 7];
    const { palettes, mappingTable } = setUIPalette({
      palettes: inputPalettes,
      mappingTable: inputMappingTable,
    });
    expect(palettes).toEqual(inputPalettes);
    expect(mappingTable).toEqual(inputMappingTable);
  });

  test("If best UI palette match is outside of allowed range of 0-7, use the closest match within 0-7", () => {
    const inputPalettes: HexPalette[] = [
      ["64a5ff", "ffad63", "9394fe", "000000"],
      ["cc0000", "00ee00", "333333", "000000"],
      ["2b315b", "f7c4a5", "9394fe", "ffffff"],
      ["5b315b", "f7c4a5", "9394fe", "000000"],
      ["ffe7c5", "f7c4a5", "525252", "000000"],
      ["7bff30", "f7c4a5", "8b8cde", "000000"],
      ["833100", "ffad63", "000000", "000000"],
      ["833100", "008486", "000000", "000000"],
      ["dd0000", "11dd22", "444444", "101010"],
    ];
    const inputMappingTable = [0, 1, 2, 3, 4, 5, 6, 7];
    const { palettes, mappingTable } = setUIPalette(
      {
        palettes: inputPalettes,
        mappingTable: inputMappingTable,
      },
      ["dd0000", "11dd22", "444444", "101010"],
    );
    expect(palettes).toHaveLength(9);
    expect(palettes[0]).toEqual(inputPalettes[0]);
    expect(palettes[1]).toEqual(inputPalettes[7]);
    expect(palettes[2]).toEqual(inputPalettes[2]);
    expect(palettes[3]).toEqual(inputPalettes[3]);
    expect(palettes[4]).toEqual(inputPalettes[4]);
    expect(palettes[5]).toEqual(inputPalettes[5]);
    expect(palettes[6]).toEqual(inputPalettes[6]);
    expect(palettes[7]).toEqual(["dd0000", "11dd22", "444444", "101010"]);
    expect(mappingTable).toEqual([0, 7, 2, 3, 4, 5, 6, 1]);
  });
});

describe("fillVariablePalette", () => {
  const colorToIndex = (hex: string): number => {
    const color = chroma(hex);
    const [r, g, b] = color.rgb();
    return tileDataIndexFn(r, g, b, 255);
  };

  test("Empty palette → all zeros", () => {
    const result = fillVariablePalette([]);
    expect(result).toEqual(["000000", "000000", "000000", "000000"]);
  });

  test("Single color maps to correct index", () => {
    const result = fillVariablePalette(["ff0000"]);
    const idx = tileDataIndexFn(...chroma("ff0000").rgb(), 255);
    const expected = ["000000", "000000", "000000", "000000"];
    expected[idx] = "ff0000";
    expect(result).toEqual(expected);
  });

  test("Two colors with unique indices fill correct slots", () => {
    const a = "ff0000";
    const b = "00ff00";

    const idxA = tileDataIndexFn(...chroma(a).rgb(), 255);
    const idxB = tileDataIndexFn(...chroma(b).rgb(), 255);

    const result = fillVariablePalette([a, b]);

    const expected = ["000000", "000000", "000000", "000000"];
    expected[idxA] = a;
    expected[idxB] = b;

    expect(result).toEqual(expected);
  });

  test("Overflow goes backward from mapped index when no space forwards", () => {
    const c1 = "060606";
    const c2 = "111111";
    const c3 = "222222";

    const result = fillVariablePalette([c1, c2, c3]);
    const expected = ["000000", c3, c2, c1];

    expect(colorToIndex(c1)).toBe(3);
    expect(colorToIndex(c2)).toBe(3);
    expect(colorToIndex(c3)).toBe(3);

    expect(result).toEqual(expected);
  });

  test("Real '000000' is treated as normal color", () => {
    const black = "000000";
    const dark = "666666";

    const idxBlack = tileDataIndexFn(...chroma(black).rgb(), 255);
    const idxDark = tileDataIndexFn(...chroma(dark).rgb(), 255);

    const result = fillVariablePalette([black, dark]);

    const expected = ["000000", "000000", "000000", "000000"];
    expected[idxBlack] = black;
    expected[idxDark] = dark;

    expect(result).toEqual(expected);
  });

  test("Multiple groups place winners and overflow in correct order", () => {
    const c1 = "ffffff";
    const c2 = "888888";
    const c3 = "333333";
    const c4 = "000000";

    const idx1 = colorToIndex(c1);
    const idx2 = colorToIndex(c2);

    const result = fillVariablePalette([c1, c2, c3, c4]);

    expect(result[idx1]).toBe(c1);
    expect(result[idx2]).toBe(c2);
    expect(result.length).toBe(4);

    expect(result).toContain(c3);
    expect(result).toContain(c4);

    const positions = result.map((hex) => ({ hex, pos: result.indexOf(hex) }));
    expect(positions.every((p) => p.pos >= 0)).toBe(true);
  });

  test("Colors with controlled lightness ordering resolve consistently", () => {
    const cA = "ffffff";
    const cB = "777777";
    const cC = "444444";
    const cD = "000000";

    const palette = [cA, cB, cC, cD];
    const r1 = fillVariablePalette(palette);
    const r2 = fillVariablePalette(palette);

    expect(r1).toEqual(r2);
    expect(r1).toContain(cA);
    expect(r1).toContain(cB);
    expect(r1).toContain(cC);
    expect(r1).toContain(cD);
  });

  test("Colors exactly on brightness anchors resolve correctly", () => {
    const c0 = "ffffff";
    const c1 = "b0b0b0";
    const c2 = "555555";
    const c3 = "000000";

    const result = fillVariablePalette([c0, c1, c2, c3]);

    const idx0 = colorToIndex(c0);
    const idx1 = colorToIndex(c1);
    const idx2 = colorToIndex(c2);
    const idx3 = colorToIndex(c3);

    const expected = ["000000", "000000", "000000", "000000"];
    expected[idx0] = c0;
    expected[idx1] = c1;
    expected[idx2] = c2;
    expected[idx3] = c3;

    expect(result).toEqual(expected);
  });

  test("Overflow does not overwrite claimed slots and follows ordering", () => {
    const c1 = "ffffff";
    const c2 = "eeeeee";
    const c3 = "dddddd";
    const c4 = "cccccc";

    const idx = colorToIndex(c1);
    const result = fillVariablePalette([c1, c2, c3, c4]);

    expect(result[idx]).toBe(c1);
    expect(result.includes(c2)).toBe(true);
    expect(result.includes(c3)).toBe(true);
    expect(result.includes(c4)).toBe(true);

    const placed = result.slice().filter(Boolean);
    expect(placed.length).toBe(4);
  });

  test("Tied brightness-distance clash produces a stable deterministic winner", () => {
    const cA = "5f5f5f";
    const cB = "606060";

    const idxA = colorToIndex(cA);
    const idxB = colorToIndex(cB);

    expect(idxA).toBe(idxB);

    const palette = [cA, cB];

    const r1 = fillVariablePalette(palette);
    const r2 = fillVariablePalette(palette);
    expect(r1).toEqual(r2);

    expect([cA, cB]).toContain(r1[idxA]);

    expect(r1.includes(cA)).toBe(true);
    expect(r1.includes(cB)).toBe(true);
  });

  test("Overflow never overwrites already-claimed slots", () => {
    const c1 = "ffffff";
    const c2 = "eeeeee";
    const c3 = "dddddd";
    const c4 = "cccccc";

    const idx = colorToIndex(c1);

    const result = fillVariablePalette([c1, c2, c3, c4]);

    expect(result[idx]).toBe(c1);
    expect(result.includes(c4)).toBe(true);
  });

  test("More than four colors resolve to exactly four slots", () => {
    const palette = [
      "ffffff",
      "eeeeee",
      "dddddd",
      "cccccc",
      "bbbbbb",
      "aaaaaa",
    ];

    const result = fillVariablePalette(palette);

    expect(result.length).toBe(4);
    expect(result).not.toContain(undefined);

    const unique = new Set(result);
    expect(unique.size).toBeGreaterThanOrEqual(2);
  });

  test("Palette containing '000000' with multiple clashes resolves in correct order", () => {
    const c1 = "000000";
    const c2 = "101010";
    const c3 = "f0f0f0";
    const c4 = "ffffff";

    const palette = [c1, c2, c3, c4];
    const r1 = fillVariablePalette(palette);
    const r2 = fillVariablePalette(palette);

    expect(r1).toEqual(r2);
    expect(r1).toContain(c1);
    expect(r1).toContain(c2);
    expect(r1).toContain(c3);
    expect(r1).toContain(c4);
  });
});

describe("fillVariablePalettes", () => {
  test("Maps over multiple palettes", () => {
    const input = [["ff0000"], ["00ff00"], ["0000ff", "ff0000"]];

    const result = fillVariablePalettes(input);

    expect(result.length).toBe(3);
    result.forEach((p) => expect(p.length).toBe(4));
  });
});
